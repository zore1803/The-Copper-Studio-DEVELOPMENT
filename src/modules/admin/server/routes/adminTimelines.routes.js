import { createCrudRouter } from "./createCrudRouter.js";
import { authorizeAdminRole } from "../middleware/authorizeAdminRole.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const adminTimelineRoutes = createCrudRouter("timelines", undefined, [requireAdmin, authorizeAdminRole(["admin"])]);

export { adminTimelineRoutes };
