import mongoose from "mongoose";
import { defineModel } from "../db/defineModel.js";

const activitySchema = new mongoose.Schema(
  {
    type: { type: String, default: "note" },
    text: { type: String, required: true },
    actor: { type: String, default: "Admin" },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const schema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    name: { type: String, required: true, trim: true, index: true },
    gstin: { type: String, trim: true, uppercase: true, index: true, default: "" },
    industry: { type: String, trim: true, default: "" },
    contact: { type: String, trim: true, default: "" },
    projects: { type: Number, default: 0 },
    status: { type: String, default: "Prospect", index: true },
    address: { type: String, default: "" },
    website: { type: String, default: "" },
    notes: { type: String, default: "" },
    // `userId` is kept for backward compatibility with older records; `userIds`
    // is the source of truth and supports linking several client portal
    // accounts (e.g. multiple contacts) to one company.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    userIds: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
    activity: [activitySchema]
  },
  { timestamps: true, strict: false }
);

export default defineModel({
  name: "Company",
  table: "companies",
  schema,
  defaults: {
    gstin: "",
    industry: "",
    contact: "",
    projects: 0,
    status: "Prospect",
    address: "",
    website: "",
    notes: "",
    userId: null,
    userIds: [],
    activity: []
  }
});
