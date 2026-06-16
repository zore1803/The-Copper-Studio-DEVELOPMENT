import { decodeAdminToken } from "./adminAuth.service.js";

function getBearerToken(request) {
  const authorization = request.headers.authorization ?? request.headers.Authorization;

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length);
  }

  return request.headers["x-admin-token"] ?? request.cookies?.adminToken ?? request.headers["x-access-token"] ?? null;
}

function requireAdmin(request, response, next) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return response.status(401).json({
        message: "Authentication required.",
      });
    }

    const decoded = decodeAdminToken(token, request);

    if (decoded.role !== "admin") {
      return response.status(403).json({
        message: "Admin access required.",
      });
    }

    request.user = {
      id: decoded.sub ?? decoded.id ?? "",
      email: decoded.email ?? "",
      role: decoded.role,
    };

    return next();
  } catch (error) {
    return response.status(401).json({
      message: "Invalid or expired token.",
    });
  }
}

export { requireAdmin };
