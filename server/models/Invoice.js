import mongoose from "mongoose";
import { defineModel } from "../db/defineModel.js";

const schema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    invoiceNumber: { type: String, required: true, index: true },
    invoiceId: { type: String, index: true, default: "" },
    sourceOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    paymentId: { type: String, default: "", index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null, index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    company: { type: String, default: "" },
    client: { type: String, default: "" },
    customerEmail: { type: String, trim: true, lowercase: true, default: "", index: true },
    project: { type: String, default: "" },
    package: { type: String, default: "" },
    total: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    issueDate: { type: Date },
    date: { type: Date },
    dueDate: { type: Date },
    status: { type: String, default: "Paid", index: true },
    paymentStatus: { type: String, default: "Paid" },
    provider: { type: String, default: "Razorpay" },
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    // Admin-controlled switch for whether the invoice PDF shows in the client
    // portal / document center. Defaults to visible.
    clientVisible: { type: Boolean, default: true },
    paidAt: { type: Date }
  },
  { timestamps: true, strict: false }
);

schema.index({ sourceOrderId: 1 }, { unique: true, sparse: true });
schema.index({ projectId: 1 }, { unique: true, sparse: true });

export default defineModel({
  name: "Invoice",
  table: "invoices",
  schema,
  defaults: {
    invoiceId: "",
    paymentId: "",
    projectId: null,
    companyId: null,
    clientId: null,
    company: "",
    client: "",
    customerEmail: "",
    project: "",
    package: "",
    total: 0,
    amount: 0,
    tax: 0,
    gst: 0,
    currency: "INR",
    status: "Paid",
    paymentStatus: "Paid",
    provider: "Razorpay",
    razorpayOrderId: "",
    razorpayPaymentId: "",
    clientVisible: true
  }
});
