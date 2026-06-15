import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    customerCountryCode: { type: String, default: "+91" },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    customerCompany: { type: String, trim: true, default: "" },
    selectedPackageId: { type: String, default: "" },
    verification: {
      phoneVerified: { type: Boolean, default: false },
      emailVerified: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

export default mongoose.model("Lead", leadSchema);
