import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { buildAuthUrl, exchangeCodeForTokens } from "../services/googlePeople.js";

const router = express.Router();

// One-time setup: a superadmin visits this to authorize a Google mailbox for
// guest-name lookups (see services/googlePeople.js). Not called by the app
// itself at runtime.
router.get("/auth-url", requireAuth, requireRole("superadmin"), (req, res, next) => {
  try {
    res.json({ url: buildAuthUrl() });
  } catch (error) {
    next(error);
  }
});

// Google redirects here after consent. Exchanges the code for a refresh
// token and prints it so it can be saved as GOOGLE_OAUTH_REFRESH_TOKEN —
// mirrors the Calendly webhook signing-key setup flow.
router.get("/oauth/callback", async (req, res, next) => {
  try {
    const { code, error } = req.query;
    if (error) return res.status(400).send(`Google authorization failed: ${error}`);
    if (!code) return res.status(400).send("Missing authorization code.");

    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      return res.status(200).send(
        "Authorized, but Google did not return a refresh token (it only issues one the first time). " +
        "Revoke access at https://myaccount.google.com/permissions and try again."
      );
    }

    res.status(200).send(
      `Authorized. Save this as GOOGLE_OAUTH_REFRESH_TOKEN in your server env:\n\n${tokens.refresh_token}`
    );
  } catch (error) {
    next(error);
  }
});

export default router;
