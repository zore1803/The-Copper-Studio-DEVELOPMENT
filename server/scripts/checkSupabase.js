/**
 * Health check for the Supabase setup.
 *   npm run check:supabase
 *
 * Confirms the SUPABASE_* keys work and that all 14 tables exist. Run this after
 * applying supabase/schema.sql to verify the database is ready.
 */
import "dotenv/config";
import { supabase } from "../db/supabase.js";

const requestedTimeoutMs = Number.parseInt(process.env.SUPABASE_CHECK_TIMEOUT_MS || "10000", 10);
const timeoutMs = Number.isFinite(requestedTimeoutMs) && requestedTimeoutMs > 0 ? requestedTimeoutMs : 10000;
const tables = [
  "users", "orders", "leads", "contacts", "companies", "crm_leads", "deals",
  "projects", "tasks", "meetings", "documents", "invoices", "payments", "coupons"
];

if (!supabase) {
  console.error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this check.");
  process.exit(1);
}

function cleanError(error) {
  const rawMessage = error?.message || String(error);
  if (rawMessage.includes("<!DOCTYPE") || rawMessage.includes("<html")) {
    return "Supabase returned an HTML error page instead of JSON, usually a Cloudflare/proxy 5xx from the Supabase API.";
  }
  if (
    error?.name === "AbortError" ||
    error?.name === "TimeoutError" ||
    rawMessage.includes("AbortError") ||
    rawMessage.includes("TimeoutError")
  ) {
    return `request timed out after ${timeoutMs}ms`;
  }
  return rawMessage.length > 500 ? `${rawMessage.slice(0, 500)}...` : rawMessage;
}

async function checkTable(t) {
  try {
    const { error } = await supabase
      .from(t)
      .select("id", { count: "exact", head: true })
      .abortSignal(AbortSignal.timeout(timeoutMs));

    return error ? `${t} (${cleanError(error)})` : null;
  } catch (error) {
    return `${t} (${cleanError(error)})`;
  }
}

const missing = (await Promise.all(tables.map(checkTable))).filter(Boolean);

if (missing.length) {
  console.log("Supabase reachable, but these tables are not ready:");
  for (const m of missing) console.log("  - " + m);
  console.log("\n=> If tables are missing, run supabase/schema.sql in the Supabase SQL editor.");
  console.log("=> If every table times out or returns Cloudflare 5xx, check whether the Supabase project is paused/degraded.");
  process.exit(1);
}

console.log("All 14 Supabase tables are reachable. The database is ready.");
