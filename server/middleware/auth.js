import jwt from "jsonwebtoken";
import User from "../models/User.js";

const jwtSecret = process.env.JWT_SECRET || "replace-this-development-secret";
const ACTIVITY_TOUCH_INTERVAL_MS = 5 * 60 * 1000;

export async function requireAuth(req, res, next) {
  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ message: "Authentication required." });

  try {
    req.auth = jwt.verify(token, jwtSecret);
  } catch {
    return res.status(401).json({ message: "Invalid or expired session." });
  }

  // Tokens issued before session tracking existed have no `sid` claim —
  // let those through unchecked rather than force-logging everyone out.
  if (!req.auth.sid) return next();

  try {
    const user = await User.findById(req.auth.sub).select("sessions");
    const session = user?.sessions?.find((s) => s.sid === req.auth.sid);
    if (!session) return res.status(401).json({ message: "This session has been signed out." });

    if (Date.now() - new Date(session.lastActiveAt).getTime() > ACTIVITY_TOUCH_INTERVAL_MS) {
      User.updateOne(
        { _id: req.auth.sub, "sessions.sid": req.auth.sid },
        { $set: { "sessions.$.lastActiveAt": new Date() } }
      ).catch(() => {});
    }
    next();
  } catch {
    // A DB hiccup here shouldn't lock everyone out of the app.
    next();
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.auth?.role)) {
      return res.status(403).json({ message: "Access denied." });
    }
    next();
  };
}
