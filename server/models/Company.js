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
    // Set via the "Make Primary" action on a contact (CompanyDetail.jsx) —
    // used to notify someone at the company when a teammate's portal login
    // is deactivated/reactivated, since Company itself has no email field.
    primaryContact: { type: String, trim: true, default: "" },
    primaryContactEmail: { type: String, trim: true, lowercase: true, default: "" },
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
    primaryContact: "",
    primaryContactEmail: "",
    activity: []
  }
});
