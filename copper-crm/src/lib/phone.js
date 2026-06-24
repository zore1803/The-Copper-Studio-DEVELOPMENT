import { COUNTRY_DIAL_CODES, DEFAULT_DIAL_CODE } from "./countryDialCodes";

const DIAL_CODES_BY_LENGTH = [...COUNTRY_DIAL_CODES].sort((a, b) => b.dial.length - a.dial.length);

// Stored phone values look like "+91 9876543210" — a single string so no
// schema/data-shape change was needed on existing contact/company records.
export function parsePhone(value) {
  const raw = String(value || "").trim();
  if (!raw) return { dialCode: DEFAULT_DIAL_CODE, number: "" };

  const match = DIAL_CODES_BY_LENGTH.find((c) => raw.startsWith(c.dial));
  if (match) {
    return { dialCode: match.dial, number: raw.slice(match.dial.length).replace(/\D/g, "").slice(0, 10) };
  }
  return { dialCode: DEFAULT_DIAL_CODE, number: raw.replace(/\D/g, "").slice(0, 10) };
}

export function formatPhone(dialCode, number) {
  if (!number) return "";
  return `${dialCode || DEFAULT_DIAL_CODE} ${number}`;
}

export function phoneDigitsOnly(value) {
  return parsePhone(value).number;
}
