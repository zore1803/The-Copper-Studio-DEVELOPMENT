import mongoose from "mongoose";
import { defineModel } from "../db/defineModel.js";

const schema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    name: { type: String, default: "" },
    category: { type: String, default: "" },
    subject: { type: String, default: "" },
    body: { type: String, default: "" },
    status: { type: String, default: "Draft" }
  },
  { timestamps: true, strict: false }
);

export default defineModel({
  name: "EmailTemplate",
  table: "email_templates",
  schema,
  defaults: {
    name: "",
    category: "",
    subject: "",
    body: "",
    status: "Draft"
  }
});
