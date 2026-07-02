import User from "../models/User.js";
import Meeting from "../models/Meeting.js";
import Project from "../models/Project.js";
import Order from "../models/Order.js";
import { sendMeetingReminderEmail, sendWeeklyProjectReportEmail, sendPaymentCancelledEmail } from "./email.js";
import { shouldSendNotificationEmail } from "./notificationPrefs.js";

// There's no cron infrastructure here (and the free-tier host spins down
// when idle, so a setInterval-based scheduler wouldn't fire reliably
// anyway). Instead this runs opportunistically — triggered from a
// frequently-polled route (see routes/client.js) — throttled to at most
// once every few minutes, the same pattern already used by
// services/finance.js's syncPaidOrderFinance backfill.
const RUN_INTERVAL_MS = 5 * 60 * 1000;
let lastRunAt = 0;
let runInFlight = null;

const REMINDER_WINDOW_START_MS = 23 * 60 * 60 * 1000; // 23h from now
const REMINDER_WINDOW_END_MS = 25 * 60 * 60 * 1000; // 25h from now

async function sendMeetingReminders() {
  const now = new Date();
  const windowStart = new Date(now.getTime() + REMINDER_WINDOW_START_MS);
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_END_MS);

  const meetings = await Meeting.find({
    status: "confirmed",
    scheduledAt: { $gte: windowStart, $lte: windowEnd },
    reminderSentAt: { $exists: false }
  }).limit(100).catch(() => []);

  let sent = 0;
  for (const meeting of meetings) {
    try {
      const clientEmail = meeting.participants?.find((p) => p.email)?.email
        || (meeting.clientId ? (await User.findById(meeting.clientId).select("email name").catch(() => null))?.email : null);
      if (!clientEmail) continue;
      if (!(await shouldSendNotificationEmail(clientEmail, "meetingReminders"))) {
        // Mark as handled either way so we don't re-check this meeting every run.
        meeting.reminderSentAt = new Date();
        await meeting.save().catch(() => {});
        continue;
      }
      const client = meeting.clientId ? await User.findById(meeting.clientId).select("name").catch(() => null) : null;
      await sendMeetingReminderEmail({
        to: clientEmail,
        name: client?.name || meeting.participants?.[0]?.name,
        title: meeting.title,
        scheduledAt: meeting.scheduledAt,
        meetingLink: meeting.meetingLink
      });
      meeting.reminderSentAt = new Date();
      await meeting.save().catch(() => {});
      sent += 1;
    } catch (error) {
      console.error(`Meeting reminder failed for ${meeting._id}:`, error.message);
    }
  }
  return sent;
}

function isMonday(date) {
  return date.getDay() === 1;
}

async function sendWeeklyProjectReports() {
  const now = new Date();
  if (!isMonday(now)) return 0;

  const clients = await User.find({
    role: "user",
    status: "active",
    "preferences.notifications.weeklyReports": { $ne: false },
    "preferences.notifications.email": { $ne: false },
    $or: [{ lastWeeklyReportAt: { $exists: false } }, { lastWeeklyReportAt: null }, { lastWeeklyReportAt: { $lt: new Date(Date.now() - 6 * 86_400_000) } }]
  }).limit(200).catch(() => []);

  let sent = 0;
  for (const client of clients) {
    try {
      const projects = await Project.find({ clientId: client._id }).select("name currentPhase progress status").catch(() => []);
      if (!projects.length) continue;
      await sendWeeklyProjectReportEmail({
        to: client.email,
        name: client.name,
        projects: projects.map((p) => ({ name: p.name, currentPhase: p.currentPhase, progress: p.progress }))
      });
      client.lastWeeklyReportAt = now;
      await client.save().catch(() => {});
      sent += 1;
    } catch (error) {
      console.error(`Weekly report failed for ${client.email}:`, error.message);
    }
  }
  return sent;
}

// Safety net for pending/failed orders whose immediate billing-alert send
// (in the /api/orders route) never happened or errored out — a payment that
// stays pending/incomplete for more than 30 minutes gets one follow-up
// alert email, gated by the same Billing Alerts preference.
async function sendStalePendingBillingAlerts() {
  const staleBefore = new Date(Date.now() - 30 * 60 * 1000);
  const orders = await Order.find({
    "payment.status": { $in: ["pending", "failed"] },
    "payment.billingAlertSentAt": { $exists: false },
    createdAt: { $lt: staleBefore }
  }).limit(100).catch(() => []);

  let sent = 0;
  for (const order of orders) {
    try {
      const email = order.customer?.customerEmail;
      if (!email || !(await shouldSendNotificationEmail(email, "billingAlerts"))) {
        await Order.findByIdAndUpdate(order._id, { "payment.billingAlertSentAt": new Date() }).catch(() => {});
        continue;
      }
      await sendPaymentCancelledEmail({
        to: email,
        name: order.customer?.customerName,
        packageName: order.package?.name,
        amount: order.package?.total,
      });
      await Order.findByIdAndUpdate(order._id, { "payment.billingAlertSentAt": new Date() }).catch(() => {});
      sent += 1;
    } catch (error) {
      console.error(`Billing alert failed for order ${order._id}:`, error.message);
    }
  }
  return sent;
}

export async function runScheduledNotifications() {
  const now = Date.now();
  if (runInFlight) return runInFlight;
  if (now - lastRunAt < RUN_INTERVAL_MS) return null;

  runInFlight = (async () => {
    const [reminders, reports, billingAlerts] = await Promise.all([
      sendMeetingReminders().catch((error) => { console.error("sendMeetingReminders failed:", error.message); return 0; }),
      sendWeeklyProjectReports().catch((error) => { console.error("sendWeeklyProjectReports failed:", error.message); return 0; }),
      sendStalePendingBillingAlerts().catch((error) => { console.error("sendStalePendingBillingAlerts failed:", error.message); return 0; })
    ]);
    lastRunAt = Date.now();
    return { reminders, reports, billingAlerts };
  })();

  try {
    return await runInFlight;
  } finally {
    runInFlight = null;
  }
}
