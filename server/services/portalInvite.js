import crypto from "node:crypto";
import User from "../models/User.js";
import { sendPortalInviteEmail } from "./email.js";

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

const INVITE_TTL_MS = 48 * 60 * 60 * 1000;

/**
 * Upsert an invited client `User` by email and email them a set-password link.
 * Shared by the paid-order flow and the manual "a contact is a client" invite,
 * so both paths produce identical accounts and emails.
 *
 * @param {object}  opts
 * @param {string}  opts.email          Client email (required).
 * @param {string}  [opts.name]         Display name.
 * @param {string}  [opts.phone]
 * @param {string}  [opts.company]
 * @param {string}  [opts.packageName]  Shown in the email body when present.
 * @param {boolean} [opts.skipIfActive] When true, do not re-invite a client who
 *                                       has already set a password — avoids
 *                                       resetting an active portal account.
 * @returns {Promise<{userId:string, setPasswordUrl?:string, alreadyActive?:boolean, emailSkipped?:boolean}>}
 */
export async function sendPortalInvite({
  email,
  name = "",
  phone = "",
  company = "",
  packageName = "",
  skipIfActive = false,
} = {}) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) throw new Error("Email is required to send a portal invite.");

  if (skipIfActive) {
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing && existing.status === "active" && existing.passwordHash) {
      return { userId: existing._id, alreadyActive: true };
    }
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const user = await User.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $set: {
        name: name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        phone,
        company,
        role: "user",
        status: "invited",
        invite: {
          tokenHash: sha256(rawToken),
          expiresAt: new Date(Date.now() + INVITE_TTL_MS),
          sentAt: new Date(),
        },
      },
      $setOnInsert: { passwordHash: "" },
    },
    { upsert: true, new: true }
  );

  const crmUrl = process.env.CRM_PUBLIC_URL || "http://localhost:5173";
  const setPasswordUrl = `${crmUrl}/client-secure-onboarding/access-setup?token=${rawToken}`;
  const mailResult = await sendPortalInviteEmail({ to: user.email, name: user.name, packageName, setPasswordUrl });

  return { userId: user._id, setPasswordUrl, emailSkipped: Boolean(mailResult?.skipped) };
}
