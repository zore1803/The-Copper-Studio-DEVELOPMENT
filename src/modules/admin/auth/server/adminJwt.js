import jwt from "jsonwebtoken";

function getAdminJwtSecret(request) {
  return request.app?.locals?.adminJwtSecret ?? request.app?.get?.("adminJwtSecret") ?? process.env.JWT_SECRET ?? process.env.ADMIN_JWT_SECRET;
}

function signAdminToken(payload, secret, expiresIn = "7d") {
  return jwt.sign(payload, secret, { expiresIn });
}

function verifyAdminToken(token, secret) {
  return jwt.verify(token, secret);
}

export { getAdminJwtSecret, signAdminToken, verifyAdminToken };
