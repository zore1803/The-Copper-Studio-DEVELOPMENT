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

export async function getEventInvitees(eventUri) {
  const data = await calendlyFetch(`/scheduled_events/${eventUri.split("/").pop()}/invitees`);
  return data.collection;
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
