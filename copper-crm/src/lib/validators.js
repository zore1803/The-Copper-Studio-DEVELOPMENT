// Shared form validation helpers used across CRM/admin forms.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Indian mobile: 10 digits starting 6-9, optional +91/0 prefix handled by caller.
export const PHONE_RE = /^[6-9]\d{9}$/;
// GSTIN: 2-digit state + 10-char PAN + entity + Z + checksum.
export const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function isEmail(value) {
  return EMAIL_RE.test(String(value || "").trim());
}

export function isPhone(value) {
  return PHONE_RE.test(String(value || "").replace(/\D/g, "").replace(/^(0|91)/, ""));
}

export function isGstin(value) {
  return GSTIN_RE.test(String(value || "").trim().toUpperCase());
}

export function required(value) {
  return String(value ?? "").trim().length > 0;
}

export function isPositiveNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

export function isFutureDate(value) {
  if (!value) return false;
  const t = new Date(value).getTime();
  return Number.isFinite(t) && t > Date.now();
}

/**
 * Run a field->validator map against an object and return an errors map.
 * Each rule: { test: (value, data) => bool, message: string, optional?: bool }.
 * An optional field passes when empty.
 */
export function validate(data, rules) {
  const errors = {};
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    const isEmpty = String(value ?? "").trim() === "";
    if (rule.optional && isEmpty) continue;
    if (!rule.test(value, data)) errors[field] = rule.message;
  }
  return errors;
}
