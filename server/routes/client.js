import bcrypt from "bcryptjs";
import express from "express";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Project from "../models/Project.js";
import Document from "../models/Document.js";
import Meeting from "../models/Meeting.js";
import Task from "../models/Task.js";
import Company from "../models/Company.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

// A company can have several portal accounts linked to it (e.g. multiple
// contacts at the same client), so a logged-in client's visible records are
// everything tagged with their own `clientId` PLUS everything under any
// company they're linked to via `userIds` (or the legacy single `userId`).
async function resolveClientCompanyIds(clientId) {
  const companies = await Company.find({}).select("userId userIds");
  const id = String(clientId);
  return companies
    .filter((c) => String(c.userId || "") === id || (c.userIds || []).map(String).includes(id))
    .map((c) => String(c._id));
}

async function visibilityFilter(clientId) {
  const companyIds = await resolveClientCompanyIds(clientId);
  return companyIds.length
    ? { $or: [{ clientId }, { companyId: { $in: companyIds } }] }
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
    const orders = await Order.find({ "customer.customerEmail": user.email }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

router.get("/projects", async (req, res, next) => {
  try {
    const filter = await visibilityFilter(req.auth.sub);
    const projects = await Project.find(filter).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

router.get("/projects/:id/tasks", async (req, res, next) => {
  try {
    const filter = await visibilityFilter(req.auth.sub);
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
    const filter = await visibilityFilter(req.auth.sub);
    const docs = await Document.find({ $and: [filter, { scope: { $ne: "internal" } }] }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (error) {
    next(error);
  }
});

router.get("/meetings", async (req, res, next) => {
  try {
    const filter = await visibilityFilter(req.auth.sub);
    const meetings = await Meeting.find(filter).sort({ createdAt: -1 });
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
