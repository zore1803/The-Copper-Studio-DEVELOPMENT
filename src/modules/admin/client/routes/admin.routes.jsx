import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AdminShell } from "../components/AdminShell.jsx";
import { AdminDashboardPage } from "../pages/AdminDashboardPage.jsx";
import { AdminLoginPage } from "../pages/AdminLoginPage.jsx";
import { AdminResourcePage } from "../pages/AdminResourcePage.jsx";
import { AdminAnalyticsPage } from "../pages/AdminAnalyticsPage.jsx";
import { AdminDeliverablesPage } from "../pages/AdminDeliverablesPage.jsx";
import { AdminPackageManagementPage } from "../../packages/client/AdminPackageManagementPage.jsx";
import { RequireAdminRole } from "../components/RequireAdminRole.jsx";
import { PlanBuilderPage } from "../../pricing/client/PlanBuilderPage.jsx";
import { PlanLibraryPage } from "../../pricing/client/PlanLibraryPage.jsx";

const adminResourceConfigs = [
  { path: "clients", title: "Client Management", endpoint: "/api/admin/users" },
  { path: "pricing", title: "Pricing Management", endpoint: "/api/admin/packages" },
  { path: "projects", title: "Project Management", endpoint: "/api/admin/projects" },
  { path: "timelines", title: "Timeline Management", endpoint: "/api/admin/timelines" },
  { path: "meetings", title: "Meeting Management", endpoint: "/api/admin/meetings" },
  { path: "email-templates", title: "Email Templates", endpoint: "/api/admin/email-templates" },
  { path: "coupons", title: "Coupon Management", endpoint: "/api/admin/coupons" },
];

function adminClientRoutes() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireAdminRole>
            <AdminShell />
          </RequireAdminRole>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="packages" element={<AdminPackageManagementPage />} />
        <Route path="pricing-plans/builder" element={<PlanBuilderPage />} />
        <Route path="pricing-plans/builder/:planId" element={<PlanBuilderPage />} />
        <Route path="pricing-plans/library" element={<PlanLibraryPage />} />
        {adminResourceConfigs.map((config) => (
          <Route key={config.path} path={config.path} element={<AdminResourcePage title={config.title} endpoint={config.endpoint} resource={config.path} />} />
        ))}
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="deliverables" element={<AdminDeliverablesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}

export { adminClientRoutes, adminResourceConfigs };
