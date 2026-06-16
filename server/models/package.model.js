import mongoose from "mongoose";

const packageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, trim: true, uppercase: true },
    duration: { type: mongoose.Schema.Types.Mixed, required: true },
    features: { type: [String], required: true, default: [] },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

const Package = mongoose.models.Package || mongoose.model("Package", packageSchema);

export { Package };
