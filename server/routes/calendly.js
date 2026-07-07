import crypto from "node:crypto";
import express from "express";
import Meeting from "../models/Meeting.js";
import User from "../models/User.js";
import Company from "../models/Company.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getActiveEventTypes, registerWebhookSubscription, buildParticipants } from "../services/calendly.js";

const router = express.Router();

router.get("/event-types", requireAuth, async (req, res, next) => {
  try {
    const eventTypes = await getActiveEventTypes();
    res.json(eventTypes);
  } catch (error) {
    next(error);
  }
});

router.post("/register-webhook", requireAuth, requireRole("superadmin"), async (req, res, next) => {
  try {
    const { callbackUrl } = req.body;
    if (!callbackUrl) return res.status(400).json({ message: "callbackUrl is required." });
    const subscription = await registerWebhookSubscription(callbackUrl);
    res.status(201).json({
      message: "Webhook registered. Save the signing_key below as CALENDLY_WEBHOOK_SIGNING_KEY.",
      subscription
    });
  } catch (error) {
    next(error);
  }
});

function verifySignature(req) {
  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
  if (!signingKey) return true;
  const header = req.get("Calendly-Webhook-Signature") || "";
  const parts = Object.fromEntries(header.split(",").map((part) => part.split("=")));
  if (!parts.t || !parts.v1 || !req.rawBody) return false;
  const signedPayload = `${parts.t}.${req.rawBody}`;
  const expected = crypto.createHmac("sha256", signingKey).update(signedPayload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(parts.v1), Buffer.from(expected));
}

async function matchClient(email) {
  const user = await User.findOne({ email: String(email || "").toLowerCase() });
  if (!user) return { clientId: null, companyId: null };
  const companies = await Company.find({}).select("_id userId userIds");
  const id = String(user._id);
  const company = companies.find((c) => String(c.userId || "") === id || (c.userIds || []).map(String).includes(id));
  return { clientId: user._id, companyId: company?._id || null };
}

router.post("/webhook", async (req, res, next) => {
  try {
    if (!verifySignature(req)) {
      return res.status(401).json({ message: "Invalid webhook signature." });
    }

    const { event, payload } = req.body;
    const scheduledEvent = payload?.scheduled_event || payload?.event || {};
    const eventUri = scheduledEvent.uri || payload?.event;

    if (event === "invitee.created") {
      const { clientId, companyId } = await matchClient(payload.email);
      const start = scheduledEvent.start_time ? new Date(scheduledEvent.start_time) : null;
      const end = scheduledEvent.end_time ? new Date(scheduledEvent.end_time) : null;
      const duration = start && end ? Math.round((end - start) / 60000) : 45;

      const participants = await buildParticipants(payload);

      await Meeting.create({
        title: scheduledEvent.name || "Calendly Meeting",
        type: scheduledEvent.event_type?.slug || "discovery_session",
        status: "confirmed",
        clientId,
        companyId,
        scheduledAt: start || undefined,
        duration,
        meetingLink: scheduledEvent.location?.join_url || scheduledEvent.location?.location || "",
        calendlyEventUri: eventUri || "",
        participants
      });
    }

    if (event === "invitee.canceled" && eventUri) {
      await Meeting.findOneAndUpdate({ calendlyEventUri: eventUri }, { $set: { status: "cancelled" } });
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
