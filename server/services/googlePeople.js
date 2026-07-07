// Resolves a display name for an email address the way Gmail's "To" field
// does — by checking the authorized Google account's own Contacts and its
// auto-collected "other contacts" (people it has exchanged mail with). This
// only works for a single mailbox that has been authorized once via the
// /api/google/auth-url flow (superadmin-only) and whose refresh token is
// stored in GOOGLE_OAUTH_REFRESH_TOKEN. If that isn't configured, callers get
// null back and fall through to showing the raw email.

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const PEOPLE_API = "https://people.googleapis.com/v1";

export const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/contacts.readonly",
  "https://www.googleapis.com/auth/contacts.other.readonly"
];

function oauthConfigured() {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    process.env.GOOGLE_OAUTH_REDIRECT_URI
  );
}

export function buildAuthUrl(state) {
  if (!oauthConfigured()) throw new Error("Google OAuth client is not configured.");
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_OAUTH_SCOPES.join(" "),
    ...(state ? { state } : {})
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
      grant_type: "authorization_code"
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || "Failed to exchange code.");
  return data; // { access_token, refresh_token, expires_in, ... }
}

let cachedAccessToken = null;
let cachedExpiry = 0;

async function getAccessToken() {
  if (!oauthConfigured() || !process.env.GOOGLE_OAUTH_REFRESH_TOKEN) return null;
  if (cachedAccessToken && Date.now() < cachedExpiry - 30000) return cachedAccessToken;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
      grant_type: "refresh_token"
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || "Failed to refresh Google access token.");

  cachedAccessToken = data.access_token;
  cachedExpiry = Date.now() + (data.expires_in || 3600) * 1000;
  return cachedAccessToken;
}

function pickBestMatch(results, email) {
  const normalized = email.toLowerCase();
  for (const person of results || []) {
    const match = (person.emailAddresses || []).some((e) => String(e.value || "").toLowerCase() === normalized);
    if (match && person.names?.[0]?.displayName) return person.names[0].displayName;
  }
  return null;
}

// Looks up a name for `email` the same way Gmail autocomplete does: first the
// account's saved Contacts, then its auto-collected "other contacts" (people
// it has emailed/been emailed by but never explicitly saved).
export async function resolveNameFromEmail(email) {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken || !email) return null;

    const contactsRes = await fetch(
      `${PEOPLE_API}/people:searchContacts?query=${encodeURIComponent(email)}&readMask=names,emailAddresses`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (contactsRes.ok) {
      const data = await contactsRes.json();
      const name = pickBestMatch((data.results || []).map((r) => r.person), email);
      if (name) return name;
    }

    const otherRes = await fetch(
      `${PEOPLE_API}/otherContacts:search?query=${encodeURIComponent(email)}&readMask=names,emailAddresses`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (otherRes.ok) {
      const data = await otherRes.json();
      const name = pickBestMatch((data.results || []).map((r) => r.person), email);
      if (name) return name;
    }

    return null;
  } catch (error) {
    console.error("Google People lookup failed:", error.message);
    return null;
  }
}
