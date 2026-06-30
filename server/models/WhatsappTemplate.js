import mongoose from "mongoose";
import { defineModel } from "../db/defineModel.js";

const schema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    name: { type: String, default: "" },
    category: { type: String, default: "" },
    body: { type: String, default: "" },
    status: { type: String, default: "Draft" }
  },
  { timestamps: true, strict: false }
);

export default defineModel({
  name: "WhatsappTemplate",
  table: "whatsapp_templates",
  schema,
  defaults: {
    name: "",
    category: "",
    body: "",
    status: "Draft"
  }
});
