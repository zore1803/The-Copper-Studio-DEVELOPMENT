import mongoose from "mongoose";
import { defineModel } from "../db/defineModel.js";

const schema = new mongoose.Schema(
  {
    id:       { type: String, index: true, unique: true },
    category: { type: String, default: "" },
    name:     { type: String, default: "" },
    label:    { type: String, default: "" },
    price:    { type: Number, default: 0 },
    duration: { type: String, default: "" },
    includes: { type: [String], default: [] },
  },
  { timestamps: true, strict: false }
);

export default defineModel({
  name: "Package",
  table: "packages",
  schema,
  defaults: { id: "", category: "", name: "", label: "", price: 0, duration: "", includes: [] },
});
