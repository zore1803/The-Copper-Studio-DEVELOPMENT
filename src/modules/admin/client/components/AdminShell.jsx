import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "../../pricing/client/pricing.css";

const navigationItems = [
  ["Dashboard", "/admin/dashboard"],
  ["Clients", "/admin/clients"],
  ["Packages", "/admin/packages"],
  ["Pricing", "/admin/pricing"],
  ["Plan Builder", "/admin/pricing-plans/builder"],
  ["Plan Library", "/admin/pricing-plans/library"],
  ["Projects", "/admin/projects"],
  ["Timelines", "/admin/timelines"],
  ["Meetings", "/admin/meetings"],
  ["Deliverables", "/admin/deliverables"],
  ["Analytics", "/admin/analytics"],
  ["Email Templates", "/admin/email-templates"],
  ["Coupons", "/admin/coupons"],
];

function AdminShell() {
  return (
    <div className="admin-shell">
      <aside className="admin-shell__sidebar">
        <div>
          <h1>The Copper Studio</h1>
          <p>Admin Portal</p>
        </div>
        <nav>
          {navigationItems.map(([label, path]) => (
            <NavLink key={path} to={path} className={({ isActive }) => (isActive ? "active" : "")}>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="admin-shell__content">
        <Outlet />
      </main>
    </div>
  );
}

export { AdminShell };
