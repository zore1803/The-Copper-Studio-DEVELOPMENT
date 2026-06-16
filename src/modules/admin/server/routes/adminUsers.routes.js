import { createCrudRouter } from "./createCrudRouter.js";
import { authorizeAdminRole } from "../middleware/authorizeAdminRole.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const adminUserRoutes = createCrudRouter("users", undefined, [requireAdmin, authorizeAdminRole(["admin"])]);

export { adminUserRoutes };
