import mongoose from "mongoose";

const crmLeadSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    name: { type: String, required: true, trim: true, index: true },
    company: { type: String, trim: true, index: true, default: "" },
    email: { type: String, trim: true, lowercase: true, index: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    value: { type: String, default: "" },
    service: { type: String, default: "" },
    source: { type: String, default: "" },
    stage: { type: String, default: "New Lead", index: true },
    lastActivity: { type: String, default: "Created now" },
    notes: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("CrmLead", crmLeadSchema);
