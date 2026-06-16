import mongoose from "mongoose";

const dealSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    name: { type: String, required: true, trim: true, index: true },
    account: { type: String, trim: true, index: true, default: "" },
    owner: { type: String, trim: true, default: "" },
    value: { type: String, default: "" },
    stage: { type: String, default: "Qualified", index: true },
    probability: { type: Number, default: 0 },
    close: { type: String, default: "" },
    source: { type: String, default: "" },
    notes: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("Deal", dealSchema);
