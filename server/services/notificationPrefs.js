import User from "../models/User.js";

// Client-facing notification emails (invoice, meeting reminders, weekly
// reports, billing alerts) are gated by the recipient's own portal
// preferences (Settings > Notifications). The master "Email Notifications"
// toggle blocks everything covered here; a specific category toggle (e.g.
// "billingAlerts") can additionally suppress just that kind. Critical
// account emails (portal invite, password reset) intentionally do NOT go
// through this check — those aren't "notifications", they're required to
// use the account at all. A missing account (no User record yet) always
// sends, since there's no preference to honor yet.
export async function shouldSendNotificationEmail(email, category) {
  if (!email) return true;
  const user = await User.findOne({ email: String(email).toLowerCase() }).select("preferences").catch(() => null);
  if (!user) return true;
  const notif = user.preferences?.notifications || {};
  if (notif.email === false) return false;
  if (category && notif[category] === false) return false;
  return true;
}
