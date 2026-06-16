const ADMIN_TOKEN_KEY = "copper_studio_admin_token";
const API_BASE_URL = "http://localhost:4000";

function getAdminAccessToken() {
  return typeof window === "undefined"
    ? null
    : window.localStorage.getItem(ADMIN_TOKEN_KEY);
}

function setAdminAccessToken(token) {
  if (typeof window === "undefined") {
    return;
  }

  if (!token) {
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    return;
  }

  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

async function requestAdmin(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  const token = getAdminAccessToken();

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");

  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      payload?.message ?? `Admin request failed: ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

function loginAdmin(credentials) {
  return requestAdmin("/api/admin/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

function loadAdminSession() {
  return requestAdmin("/api/admin/me");
}

export {
  loginAdmin,
  loadAdminSession,
  setAdminAccessToken,
  getAdminAccessToken,
  requestAdmin,
};