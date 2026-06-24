// Shared form validation helpers used across CRM/admin forms.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// The country/dial code is captured separately by PhoneInput, so the local
// number just needs to be exactly 10 digits regardless of country.
export const PHONE_RE = /^\d{10}$/;
// GSTIN: 2-digit state + 10-char PAN + entity + Z + checksum.
export const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function isEmail(value) {
  return EMAIL_RE.test(String(value || "").trim());
}

// Accepts either a raw 10-digit number or a full "+<code> <digits>" value
// (as produced by PhoneInput) — strips everything but the trailing digits.
export function isPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return PHONE_RE.test(digits.slice(-10)) && digits.length <= 14;
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
