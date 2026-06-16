import { getAdminPrincipal } from "../auth/getAdminPrincipal.js";

function authorizeAdminRole(allowedRoles = []) {
  const allowed = new Set(allowedRoles);

  return function checkAdminRole(request, response, next) {
    const user = getAdminPrincipal(request);

    if (!user || !allowed.has(user.role)) {
      return response.status(403).json({
        message: "You do not have permission to access this admin resource.",
      });
    }

    request.user = user;
    return next();
  };
}

export { authorizeAdminRole };
