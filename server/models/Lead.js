import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    linkedinUrl: { type: String, trim: true, default: "" },
    customerPhone: { type: String, required: true, trim: true },
    customerCountryCode: { type: String, default: "+91" },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    projectName: { type: String, required: true, trim: true },
    customerCompany: { type: String, trim: true, default: "" },
    companyWebsite: { type: String, trim: true, default: "" },
    companyGstin: { type: String, trim: true, default: "" },
    billingAddressLine1: { type: String, trim: true, default: "" },
    billingAddressLine2: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    pincode: { type: String, trim: true, default: "" },
    selectedPackageId: { type: String, default: "" },
    verification: {
      phoneVerified: { type: Boolean, default: false },
      emailVerified: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

export default mongoose.model("Lead", leadSchema);
