import React from "react";
import { Navigate } from "react-router-dom";

function RequireAdminRole({ allowedRoles = ["admin"], children }) {
  const user = typeof window !== "undefined" ? window.__COPPER_STUDIO_ADMIN_USER__ : null;
  const token = typeof window !== "undefined" ? window.localStorage.getItem("copper_studio_admin_token") : null;

  if ((!user || !allowedRoles.includes(user.role)) && !token) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export { RequireAdminRole };
