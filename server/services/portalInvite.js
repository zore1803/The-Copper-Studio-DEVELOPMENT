import crypto from "node:crypto";
import User from "../models/User.js";
import { sendPortalInviteEmail } from "./email.js";

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

const INVITE_TTL_MS = 48 * 60 * 60 * 1000;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function compactString(value) {
  return String(value || "").trim();
}

function displayName({ name, firstName, lastName, fallbackName, email }) {
  return compactString(name)
    || `${compactString(firstName)} ${compactString(lastName)}`.trim()
    || compactString(fallbackName)
    || normalizeEmail(email).split("@")[0];
}

/**
 * Create or refresh the portal user behind a CRM contact without sending mail.
 * This makes "a contact is a client" true for the company link picker while
 * keeping setup-email delivery as an explicit action.
 */
export async function ensureClientAccount({
  email,
  name = "",
  firstName = "",
  lastName = "",
  phone = "",
  company = "",
  jobTitle = "",
} = {}) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error("Email is required to create a client account.");

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing?.role === "superadmin") {
    const error = new Error("This email belongs to an admin account and cannot be linked as a client.");
    error.statusCode = 409;
    throw error;
  }

  const next = {
    email: normalizedEmail,
    role: "user",
    status: existing?.status || "invited",
    name: displayName({ name, firstName, lastName, fallbackName: existing?.name, email: normalizedEmail })
  };
  const nextPhone = compactString(phone);
  const nextCompany = compactString(company);
  const nextJobTitle = compactString(jobTitle);
  if (nextPhone) next.phone = nextPhone;
  if (nextCompany) next.company = nextCompany;
  if (nextJobTitle) next.jobTitle = nextJobTitle;

  return User.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $set: next,
      $setOnInsert: { passwordHash: "" }
    },
    { upsert: true, new: true }
  );
}

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
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error("Email is required to send a portal invite.");

  if (skipIfActive) {
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing && existing.status === "active" && existing.passwordHash) {
      return { userId: existing._id, alreadyActive: true };
    }
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  await ensureClientAccount({ email: normalizedEmail, name, phone, company });
  const user = await User.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $set: {
        ...(compactString(name) ? { name: compactString(name) } : {}),
        ...(compactString(phone) ? { phone: compactString(phone) } : {}),
        ...(compactString(company) ? { company: compactString(company) } : {}),
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
