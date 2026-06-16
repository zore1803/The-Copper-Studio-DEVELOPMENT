async function requestAdmin(path, options = {}) {
  const token = typeof window === "undefined" ? null : window.localStorage.getItem("copper_studio_admin_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    credentials: "include",
    ...options,
    headers,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.message ?? `Admin request failed: ${response.status}`);
  }

  return payload;
}

export { requestAdmin };
