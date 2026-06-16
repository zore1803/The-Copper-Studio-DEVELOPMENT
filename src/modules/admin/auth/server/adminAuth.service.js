import bcrypt from "bcrypt";
import { getAdminJwtSecret, signAdminToken, verifyAdminToken } from "./adminJwt.js";

async function findAdminByEmail(User, email) {
  if (!User) {
    throw new Error("User collection is not available.");
  }

  if (typeof User.findOne === "function") {
    return User.findOne({ email });
  }

  if (typeof User.find === "function") {
    const users = await User.find({ email });
    return users?.[0] ?? null;
  }

  if (typeof User.getByEmail === "function") {
    return User.getByEmail(email);
  }

  return null;
}

async function authenticateAdmin({ email, password }, User, request) {
  if (!email || !password) {
    return { error: "Email and password are required.", status: 400 };
  }

  const adminUser = await findAdminByEmail(User, email);

  if (!adminUser) {
    return { error: "Invalid credentials.", status: 401 };
  }

  if (adminUser.role !== "admin") {
    return { error: "Clients cannot access the admin portal.", status: 403 };
  }

  const passwordHash = adminUser.password ?? adminUser.passwordHash;
  const passwordMatches = passwordHash ? await bcrypt.compare(password, passwordHash) : false;

  if (!passwordMatches) {
    return { error: "Invalid credentials.", status: 401 };
  }

  const secret = getAdminJwtSecret(request);

  if (!secret) {
    throw new Error("JWT secret is not configured.");
  }

  const tokenPayload = {
    sub: String(adminUser._id ?? adminUser.id ?? adminUser.email),
    role: "admin",
    email: adminUser.email,
  };

  const token = signAdminToken(tokenPayload, secret);

  return {
    token,
    user: {
      id: String(adminUser._id ?? adminUser.id ?? adminUser.email),
      name: adminUser.name ?? adminUser.fullName ?? "",
      email: adminUser.email,
      role: "admin",
    },
  };
}

function decodeAdminToken(token, request) {
  const secret = getAdminJwtSecret(request);

  if (!secret) {
    throw new Error("JWT secret is not configured.");
  }

  return verifyAdminToken(token, secret);
}

export { authenticateAdmin, decodeAdminToken };
