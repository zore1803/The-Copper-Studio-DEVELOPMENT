import mongoose from "mongoose";
import { defineModel } from "../db/defineModel.js";

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, default: "discovery_session" },
    status: {
      type: String,
      enum: ["requested", "confirmed", "completed", "cancelled"],
      default: "requested"
    },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    preferredDate: { type: Date },
    preferredTime: { type: String, default: "" },
    scheduledAt: { type: Date },
    duration: { type: Number, default: 45 },
    meetingLink: { type: String, default: "" },
    agenda: { type: String, default: "" },
    notes: { type: String, default: "" },
    calendlyEventUri: { type: String, default: "", index: true },
    reminderSentAt: { type: Date },
    participants: [
      {
        name: { type: String },
        email: { type: String },
        initials: { type: String }
      }
    ]
  },
  { timestamps: true, strict: false }
);

// Enforced only when calendlyEventUri is actually set (a manually-created
// meeting has "" and there can be many of those) — stops the sync from ever
// creating a second Meeting doc for the same Calendly event, which is what
// let concurrent /api/client/meetings loads race and duplicate a meeting
// into several near-identical "activity" entries on the client dashboard.
schema.index(
  { calendlyEventUri: 1 },
  { unique: true, partialFilterExpression: { calendlyEventUri: { $type: "string", $ne: "" } } }
);

export default defineModel({
  name: "Meeting",
  table: "meetings",
  schema,
  defaults: {
    type: "discovery_session",
    status: "requested",
    clientId: null,
    companyId: null,
    preferredTime: "",
    duration: 45,
    meetingLink: "",
    agenda: "",
    notes: "",
    calendlyEventUri: "",
    participants: []
  }
});
