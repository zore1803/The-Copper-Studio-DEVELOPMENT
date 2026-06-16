import { createCrudRouter } from "./createCrudRouter.js";
import { authorizeAdminRole } from "../middleware/authorizeAdminRole.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const adminCouponRoutes = createCrudRouter("coupons", undefined, [requireAdmin, authorizeAdminRole(["admin"])]);

export { adminCouponRoutes };
