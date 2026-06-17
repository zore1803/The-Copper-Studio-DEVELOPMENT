import { useMemo, useState } from "react";
import { apiGet, apiPost } from "../lib/api";
import { AuthContext, STORAGE_KEY } from "./authStore";

function readStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredAuth);

  const saveSession = (nextSession) => {
    setSession(nextSession);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
  };

  const value = useMemo(() => ({
    user: session?.user || null,
    token: session?.token || "",
    isAuthenticated: Boolean(session?.token && session?.user),
    async login(credentials) {
      const nextSession = await apiPost("/api/auth/login", credentials);
      saveSession(nextSession);
      return nextSession;
    },
    async setPassword(payload) {
      const nextSession = await apiPost("/api/auth/set-password", payload);
      saveSession(nextSession);
      return nextSession;
    },
    async resetPassword(payload) {
      const nextSession = await apiPost("/api/auth/reset-password", payload);
      saveSession(nextSession);
      return nextSession;
    },
    async forgotPassword(payload) {
      return apiPost("/api/auth/forgot-password", payload);
    },
    async refresh() {
      if (!session?.token) return null;
      const data = await apiGet("/api/auth/me", session.token);
      const nextSession = { ...session, user: data.user };
      saveSession(nextSession);
      return nextSession;
    },
    updateUser(updatedUser) {
      const nextSession = { ...session, user: { ...session.user, ...updatedUser } };
      saveSession(nextSession);
    },
    logout() {
      setSession(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
