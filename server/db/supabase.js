import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const dbDriver = (process.env.DB_DRIVER || "mongo").toLowerCase();
const url = process.env.SUPABASE_URL;
// Server-side code uses the service-role key so it bypasses RLS. Never expose
// this key to the browser (the CRM frontend never imports this file).
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  if (dbDriver !== "mongo") {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env."
    );
  }
}

export const supabase = url && key
  ? createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

export default supabase;
