import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    paymentId: { type: String, required: true, index: true },
    orderId: { type: String, index: true, default: "" },
    sourceOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    company: { type: String, default: "" },
    client: { type: String, default: "" },
    customerEmail: { type: String, trim: true, lowercase: true, default: "", index: true },
    package: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    method: { type: String, default: "Razorpay" },
    paymentMethod: { type: String, default: "Razorpay" },
    gateway: { type: String, default: "Razorpay" },
    status: { type: String, default: "Success", index: true },
    invoiceId: { type: String, default: "", index: true },
    invoiceNumber: { type: String, default: "", index: true },
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    paidAt: { type: Date }
  },
  { timestamps: true, strict: false }
);

paymentSchema.index({ sourceOrderId: 1 }, { unique: true, sparse: true });

export default mongoose.model("Payment", paymentSchema);
