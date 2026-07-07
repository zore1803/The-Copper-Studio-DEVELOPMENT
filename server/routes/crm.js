import express from "express";
import Company from "../models/Company.js";
import Contact from "../models/Contact.js";
import Coupon from "../models/Coupon.js";
import CrmLead from "../models/CrmLead.js";
import Deal from "../models/Deal.js";
import Task from "../models/Task.js";
import Project from "../models/Project.js";
import Document from "../models/Document.js";
import Meeting from "../models/Meeting.js";
import Note from "../models/Note.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import Invoice from "../models/Invoice.js";
import EmailTemplate from "../models/EmailTemplate.js";
import User from "../models/User.js";
import { syncPaidOrderFinance, syncStandaloneProjectInvoices } from "../services/finance.js";
import { buildProjectCode, buildDefaultProjectName } from "../services/projectNaming.js";
import { nextInvoiceNumber } from "../services/invoiceNumber.js";
import { sendContactCreatedEmail } from "../services/email.js";
import { syncScheduledEventsToMeetings } from "../services/calendly.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = express.Router();

// Throttle record creation to stop accidental double-submits and abuse.
// Coupons get a tighter budget because each one is a distinct marketing asset.
const couponCreateLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  name: "coupon-create",
  message: "Too many coupons created in a short time. Please wait a minute before creating more."
});
const writeLimiter = rateLimit({ windowMs: 60_000, max: 40, name: "crm-write" });

function createLimiter(req, res, next) {
  return (req.params.type === "coupons" ? couponCreateLimiter : writeLimiter)(req, res, next);
}
const models = {
  companies: Company,
  contacts: Contact,
  coupons: Coupon,
  deals: Deal,
  leads: CrmLead,
  tasks: Task,
  projects: Project,
  documents: Document,
  meetings: Meeting,
  notes: Note,
  orders: Order,
  payments: Payment,
  invoices: Invoice,
  emailTemplates: EmailTemplate
};

const companyLinkedTypes = new Set(["projects", "documents", "meetings", "notes"]);

const expirableCouponStatuses = ["Active", "Applied", "Not used"];

function validateType(req, res, next) {
  if (!models[req.params.type]) {
    return res.status(404).json({ message: "CRM collection not found." });
  }
  next();
}

function asPublicRecord(record) {
  const data = record.toObject();
  return { ...data, id: data.id || data._id.toString(), _id: data._id.toString() };
}

function toDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function couponPayload(body) {
  const payload = { ...body };
  const validUntil = toDate(payload.validUntil || payload.validity);
  if (validUntil) {
    payload.validUntil = validUntil;
    payload.validity = validUntil.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      hour12: true
    });
  }
  if (payload.status === "Revoked" && !payload.revokedAt) payload.revokedAt = new Date();
  if (payload.status === "Redeemed" && !payload.redeemedAt) payload.redeemedAt = new Date();
  return payload;
}

async function expireOldCoupons() {
  await Coupon.updateMany(
    { status: { $in: expirableCouponStatuses }, validUntil: { $lte: new Date() } },
    { $set: { status: "Expired" } }
  );
}

async function withClientLink(type, payload) {
  if (!companyLinkedTypes.has(type) || !payload.companyId || payload.clientId) return payload;
  const company = await Company.findById(payload.companyId).select("userId userIds").catch(() => null);
  const primaryClientId = company?.userIds?.[0] || company?.userId;
  if (primaryClientId) return { ...payload, clientId: primaryClientId };
  return payload;
}

// A record's `clientId` only tracks one "primary" client account for legacy
// admin views — actual client-portal visibility for companies with several
// linked accounts is resolved by company membership (see routes/client.js),
// not by this field, so we just keep it pointed at the first linked user.
async function cascadeClientLink(companyId, userIds) {
  const primaryClientId = (Array.isArray(userIds) ? userIds[0] : userIds) || null;
  const filter = { companyId };
  const update = { $set: { clientId: primaryClientId } };
  await Promise.all([
    Project.updateMany(filter, update),
    Document.updateMany(filter, update),
    Meeting.updateMany(filter, update),
    Note.updateMany(filter, update),
    Invoice.updateMany(filter, update),
    Payment.updateMany(filter, update)
  ]);
}

// Clients who buy a package at checkout no longer enter a company name, so the
// project/invoice/etc. created from their paid order are orphaned with a null
// companyId. When an admin later links that client to a company, adopt those
// orphan records into the company: stamp the companyId so they file under it
// (making the project visible in the Document Center), and rename each project
// from the buyer's free-text name to the coded "<Company>-Project N-MMYY" format
// with a matching CS-XXXX-NN-MMYY code. The buyer's original wording is preserved
// in clientProjectName. Kept driver-agnostic: we load by clientId then filter for
// the company-less records in JS rather than relying on $exists/null semantics.
async function adoptOrphansIntoCompany(company, userIds) {
  if (!company?._id || !userIds?.length) return;
  const ids = userIds.map(String).filter(Boolean);
  if (!ids.length) return;

  const companyId = company._id;
  const companyName = company.name || "";
  const hasNoCompany = (record) => !record.companyId;

  // Projects need per-record renaming + sequential numbering within the company.
  const clientProjects = await Project.find({ clientId: { $in: ids } }).catch(() => []);
  const orphanProjects = clientProjects
    .filter(hasNoCompany)
    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

  let projectNumber = await Project.countDocuments({ companyId }).catch(() => 0);
  for (const project of orphanProjects) {
    projectNumber += 1;
    const created = project.createdAt ? new Date(project.createdAt) : new Date();
    await Project.findByIdAndUpdate(project._id, {
      companyId,
      companyName,
      client: companyName,
      name: buildDefaultProjectName(companyName, projectNumber, created),
      projectId: buildProjectCode(companyName, projectNumber, created),
      clientProjectName: project.clientProjectName || project.name || ""
    }).catch(() => {});
  }

  // Finance + collateral records only need the company stamped onto them.
  const collateral = [
    [Invoice, { company: companyName }],
    [Payment, { company: companyName }],
    [Document, {}],
    [Meeting, {}],
    [Note, {}]
  ];
  for (const [Model, extra] of collateral) {
    const records = await Model.find({ clientId: { $in: ids } }).catch(() => []);
    await Promise.all(
      records
        .filter(hasNoCompany)
        .map((record) => Model.findByIdAndUpdate(record._id, { companyId, ...extra }).catch(() => {}))
    );
  }
}

// Trigger when a company's member list changes (company-side linking).
async function adoptOrphanRecordsForCompany(company) {
  if (!company?._id) return;
  const userIds = [...(company.userIds || []), ...(company.userId ? [company.userId] : [])];
  await adoptOrphansIntoCompany(company, userIds);
}

// Trigger when a contact is assigned to a company (the actual admin flow:
// Contact card -> set company). The contact references its company by the
// free-text `id` field, not the Mongo _id, and is matched to the buyer's portal
// login by email (the contact created at checkout has no userId yet), so we
// resolve both here, back-fill the contact->login link, then adopt the buyer's
// orphan project/finance records into the company.
async function adoptOrphanRecordsForContact(contact) {
  if (!contact?.companyId && !contact?.company) return;

  let company = null;
  if (contact.companyId) {
    company = await Company.findById(contact.companyId).catch(() => null);
    if (!company) company = await Company.findOne({ id: contact.companyId }).catch(() => null);
  }
  if (!company && contact.company) {
    company = await Company.findOne({ name: contact.company }).catch(() => null);
  }
  if (!company) return;

  let user = contact.userId ? await User.findById(contact.userId).catch(() => null) : null;
  if (!user && contact.email) {
    user = await User.findOne({ email: String(contact.email).toLowerCase() }).catch(() => null);
  }
  if (!user) return;

  // Wire the contact to the resolved login so client-portal visibility resolves.
  if (!contact.userId && contact._id) {
    await Contact.findByIdAndUpdate(contact._id, { userId: user._id }).catch(() => {});
  }

  await adoptOrphansIntoCompany(company, [user._id]);
}

// A contact isn't just a directory entry — the client (once they get a portal
// login) needs a project to see and an invoice to be billed against. Rather
// than leave that to a separate admin step that's easy to forget, provision a
// blank starter Project + zero-amount Draft Invoice right when the contact is
// created, as long as they don't already have one (e.g. adoptOrphanRecordsForContact
// above already gave them a real project from a paid checkout). Both are
// deliberately blank/zero — total, package, and status ("Draft") are left for
// the admin to fill in with the real numbers; this only guarantees the record
// (and therefore client-portal visibility) exists from day one.
async function autoProvisionProjectAndInvoice(contact) {
  if (!contact?.companyId && !contact?.company) return;

  let company = null;
  if (contact.companyId) {
    company = await Company.findById(contact.companyId).catch(() => null);
    if (!company) company = await Company.findOne({ id: contact.companyId }).catch(() => null);
  }
  if (!company && contact.company) {
    company = await Company.findOne({ name: contact.company }).catch(() => null);
  }
  if (!company) return;

  const alreadyHasProject = await Project.exists({
    $or: [
      ...(contact.userId ? [{ clientId: contact.userId }] : []),
      { _id: { $in: contact.projectIds || [] } }
    ]
  }).catch(() => null);
  if (alreadyHasProject) return;

  const companyName = company.name || contact.company || "";
  const projectNumber = (await Project.countDocuments({ companyId: company._id }).catch(() => 0)) + 1;
  const now = new Date();

  const project = await Project.create({
    name: buildDefaultProjectName(companyName, projectNumber, now),
    projectId: buildProjectCode(companyName, projectNumber, now),
    companyId: company._id,
    companyName,
    client: companyName,
    clientId: contact.userId || null,
    status: "not_started"
  }).catch(() => null);
  if (!project) return;

  await Contact.findByIdAndUpdate(contact._id, { $addToSet: { projectIds: project._id } }).catch(() => {});

  await Invoice.create({
    invoiceNumber: await nextInvoiceNumber(now),
    projectId: project._id,
    companyId: company._id,
    clientId: contact.userId || null,
    company: companyName,
    client: contact.name || "",
    customerEmail: contact.email || "",
    project: project.name,
    package: "",
    total: 0,
    amount: 0,
    status: "Draft",
    paymentStatus: "Draft",
    clientVisible: true
  }).catch(() => {});
}

router.get("/:type", validateType, async (req, res, next) => {
  try {
    const Model = models[req.params.type];
    if (req.params.type === "coupons") await expireOldCoupons();
    if (["payments", "invoices"].includes(req.params.type)) await syncPaidOrderFinance();
    if (req.params.type === "invoices") await syncStandaloneProjectInvoices();
    if (req.params.type === "meetings") {
      await syncScheduledEventsToMeetings().catch((err) => console.error("Calendly sync failed:", err.message));
    }
    const records = await Model.find({}).sort({ updatedAt: -1 });
    let mapped = records.map(asPublicRecord);

    // Attach each linked portal login's status so the Contacts list can flag
    // a self-deactivated account (and let admin reactivate it) without a
    // separate lookup per row.
    if (req.params.type === "contacts") {
      const userIds = [...new Set(mapped.map((c) => c.userId).filter(Boolean).map(String))];
      if (userIds.length) {
        const users = await User.find({ _id: { $in: userIds } }).select("status").catch(() => []);
        const statusById = new Map(users.map((u) => [String(u._id), u.status]));
        mapped = mapped.map((c) => (c.userId ? { ...c, portalStatus: statusById.get(String(c.userId)) || null } : c));
      }
    }

    res.json(mapped);
  } catch (error) {
    next(error);
  }
});

router.post("/:type", createLimiter, validateType, async (req, res, next) => {
  try {
    const { type } = req.params;
    const Model = models[type];
    let payload = type === "coupons" ? couponPayload(req.body) : req.body;
    payload = await withClientLink(type, payload);
    const record = await Model.create(payload);
    if (type === "contacts") {
      sendContactCreatedEmail({ name: record.name, email: record.email, phone: record.phone, company: record.company }).catch(() => {});
    }
    if (type === "companies" && (record.userIds?.length || record.userId)) {
      await adoptOrphanRecordsForCompany(record);
    }
    if (type === "contacts" && (record.companyId || record.company)) {
      await adoptOrphanRecordsForContact(record);
      const refreshed = await Contact.findById(record._id).catch(() => record);
      await autoProvisionProjectAndInvoice(refreshed);
    }
    res.status(201).json(asPublicRecord(record));
  } catch (error) {
    next(error);
  }
});

router.put("/:type/:id", validateType, async (req, res, next) => {
  try {
    const { type } = req.params;
    const Model = models[type];
    let payload = type === "coupons" ? couponPayload(req.body) : req.body;
    payload = await withClientLink(type, payload);
    const record = await Model.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!record) return res.status(404).json({ message: "CRM record not found." });
    if (type === "companies" && (Object.prototype.hasOwnProperty.call(payload, "userId") || Object.prototype.hasOwnProperty.call(payload, "userIds"))) {
      await cascadeClientLink(record._id, record.userIds?.length ? record.userIds : record.userId);
      await adoptOrphanRecordsForCompany(record);
    }
    if (type === "contacts" && (record.companyId || record.company)) {
      await adoptOrphanRecordsForContact(record);
    }
    // A contact IS the client's portal login — keep the linked User's display
    // name in sync so a name edit here (Contacts) actually shows up on the
    // client side (dashboard greeting, sidebar, etc.), not just in the CRM.
    if (type === "contacts" && record.userId && Object.prototype.hasOwnProperty.call(payload, "name") && record.name) {
      await User.findByIdAndUpdate(record.userId, { name: record.name }).catch(() => {});
    }
    // A coupon code newly attached to an invoice here (e.g. via Edit Invoice)
    // needs the same "used" bookkeeping checkout/manual-invoice creation
    // already does, or it stays Active/Not used and looks reusable forever.
    if (type === "invoices" && Object.prototype.hasOwnProperty.call(payload, "couponCode") && payload.couponCode) {
      const code = String(payload.couponCode).trim().toUpperCase();
      const coupon = await Coupon.findOne({ code }).catch(() => null);
      if (coupon && ["Active", "Not used"].includes(coupon.status)) {
        coupon.status = "Redeemed";
        coupon.redeemedAt = new Date();
        await coupon.save().catch(() => {});
      }
    }
    // The Payment record is a separate collection created alongside the
    // Invoice at the same moment (both keyed by sourceOrderId, see
    // syncFinanceForOrder) — editing the Invoice here never touched it, so
    // the Payments page kept showing the pre-edit amount/coupon forever.
    if (type === "invoices" && record.sourceOrderId) {
      const paymentChanges = {};
      if (Object.prototype.hasOwnProperty.call(payload, "total") || Object.prototype.hasOwnProperty.call(payload, "amount")) {
        paymentChanges.amount = record.total ?? record.amount;
      }
      if (Object.prototype.hasOwnProperty.call(payload, "couponCode")) paymentChanges.couponCode = record.couponCode;
      if (Object.prototype.hasOwnProperty.call(payload, "razorpayPaymentId") && record.razorpayPaymentId) {
        paymentChanges.razorpayPaymentId = record.razorpayPaymentId;
        paymentChanges.paymentId = record.razorpayPaymentId; // this is the field the Payments table actually displays
      }
      if (Object.prototype.hasOwnProperty.call(payload, "issueDate") || Object.prototype.hasOwnProperty.call(payload, "date")) {
        paymentChanges.paidAt = record.issueDate || record.date;
      }
      if (Object.keys(paymentChanges).length) {
        await Payment.findOneAndUpdate({ sourceOrderId: record.sourceOrderId }, { $set: paymentChanges }).catch(() => {});
      }
    }
    res.json(asPublicRecord(record));
  } catch (error) {
    next(error);
  }
});

// Kept driver-agnostic (works on both Mongo and the Supabase fallback): we
// find() then delete each by id, and unlink array references by loading,
// modifying, and saving the parent record.
async function deleteEachById(Model, records) {
  await Promise.all(
    records.map((r) =>
      Model.findByIdAndDelete(r._id).catch((err) =>
        console.warn(`Cascade delete failed for ${Model.modelName || Model.table}/${r._id}:`, err.message)
      )
    )
  );
}

// Remove a (now-deleted) portal user from every company's userIds/userId links.
async function unlinkUserFromCompanies(userId) {
  if (!userId) return;
  const uid = String(userId);
  const companies = await Company.find({}).catch(() => []);
  for (const company of companies) {
    const ids = (company.userIds || []).map(String);
    const isMember = ids.includes(uid);
    const isPrimary = company.userId && String(company.userId) === uid;
    if (!isMember && !isPrimary) continue;
    company.userIds = ids.filter((id) => id !== uid);
    if (isPrimary) company.userId = company.userIds[0] || null;
    await company.save().catch((err) => console.warn(`Failed to unlink user ${uid} from company ${company._id}:`, err.message));
  }
}

// When a record is deleted from the admin side, also remove the records that
// only exist because of it — most importantly the provisioned client-portal
// login — so nothing is left orphaned in the database.
async function cascadeDelete(type, record) {
  if (type === "contacts") {
    // A contact IS a client: drop its portal login and unlink it everywhere.
    // The login is looked up by userId when linked, but also falls back to a
    // match on email — client-portal auth matches contacts by email, so a
    // User record can exist (and still be able to log in) even when it was
    // never linked back via contact.userId.
    const email = String(record.email || "").trim().toLowerCase();
    const user = record.userId
      ? await User.findById(record.userId).catch(() => null)
      : email
        ? await User.findOne({ email }).catch(() => null)
        : null;
    if (user) {
      await User.findByIdAndDelete(user._id).catch(() => {});
      await unlinkUserFromCompanies(user._id);
    }
    return;
  }

  if (type === "companies") {
    const companyId = String(record._id);
    const contacts = await Contact.find({ $or: [{ companyId }, { company: record.name }] }).catch(() => []);

    // Delete every portal login linked to the company (its own + its contacts').
    // Contacts without a stored userId still fall back to an email match, same
    // as the single-contact delete path above.
    const contactsWithoutUserId = contacts.filter((c) => !c.userId && c.email);
    const emailMatchedUsers = contactsWithoutUserId.length
      ? await User.find({ email: { $in: contactsWithoutUserId.map((c) => String(c.email).trim().toLowerCase()) } }).catch(() => [])
      : [];
    const userIds = [
      ...(record.userIds || []),
      ...(record.userId ? [record.userId] : []),
      ...contacts.map((c) => c.userId).filter(Boolean),
      ...emailMatchedUsers.map((u) => u._id)
    ];
    await Promise.all(
      [...new Set(userIds.map(String))].map((uid) => User.findByIdAndDelete(uid).catch(() => {}))
    );

    // Delete the contacts and every company-scoped record.
    await deleteEachById(Contact, contacts);
    for (const Model of [Project, Document, Meeting, Note]) {
      const linked = await Model.find({ companyId }).catch(() => []);
      await deleteEachById(Model, linked);
    }
    return;
  }

  if (type === "projects") {
    const projectId = String(record._id);
    const [tasks, docs] = await Promise.all([
      Task.find({ project: record.name }).catch(() => []),
      Document.find({ projectId }).catch(() => [])
    ]);
    await deleteEachById(Task, tasks);
    await deleteEachById(Document, docs);
    return;
  }
}

router.delete("/:type/:id", validateType, async (req, res, next) => {
  try {
    const Model = models[req.params.type];
    const record = await Model.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: "CRM record not found." });
    // Cascade cleanup never blocks the delete response; failures are logged.
    await cascadeDelete(req.params.type, record).catch((err) =>
      console.warn(`Cascade cleanup error for ${req.params.type}/${req.params.id}:`, err.message)
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
