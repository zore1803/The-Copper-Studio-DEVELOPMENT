import crypto from "node:crypto";
import { sendOtpEmail } from "./email.js";

/**
 * Email-delivered OTP verification for the public checkout.
 *
 * Codes are stored in memory (single-instance deployment), hashed, time-limited,
 * and attempt-capped. Each (email, channel) pair has its own code — the checkout
 * uses two channels ("email" and "phone"), both delivered to the email address.
 */

const store = new Map(); // `${email}:${channel}` -> { codeHash, expiresAt, attempts, verified }
const TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
let lastSweep = Date.now();

function keyFor(email, channel) {
  return `${String(email || "").trim().toLowerCase()}:${channel}`;
}

function hash(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function sweep() {
  const now = Date.now();
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  for (const [k, entry] of store) {
    if (entry.expiresAt <= now) store.delete(k);
  }
  lastSweep = now;
}

const CHANNEL_LABEL = {
  email: "email verification",
  phone: "mobile verification",
};

/**
 * Generate + email a fresh OTP for (email, channel).
 * @returns {Promise<{ sent: boolean, devCode?: string }>}
 */
export async function sendOtp({ email, channel }) {
  sweep();
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  store.set(keyFor(email, channel), {
    codeHash: hash(code),
    expiresAt: Date.now() + TTL_MS,
    attempts: 0,
    verified: false,
  });

  const result = await sendOtpEmail({ to: email, code, label: CHANNEL_LABEL[channel] || "verification" });
  const sent = !result?.skipped;

  // When SendGrid is not configured, surface the code only outside production
  // so the flow remains testable locally. Never leak it in production.
  const devCode = !sent && process.env.NODE_ENV !== "production" ? code : undefined;
  return { sent, devCode };
}

/**
 * Verify a submitted code. Only the exact code that was last sent passes;
 * any other value fails.
 */
export function verifyOtp({ email, channel, code }) {
  const k = keyFor(email, channel);
  const entry = store.get(k);
  if (!entry) return { ok: false, message: "No code was requested. Please click Send OTP first." };
  if (Date.now() > entry.expiresAt) {
    store.delete(k);
    return { ok: false, message: "This code has expired. Please request a new one." };
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    store.delete(k);
    return { ok: false, message: "Too many incorrect attempts. Please request a new code." };
  }
  entry.attempts += 1;
  if (entry.codeHash !== hash(code)) {
    return { ok: false, message: "Incorrect code. Please check the email and try again." };
  }
  entry.verified = true;
  return { ok: true };
}

/** Whether (email, channel) has a still-valid, verified code. */
export function isVerified({ email, channel }) {
  const entry = store.get(keyFor(email, channel));
  return Boolean(entry && entry.verified && entry.expiresAt > Date.now());
}

export default { sendOtp, verifyOtp, isVerified };
