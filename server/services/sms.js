// Fast2SMS only reliably delivers to Indian (+91) numbers via its DLT "otp"
// route, so that's the one real-SMS path we wire up; anything else falls
// back to the caller emailing the code instead (see services/otp.js).
const FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2";

export function supportsSms(dialCode) {
  return dialCode === "+91" && Boolean(process.env.FAST2SMS_API_KEY);
}

export async function sendSmsOtp({ phone, code }) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) return { skipped: true, reason: "fast2sms_not_configured" };

  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length !== 10) return { skipped: true, reason: "invalid_phone" };

  // Route selection:
  //  - "dlt": uses a template registered in the Fast2SMS DLT Manager. SENDER_ID
  //    is the approved header and DLT_TEMPLATE_ID is the Fast2SMS "Message ID"
  //    (e.g. 204838). Fast2SMS fills the OTP into its own stored approved
  //    template, so we never hand-build the message text.
  //  - "otp": Fast2SMS's own pre-approved OTP template (fallback).
  const senderId = process.env.SENDER_ID;
  const messageId = process.env.DLT_TEMPLATE_ID;
  const useDlt = Boolean(senderId && messageId);

  const body = useDlt
    ? {
        route: "dlt",
        sender_id: senderId,
        message: messageId,
        variables_values: code,
        numbers: digits,
        flash: 0
      }
    : {
        route: "otp",
        variables_values: code,
        numbers: digits,
        flash: 0
      };

  const response = await fetch(FAST2SMS_URL, {
    method: "POST",
    headers: { authorization: apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.return !== true) {
    console.error("Fast2SMS delivery failed:", data.message || response.statusText);
    const error = new Error("SMS delivery failed. Check FAST2SMS_API_KEY and the recipient number.");
    error.statusCode = 502;
    throw error;
  }
  return {
    skipped: false,
    provider: "fast2sms",
    route: useDlt ? "dlt" : "otp",
    requestId: data.request_id
  };
}
