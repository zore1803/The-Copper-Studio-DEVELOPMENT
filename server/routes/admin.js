import express from "express";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Project from "../models/Project.js";
import Document from "../models/Document.js";
import Meeting from "../models/Meeting.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth, requireRole("superadmin"));

router.get("/clients", async (req, res, next) => {
  try {
    const clients = await User.find({ role: "user" }).sort({ createdAt: -1 }).select("-passwordHash -invite -resetPassword");
    res.json(clients);
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

export default router;
