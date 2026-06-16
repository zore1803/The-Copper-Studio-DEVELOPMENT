import { Router } from "express";
import { authorizeAdminRole } from "../middleware/authorizeAdminRole.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { createCrudRouter } from "./createCrudRouter.js";

const templateRepository = {
  list() {
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      resourceName: "email-templates",
    };
  },
};

const adminTemplateRoutes = Router();

adminTemplateRoutes.use(
  "/",
  createCrudRouter("email-templates", templateRepository, [requireAdmin, authorizeAdminRole(["admin"])])
);

export { adminTemplateRoutes };
