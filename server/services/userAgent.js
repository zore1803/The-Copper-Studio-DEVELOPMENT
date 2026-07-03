// Lightweight User-Agent → "Browser on OS" label, no dependency needed for
// the handful of browser/OS combinations that matter for a session list.
const BROWSERS = [
  ["Edg/", "Edge"],
  ["OPR/", "Opera"],
  ["Chrome/", "Chrome"],
  ["CriOS/", "Chrome"],
  ["Firefox/", "Firefox"],
  ["FxiOS/", "Firefox"],
  ["Safari/", "Safari"]
];

const OS_PATTERNS = [
  [/Windows/i, "Windows"],
  [/Mac OS X/i, "macOS"],
  [/Android/i, "Android"],
  [/iPhone|iPad|iPod/i, "iOS"],
  [/Linux/i, "Linux"]
];

export function describeUserAgent(userAgent) {
  const ua = String(userAgent || "");
  if (!ua) return "Unknown device";

  const browser = BROWSERS.find(([marker]) => ua.includes(marker))?.[1] || "Unknown browser";
  const os = OS_PATTERNS.find(([pattern]) => pattern.test(ua))?.[1] || "Unknown OS";
  return `${browser} on ${os}`;
}
