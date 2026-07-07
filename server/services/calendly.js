import Meeting from "../models/Meeting.js";
import User from "../models/User.js";
import Company from "../models/Company.js";
import Contact from "../models/Contact.js";
import { resolveNameFromEmail } from "./googlePeople.js";

const API_BASE = "https://api.calendly.com";

function token() {
  const value = process.env.CALENDLY_ACCESS_TOKEN || process.env.Calendly_Access_Token;
  if (!value) throw new Error("CALENDLY_ACCESS_TOKEN is not configured.");
  return value;
}

async function calendlyFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || `Calendly API error (${response.status})`);
    error.statusCode = response.status;
    throw error;
  }
  return data;
}

let cachedUser = null;
export async function getCurrentUser() {
  if (cachedUser) return cachedUser;
  const data = await calendlyFetch("/users/me");
  cachedUser = data.resource;
  return cachedUser;
}

export async function getActiveEventTypes() {
  const user = await getCurrentUser();
  const data = await calendlyFetch(`/event_types?user=${encodeURIComponent(user.uri)}&active=true&sort=name:asc`);
  return data.collection.map((eventType) => ({
    name: eventType.name,
    slug: eventType.slug,
    schedulingUrl: eventType.scheduling_url,
    durationMinutes: eventType.duration,
    color: eventType.color
  }));
}

export async function getScheduledEvents({ minStartTime, maxStartTime } = {}) {
  const user = await getCurrentUser();
  const params = new URLSearchParams({ user: user.uri, sort: "start_time:desc", count: "50" });
  if (minStartTime) params.set("min_start_time", minStartTime);
  if (maxStartTime) params.set("max_start_time", maxStartTime);
  const data = await calendlyFetch(`/scheduled_events?${params.toString()}`);
  return data.collection;
}

// Guests a primary invitee adds at checkout (`event_guests`) live on the
// event resource itself, not on the invitee — this is the only way to see
// them from a webhook payload, which only carries the invitee.
export async function getScheduledEvent(eventUri) {
  const data = await calendlyFetch(`/scheduled_events/${eventUri.split("/").pop()}`);
  return data.resource;
}

export async function getEventInvitees(eventUri) {
  const data = await calendlyFetch(`/scheduled_events/${eventUri.split("/").pop()}/invitees`);
  return data.collection;
}

async function matchClient(email) {
  const user = await User.findOne({ email: String(email || "").toLowerCase() });
  if (!user) return { clientId: null, companyId: null };
  const companies = await Company.find({}).select("_id userId userIds");
  const id = String(user._id);
  const company = companies.find((c) => String(c.userId || "") === id || (c.userIds || []).map(String).includes(id));
  return { clientId: user._id, companyId: company?._id || null };
}

function initialsFor(name, email) {
  const source = (name || email || "").trim();
  if (!source) return "";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

// Calendly invitees only carry a name for the person who did the booking —
// anyone they added as a guest during checkout only has an email. Resolve a
// name the same way Gmail's "To" field does: our own directory first (portal
// users, then CRM contacts), then the authorized Google mailbox's Contacts /
// mail history (services/googlePeople.js) for everyone else.
async function resolveGuestName(email) {
  const normalized = String(email || "").toLowerCase();
  if (!normalized) return "";
  const user = await User.findOne({ email: normalized }).select("name");
  if (user?.name) return user.name;
  const contact = await Contact.findOne({ email: normalized }).select("name");
  if (contact?.name) return contact.name;
  const googleName = await resolveNameFromEmail(normalized);
  return googleName || "";
}

// Builds the full participants list for a Calendly booking: the primary
// invitee (who has a name) plus every additional guest they added at
// checkout. Guests live on the *event* resource as `event_guests` (just an
// email each, no name) — not on the invitee — so we resolve their names
// ourselves.
export async function buildParticipants(invitee, eventGuests = []) {
  if (!invitee) return [];
  const entries = [
    { name: invitee.name, email: invitee.email },
    ...(eventGuests || []).map((g) => ({ name: "", email: g.email }))
  ];
  const participants = [];
  for (const entry of entries) {
    if (!entry.email) continue;
    const name = entry.name || (await resolveGuestName(entry.email)) || entry.email;
    participants.push({ name, email: entry.email, initials: initialsFor(name, entry.email) });
  }
  return participants;
}

// Pulls recently scheduled/canceled Calendly events directly via the API and
// upserts them into the Meeting collection, matched by calendlyEventUri. This
// is the fallback path for when the Calendly webhook isn't registered or
// isn't reachable (e.g. local/dev, or the subscription was never set up) —
// called opportunistically before serving meeting lists so bookings show up
// even without webhook delivery. Errors are swallowed by the caller so a
// misconfigured Calendly token doesn't break the meetings list.
export async function syncScheduledEventsToMeetings({ sinceDays = 90 } = {}) {
  const minStartTime = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
  const events = await getScheduledEvents({ minStartTime });

  for (const event of events) {
    const nextStatus = event.status === "canceled" ? "cancelled" : "confirmed";
    const existing = await Meeting.findOne({ calendlyEventUri: event.uri });

    let invitee = null;
    try {
      const invitees = await getEventInvitees(event.uri);
      invitee = invitees[0] || null;
    } catch {
      // Invitee lookup failing shouldn't block creating/updating the meeting record.
    }

    if (existing) {
      let changed = false;
      if (existing.status !== nextStatus && existing.status !== "completed") {
        existing.status = nextStatus;
        changed = true;
      }
      // Guests can be added to a Calendly booking after it was first synced
      // (e.g. the invitee edits the event later), so re-check participants
      // every time rather than only at creation.
      const participants = await buildParticipants(invitee, event.event_guests);
      const existingEmails = (existing.participants || []).map((p) => p.email).sort().join(",");
      const nextEmails = participants.map((p) => p.email).sort().join(",");
      if (existingEmails !== nextEmails) {
        existing.participants = participants;
        changed = true;
      }
      if (changed) await existing.save();
      continue;
    }

    const { clientId, companyId } = invitee ? await matchClient(invitee.email) : { clientId: null, companyId: null };
    const participants = await buildParticipants(invitee, event.event_guests);

    await Meeting.create({
      title: event.name || "Calendly Meeting",
      status: nextStatus,
      clientId,
      companyId,
      scheduledAt: event.start_time ? new Date(event.start_time) : undefined,
      duration: event.start_time && event.end_time
        ? Math.round((new Date(event.end_time) - new Date(event.start_time)) / 60000)
        : 30,
      meetingLink: event.location?.join_url || event.location?.location || "",
      calendlyEventUri: event.uri,
      participants,
    });
  }
}

export async function registerWebhookSubscription(callbackUrl) {
  const user = await getCurrentUser();
  const data = await calendlyFetch("/webhook_subscriptions", {
    method: "POST",
    body: JSON.stringify({
      url: callbackUrl,
      events: ["invitee.created", "invitee.canceled"],
      organization: user.current_organization,
      user: user.uri,
      scope: "user"
    })
  });
  return data.resource;
}
