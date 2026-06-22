import mongoose from "mongoose";
import { defineModel } from "../db/defineModel.js";

const schema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    companyId: { type: String, index: true },
    title: { type: String, default: "" },
    body: { type: String, default: "" },
    createdBy: { type: String, default: "" }
  },
  { timestamps: true, strict: false }
);

export default defineModel({
  name: "Note",
  table: "notes",
  schema,
  defaults: {
    companyId: "",
    title: "",
    body: "",
    createdBy: ""
  }
});
