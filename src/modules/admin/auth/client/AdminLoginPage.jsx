import React, { useState } from "react";
import { loginAdmin, setAdminAccessToken } from "./adminAuthApi.js";
import "../../pricing/client/pricing.css";

function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginAdmin({ email, password });
      setAdminAccessToken(result.token ?? result.accessToken ?? "");
      window.__COPPER_STUDIO_ADMIN_USER__ = result.user;
      window.location.assign("/admin/dashboard");
    } catch (submissionError) {
      setError(submissionError.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="admin-login-page">
      <div className="admin-login-page__container">
        <h1>The Copper Studio</h1>
        <p>Admin Portal</p>
        <form onSubmit={handleSubmit} className="admin-login-page__form">
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" autoComplete="email" />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            autoComplete="current-password"
          />
          {error ? <div className="admin-login-page__error">{error}</div> : null}
          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </section>
  );
}

export { AdminLoginPage };
