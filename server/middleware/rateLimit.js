/**
 * Lightweight in-memory rate limiter (no external dependency).
 *
 * Suitable for a single-instance deployment (e.g. Render web service). Keeps a
 * fixed-window counter per client key and rejects requests over the limit with
 * HTTP 429. For multi-instance / horizontally-scaled setups, swap this for a
 * shared store (Redis) based limiter.
 */

const buckets = new Map();

// Periodically drop expired buckets so the Map does not grow unbounded.
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
let lastSweep = Date.now();

function sweep(now) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
  lastSweep = now;
}

function clientKey(req) {
  // Honour the proxy chain on Render/Vercel; fall back to the socket address.
  const fwd = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(fwd) ? fwd[0] : fwd || "").split(",")[0].trim() || req.ip || req.socket?.remoteAddress || "unknown";
  return ip;
}

/**
 * @param {object} options
 * @param {number} options.windowMs  Window length in ms.
 * @param {number} options.max       Max requests allowed per window per key.
 * @param {string} [options.name]    Bucket namespace (so different limiters don't share counts).
 * @param {string} [options.message] 429 response message.
 */
export function rateLimit({ windowMs = 60_000, max = 30, name = "default", message } = {}) {
  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now();
    sweep(now);

    const key = `${name}:${clientKey(req)}`;
    let entry = buckets.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      buckets.set(key, entry);
    }

    entry.count += 1;

    const remaining = Math.max(0, max - entry.count);
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({
        message: message || `Too many requests. Please try again in ${retryAfter}s.`
      });
    }

    next();
  };
}

export default rateLimit;
