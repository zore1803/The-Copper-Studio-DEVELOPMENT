import express from "express";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Project from "../models/Project.js";
import Document from "../models/Document.js";
import Meeting from "../models/Meeting.js";
import Contact from "../models/Contact.js";
import Company from "../models/Company.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { ensureClientAccount, sendPortalInvite } from "../services/portalInvite.js";
import { syncScheduledEventsToMeetings } from "../services/calendly.js";
import { notifyAccountStatusChange } from "../services/accountNotifications.js";

const router = express.Router();

router.use(requireAuth, requireRole("superadmin"));

function contactDisplayName(contact) {
  return contact.name || `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || contact.email;
}

async function ensureContactClientAccounts() {
  // .lean() skips Mongoose document hydration, so a legacy contact with a
  // non-ObjectId value in projectIds/userId (some old records reference
  // projects/companies by their human-readable custom id) can't throw a
  // CastError and take down the whole /clients listing.
  const contacts = await Contact.find({}).sort({ updatedAt: -1 }).lean();
  const companies = await Company.find({}).lean().catch(() => []);
  const companyMap = new Map(companies.map((company) => [String(company._id || company.id), company]));
  const byEmail = new Map();

  for (const contact of contacts) {
    const email = String(contact.email || "").trim().toLowerCase();
    if (!email || byEmail.has(email)) continue;
    byEmail.set(email, contact);
  }

  for (const contact of byEmail.values()) {
    const company = companyMap.get(String(contact.companyId || ""));
    const companyName = contact.companyName || contact.company || company?.name || "";
    try {
      await ensureClientAccount({
        email: contact.email,
        name: contactDisplayName(contact),
        firstName: contact.firstName,
        lastName: contact.lastName,
        phone: contact.phone || contact.whatsapp || contact.alternatePhone,
        company: companyName,
        jobTitle: contact.designation
      });
    } catch (error) {
      console.warn("Could not sync contact to client account:", error.message);
    }
  }
}

router.get("/clients", async (req, res, next) => {
  try {
    // Best-effort sync: a bad legacy contact record must not prevent already-existing
    // clients from being listed.
    await ensureContactClientAccounts().catch((error) => console.warn("Could not sync contacts to client accounts:", error.message));
    const clients = await User.find({ role: "user" }).sort({ createdAt: -1 }).select("-passwordHash -invite -resetPassword");
    res.json(clients);
  } catch (error) {
    next(error);
  }
});

// A CRM contact is a client. This provisions (or refreshes) their portal login
// and emails a set-password link — the manual counterpart to the paid-order
// invite. This is an explicit admin action (checking "send portal invite" and
// saving), so it always sends — including to a client who already has a
// password, so they can reset it if they want to.
router.post("/clients/invite", async (req, res, next) => {
  try {
    const { email, name, phone, company } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required to send a portal invite." });
    const result = await sendPortalInvite({ email, name, phone, company });
    if (result.emailSkipped) {
      return res.status(503).json({
        ...result,
        message: "Client account was created, but SendGrid is not configured so the setup email was not sent."
      });
    }
    res.status(result.alreadyActive ? 200 : 201).json(result);
  } catch (error) {
    next(error);
  }
});

// Reactivates (or otherwise updates the status of) a client's portal login —
// used from the Contacts list to undo a self-service deactivation. Restoring
// only flips User.status back to "active"; it never touches or restores
// anything else, since deactivating never deleted anything in the first place.
router.put("/clients/:clientId/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["active", "disabled", "invited"].includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }
    const previous = await User.findById(req.params.clientId).select("status");
    const user = await User.findByIdAndUpdate(req.params.clientId, { status }, { new: true })
      .select("-passwordHash -invite -resetPassword");
    if (!user) return res.status(404).json({ message: "Client not found." });
    if (previous && previous.status !== status && (status === "active" || status === "disabled")) {
      notifyAccountStatusChange(user, status === "active");
    }
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

router.get("/clients/:clientId", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.clientId).select("-passwordHash -invite -resetPassword");
    if (!user) return res.status(404).json({ message: "Client not found." });

    const [orders, projects, documents, meetings] = await Promise.all([
      Order.find({ "customer.customerEmail": user.email }).sort({ createdAt: -1 }),
      Project.find({ clientId: user._id }).sort({ createdAt: -1 }),
      Document.find({ clientId: user._id }).sort({ createdAt: -1 }),
      Meeting.find({ clientId: user._id }).sort({ createdAt: -1 })
    ]);

    res.json({ user, orders, projects, documents, meetings });
  } catch (error) {
    next(error);
  }
});

router.get("/projects", async (req, res, next) => {
  try {
    const projects = await Project.find({}).sort({ createdAt: -1 }).populate("clientId", "name email company");
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

router.post("/projects", async (req, res, next) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

router.put("/projects/:id", async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!project) return res.status(404).json({ message: "Project not found." });
    res.json(project);
  } catch (error) {
    next(error);
  }
});

router.delete("/projects/:id", async (req, res, next) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get("/documents", async (req, res, next) => {
  try {
    const docs = await Document.find({}).sort({ createdAt: -1 }).populate("clientId", "name email");
    res.json(docs);
  } catch (error) {
    next(error);
  }
});

router.post("/documents", async (req, res, next) => {
  try {
    const doc = await Document.create({ ...req.body, uploadedById: req.auth.sub });
    res.status(201).json(doc);
  } catch (error) {
    next(error);
  }
});

router.put("/documents/:id", async (req, res, next) => {
  try {
    const doc = await Document.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ message: "Document not found." });
    res.json(doc);
  } catch (error) {
    next(error);
  }
});

router.delete("/documents/:id", async (req, res, next) => {
  try {
    await Document.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get("/meetings", async (req, res, next) => {
  try {
    await syncScheduledEventsToMeetings().catch((err) => console.error("Calendly sync failed:", err.message));
    const meetings = await Meeting.find({}).sort({ createdAt: -1 }).populate("clientId", "name email");
    res.json(meetings);
  } catch (error) {
    next(error);
  }
});

router.put("/meetings/:id", async (req, res, next) => {
  try {
    const meeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!meeting) return res.status(404).json({ message: "Meeting not found." });
    res.json(meeting);
  } catch (error) {
    next(error);
  }
});

router.post("/meetings", async (req, res, next) => {
  try {
    const meeting = await Meeting.create(req.body);
    res.status(201).json(meeting);
  } catch (error) {
    next(error);
  }
});

router.delete("/meetings/:id", async (req, res, next) => {
  try {
    await Meeting.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
