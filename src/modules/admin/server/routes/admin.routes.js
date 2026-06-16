import { Router } from "express";
import { adminAuthRoutes } from "../../auth/server/adminAuth.routes.js";
import { adminUserRoutes } from "./adminUsers.routes.js";
import { adminPackageRoutes } from "./adminPackages.routes.js";
import { adminProjectRoutes } from "./adminProjects.routes.js";
import { adminTimelineRoutes } from "./adminTimelines.routes.js";
import { adminMeetingRoutes } from "./adminMeetings.routes.js";
import { adminAnalyticsRoutes } from "./adminAnalytics.routes.js";
import { adminTemplateRoutes } from "./adminTemplates.routes.js";
import { adminCouponRoutes } from "./adminCoupons.routes.js";
import { pricingPlansRoutes } from "../../pricing/server/pricingPlans.routes.js";

const adminRoutes = Router();

adminRoutes.use("/", adminAuthRoutes);
adminRoutes.use("/users", adminUserRoutes);
adminRoutes.use("/packages", adminPackageRoutes);
adminRoutes.use("/projects", adminProjectRoutes);
adminRoutes.use("/timelines", adminTimelineRoutes);
adminRoutes.use("/meetings", adminMeetingRoutes);
adminRoutes.use("/analytics", adminAnalyticsRoutes);
adminRoutes.use("/email-templates", adminTemplateRoutes);
adminRoutes.use("/coupons", adminCouponRoutes);
adminRoutes.use("/pricing-plans", pricingPlansRoutes);

export { adminRoutes };
