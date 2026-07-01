import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import Company from "./models/Company.js";
import Contact from "./models/Contact.js";
import Coupon from "./models/Coupon.js";
import CrmLead from "./models/CrmLead.js";
import Deal from "./models/Deal.js";
import Document from "./models/Document.js";
import Invoice from "./models/Invoice.js";
import Lead from "./models/Lead.js";
import Meeting from "./models/Meeting.js";
import Order from "./models/Order.js";
import Payment from "./models/Payment.js";
import Project from "./models/Project.js";
import Task from "./models/Task.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env") });

mongoose.connect(process.env.MONGO_URI);

async function clearDb() {
  try {
    console.log("Clearing database...");
    await Company.deleteMany({});
    await Contact.deleteMany({});
    await Coupon.deleteMany({});
    await CrmLead.deleteMany({});
    await Deal.deleteMany({});
    await Document.deleteMany({});
    await Invoice.deleteMany({});
    await Lead.deleteMany({});
    await Meeting.deleteMany({});
    await Order.deleteMany({});
    await Payment.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    console.log("Database cleared successfully (excluding Users)!");
  } catch (error) {
    console.error("Error clearing DB:", error);
  } finally {
    process.exit(0);
  }
}

clearDb();
