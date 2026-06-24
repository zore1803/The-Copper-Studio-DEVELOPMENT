import mongoose from "mongoose";
import { defineModel } from "../db/defineModel.js";

const schema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    name: { type: String, required: true, trim: true, index: true },
    company: { type: String, trim: true, index: true, default: "" },
    email: { type: String, trim: true, lowercase: true, index: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    designation: { type: String, trim: true, default: "" },
    department: { type: String, default: "" },
    notes: { type: String, default: "" },
    // A contact can be given their own client-portal login (`userId`) and
    // scoped to specific projects (`projectIds`) instead of seeing everything
    // under their company.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    projectIds: { type: [mongoose.Schema.Types.ObjectId], ref: "Project", default: [] }
  },
  { timestamps: true, strict: false }
);

export default defineModel({
  name: "Contact",
  table: "contacts",
  schema,
  defaults: {
    company: "",
    email: "",
    phone: "",
    designation: "",
    department: "",
    notes: "",
    userId: null,
    projectIds: []
  }
});
