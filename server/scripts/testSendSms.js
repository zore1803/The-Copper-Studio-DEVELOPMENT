// One-off: send a single test OTP SMS via the configured Fast2SMS service.
// Usage: node server/scripts/testSendSms.js [10-digit-number]
import "dotenv/config";
import { sendSmsOtp, supportsSms } from "../services/sms.js";

async function run() {
  const phone = process.argv[2] || "8879466037";
  const code = String(Math.floor(100000 + Math.random() * 900000));

  console.log("FAST2SMS_API_KEY configured:", Boolean(process.env.FAST2SMS_API_KEY));
  console.log("supportsSms('+91'):", supportsSms("+91"));
  console.log("SENDER_ID:", process.env.SENDER_ID);
  console.log("DLT_TEMPLATE_ID (Fast2SMS Message ID):", process.env.DLT_TEMPLATE_ID);
  console.log(`Sending test OTP ${code} to ${phone} ...`);

  try {
    const result = await sendSmsOtp({ phone, code });
    console.log("Result:", result);
    console.log("Fast2SMS request_id:", result.requestId);
    if (result?.skipped) console.log("NOTE: send was skipped —", result.reason);
    else console.log("✅ Fast2SMS accepted the message (queued for the carrier).");
  } catch (err) {
    console.error("❌ Send failed:", err.message);
  }
  process.exit(0);
}

run();
