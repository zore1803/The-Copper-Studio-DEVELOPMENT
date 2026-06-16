import { createCrudRouter } from "./createCrudRouter.js";
import { authorizeAdminRole } from "../middleware/authorizeAdminRole.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { adminDeliverableRoutes } from "./adminDeliverables.routes.js";

const adminProjectRoutes = createCrudRouter("projects", undefined, [requireAdmin, authorizeAdminRole(["admin"])]);
adminProjectRoutes.use("/:projectId/deliverables", adminDeliverableRoutes);

export { adminProjectRoutes };
