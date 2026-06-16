import { createCrudRouter } from "./createCrudRouter.js";
import { authorizeAdminRole } from "../middleware/authorizeAdminRole.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const adminMeetingRoutes = createCrudRouter("meetings", undefined, [requireAdmin, authorizeAdminRole(["admin"])]);

export { adminMeetingRoutes };
