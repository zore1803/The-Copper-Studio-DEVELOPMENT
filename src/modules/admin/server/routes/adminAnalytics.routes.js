import { Router } from "express";
import { authorizeAdminRole } from "../middleware/authorizeAdminRole.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const adminAnalyticsRoutes = Router();

adminAnalyticsRoutes.get("/", requireAdmin, authorizeAdminRole(["admin"]), (request, response) => {
  return response.status(200).json({
    overview: {
      clients: 0,
      projects: 0,
      meetings: 0,
      deliverables: 0,
    },
    trend: [],
  });
});

export { adminAnalyticsRoutes };
