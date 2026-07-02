import bcrypt from "bcryptjs";
import express from "express";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Project from "../models/Project.js";
import Document from "../models/Document.js";
import Meeting from "../models/Meeting.js";
import Task from "../models/Task.js";
import Contact from "../models/Contact.js";
import Invoice from "../models/Invoice.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { syncScheduledEventsToMeetings } from "../services/calendly.js";

const router = express.Router();

router.use(requireAuth);

// A client portal login is linked to one specific Contact, which is granted
// access to specific projects (not every project under their company) — see
// `Contact.userId` / `Contact.projectIds`. A logged-in client's visible
// records are everything tagged with their own legacy `clientId` PLUS
// whatever projects their linked contact was explicitly given.
async function resolveClientProjectIds(clientId) {
  const id = String(clientId);
  const contacts = await Contact.find({ userId: clientId }).select("projectIds");
  const ids = new Set();
  for (const contact of contacts) {
    for (const projectId of contact.projectIds || []) ids.add(String(projectId));
  }
  return [...ids];
}

async function projectsVisibilityFilter(clientId) {
  const projectIds = await resolveClientProjectIds(clientId);
  return projectIds.length
    ? { $or: [{ clientId }, { _id: { $in: projectIds } }, { id: { $in: projectIds } }] }
    : { clientId };
}

async function projectScopedVisibilityFilter(clientId) {
  const projectIds = await resolveClientProjectIds(clientId);
  return projectIds.length
    ? { $or: [{ clientId }, { projectId: { $in: projectIds } }] }
    : { clientId };
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    company: user.company || "",
    jobTitle: user.jobTitle || "",
    role: user.role,
    status: user.status,
    preferences: user.preferences || {}
  };
}

router.get("/profile", async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub);
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.put("/profile", async (req, res, next) => {
  try {
    const { name, phone, company, jobTitle, preferences } = req.body;
    const user = await User.findById(req.auth.sub);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (company !== undefined) user.company = company.trim();
    if (jobTitle !== undefined) user.jobTitle = jobTitle.trim();
    if (preferences && typeof preferences === "object") {
      user.preferences = { ...(user.preferences || {}), ...preferences };
    }
    await user.save();
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.put("/change-password", async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "Current password and a new 8+ character password are required." });
    }
    const user = await User.findById(req.auth.sub);
    if (!user) return res.status(404).json({ message: "User not found." });

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(400).json({ message: "Current password is incorrect." });

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get("/orders", async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub);
    if (!user) return res.status(404).json({ message: "User not found." });
    // Billing always shows every order/invoice — the admin's "client visible"
    // toggle only governs the client Documents section, not billing. An invoice
    // is a record of a real purchase, so it must stay here regardless.
    const orders = await Order.find({ "customer.customerEmail": user.email }).sort({ createdAt: -1 });

    // Manual / admin-created projects produce an Invoice but NO Order, so those
    // purchases never showed up in the client's billing (it counted only orders).
    // Surface such invoices as order-shaped entries. To avoid double-counting the
    // online flow, only include invoices whose project has no order behind it.
    const invoices = await Invoice.find({ $or: [{ clientId: user._id }, { customerEmail: user.email }] }).sort({ createdAt: -1 });
    const standaloneProjectIds = invoices.map((inv) => inv.projectId).filter(Boolean);
    const projects = standaloneProjectIds.length
      ? await Project.find({ _id: { $in: standaloneProjectIds } }).select("_id name orderId").catch(() => [])
      : [];
    const projectById = new Map(projects.map((p) => [String(p._id), p]));
    const invoiceOrders = invoices
      .filter((inv) => {
        const proj = inv.projectId ? projectById.get(String(inv.projectId)) : null;
        return !proj?.orderId; // keep only invoices with no Order (order-based ones are already listed)
      })
      .map((inv) => {
        const proj = inv.projectId ? projectById.get(String(inv.projectId)) : null;
        return {
          _id: inv._id,
          projectName: proj?.name || inv.project || "",
          package: { name: inv.package || inv.project || "Invoice", total: inv.total ?? inv.amount ?? 0 },
          customer: { customerEmail: user.email, projectName: proj?.name || inv.project || "" },
          payment: {
            status: inv.paymentStatus || inv.status || "paid",
            invoiceId: inv.invoiceNumber || inv.invoiceId,
            couponCode: inv.couponCode || "",
            paidAt: inv.paidAt || inv.issueDate || inv.date || inv.createdAt,
          },
          createdAt: inv.issueDate || inv.date || inv.createdAt,
        };
      });

    res.json([...orders, ...invoiceOrders]);
  } catch (error) {
    next(error);
  }
});

router.get("/projects", async (req, res, next) => {
  try {
    const filter = await projectsVisibilityFilter(req.auth.sub);
    const projects = await Project.find(filter).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

router.get("/projects/:id/tasks", async (req, res, next) => {
  try {
    const filter = await projectsVisibilityFilter(req.auth.sub);
    const project = await Project.findOne({ $and: [{ _id: req.params.id }, filter] });
    if (!project) return res.status(404).json({ message: "Project not found." });

    const projectIds = [String(project._id), project.id].filter(Boolean);
    const tasks = await Task.find({
      $or: [{ projectId: { $in: projectIds } }, { project: { $in: projectIds } }]
    }).sort({ startDate: 1, createdAt: 1 });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

router.get("/documents", async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub);
    if (!user) return res.status(404).json({ message: "User not found." });

    const filter = await projectScopedVisibilityFilter(req.auth.sub);
    const projFilter = await projectsVisibilityFilter(req.auth.sub);

    // 1. Fetch from the documents collection
    const docsCollection = await Document.find({
      $and: [filter, { scope: { $ne: "internal" } }, { clientVisible: { $ne: false } }]
    }).sort({ createdAt: -1 });

    // Fetch projects to map info and extract embedded docs
    const projects = await Project.find(projFilter).lean();

    const collectionDocs = docsCollection.map((doc) => {
      const project = projects.find((p) => String(p._id || p.id) === String(doc.projectId));
      return {
        ...doc.toObject(),
        id: doc._id || doc.id,
        projectId: doc.projectId,
        companyId: doc.companyId || project?.companyId,
        projectName: project?.name || project?.projectName || "Project",
        visibility: doc.visibility || (doc.scope === "internal" ? "internal" : "client"),
        folderPath: `${project?.name || "Project"} / ${doc.category || "Files"}`,
        fileName: doc.fileName || doc.name,
        fileUrl: doc.fileUrl,
      };
    });

    // 2. Fetch from the embedded project.documents
    const embeddedDocs = projects.flatMap((project) =>
      (project.documents || [])
        .filter(doc => doc.visibility !== "internal" && doc.category !== "Internal" && doc.scope !== "internal" && doc.clientVisible !== false)
        .map((doc) => ({
          ...doc,
          id: doc._id || doc.id,
          projectId: project.id || project._id,
          companyId: project.companyId,
          projectName: project.name || project.projectName,
          visibility: doc.visibility || "client",
          folderPath: `${project.name || "Project"} / ${doc.category || "Files"}`,
          fileName: doc.fileName || doc.name,
          fileUrl: doc.fileUrl,
        }))
    );

    // 3. Fetch from invoices (represented as PDF documents)
    const userInvoices = await Invoice.find({
      $or: [{ clientId: user._id }, { customerEmail: user.email }]
    }).sort({ createdAt: -1 }).lean();

    // Only surface an invoice under Documents once we can pin it to exactly one
    // of the client's visible projects — an invoice with no resolvable project
    // has no projectId, and the frontend treats a missing projectId as
    // "belongs to every project", which used to leak that invoice into every
    // project's document list instead of just its own.
    const invoiceDocs = userInvoices
      .filter(inv => inv.clientVisible !== false)
      .map((inv) => {
        const project = projects.find(
          (p) =>
            (inv.projectId && String(p._id || p.id) === String(inv.projectId)) ||
            (inv.sourceOrderId && p.orderId && String(p.orderId) === String(inv.sourceOrderId))
        );
        return { inv, project };
      })
      .filter(({ project }) => project)
      .map(({ inv, project }) => {
        const pName = project.name || project.projectName || "Project";
        const pId = project._id || project.id;

        return {
          _id: inv._id || inv.id,
          id: inv._id || inv.id,
          name: `Tax Invoice - ${inv.invoiceNumber || inv.id}.pdf`,
          fileName: `Tax Invoice - ${inv.invoiceNumber || inv.id}.pdf`,
          fileType: "pdf",
          category: "Invoices",
          tags: ["Invoice", "Receipt"],
          projectId: pId,
          companyId: inv.companyId || project.companyId,
          projectName: pName,
          visibility: "client",
          status: "final_delivery",
          folderPath: `${pName} / Invoices`,
          fileUrl: `/api/invoices/${inv._id || inv.id || inv.invoiceNumber}/pdf`,
          createdAt: inv.createdAt || inv.date || inv.paidAt,
        };
      });

    // A project should only ever have one invoice attached — if duplicates
    // exist, keep only the most recent. invoiceDocs is already sorted
    // newest-first, so keep the first occurrence per projectId (a plain Map
    // built from [key, value] pairs would instead keep the *last* — i.e.
    // oldest — occurrence, since later .set() calls for the same key win).
    const seenInvoiceProjectIds = new Set();
    const latestInvoicePerProject = invoiceDocs.filter((doc) => {
      const key = String(doc.projectId);
      if (seenInvoiceProjectIds.has(key)) return false;
      seenInvoiceProjectIds.add(key);
      return true;
    });

    const allDocs = [...collectionDocs, ...embeddedDocs, ...latestInvoicePerProject];
    // Sort combined list by createdAt descending
    allDocs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    res.json(allDocs);
  } catch (error) {
    next(error);
  }
});

router.get("/meetings", async (req, res, next) => {
  try {
    // Pull in anything booked directly through Calendly that the webhook
    // hasn't (or never will) deliver — safe to skip on failure since the
    // client should still see whatever's already in the database.
    await syncScheduledEventsToMeetings().catch((err) => console.error("Calendly sync failed:", err.message));

    // Meetings are personal, not project-shared: a client should only ever see
    // a meeting they themselves requested/booked, matched either by their
    // account id (portal requests) or the email they used to book with
    // Calendly (calendly.js resolves clientId by email too, but this also
    // catches meetings where that lookup missed, e.g. a stale/typo'd email).
    const email = String(req.auth.email || "").toLowerCase();
    const meetings = await Meeting.find({
      $or: [
        { clientId: req.auth.sub },
        ...(email ? [{ "participants.email": { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } }] : []),
      ],
    }).sort({ createdAt: -1 });
    res.json(meetings);
  } catch (error) {
    next(error);
  }
});

router.post("/meetings", async (req, res, next) => {
  try {
    const { title, type, preferredDate, preferredTime, agenda, projectId } = req.body;
    if (!title) return res.status(400).json({ message: "Meeting title is required." });

    const meeting = await Meeting.create({
      title,
      type: type || "discovery_session",
      clientId: req.auth.sub,
      projectId: projectId || undefined,
      preferredDate: preferredDate ? new Date(preferredDate) : undefined,
      preferredTime: preferredTime || "",
      agenda: agenda || "",
      status: "requested"
    });
    res.status(201).json(meeting);
  } catch (error) {
    next(error);
  }
});

export default router;
