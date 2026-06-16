import { Router } from "express";
import {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  duplicatePlan,
  reorderPlans,
} from "./pricingPlans.controller.js";

const pricingPlansRoutes = Router();

pricingPlansRoutes.get("/", getAllPlans);
pricingPlansRoutes.get("/:id", getPlanById);
pricingPlansRoutes.post("/", createPlan);
pricingPlansRoutes.put("/:id", updatePlan);
pricingPlansRoutes.delete("/:id", deletePlan);
pricingPlansRoutes.post("/:id/duplicate", duplicatePlan);
pricingPlansRoutes.post("/reorder", reorderPlans);

export { pricingPlansRoutes };
