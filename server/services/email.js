import sgMail from "@sendgrid/mail";
import Settings from "../models/Settings.js";

function clean(value) {
  return String(value || "").trim();
}

async function getMailConfig() {
  let settingsEmail = {};
  try {
    const settings = await Settings.findOne({});
    settingsEmail = settings?.email || {};
  } catch {
    // Email should still work from .env even if the settings row is unavailable.
  }

  const fromEmail = clean(process.env.MAIL_FROM_EMAIL || settingsEmail.senderEmail);
  const fromName = clean(process.env.MAIL_FROM_NAME || settingsEmail.senderName || "The Copper Studio");
  const apiKey = clean(process.env.SENDGRID_API_KEY);

  return { fromEmail, fromName, apiKey };
}

async function sendMail(message) {
  const config = await getMailConfig();

  if (!config.apiKey || !config.fromEmail) {
    const missing = [!config.apiKey && "SENDGRID_API_KEY", !config.fromEmail && "MAIL_FROM_EMAIL"].filter(Boolean).join(", ");
    console.warn(`SendGrid is not configured. Email skipped: ${message.subject}. Missing: ${missing}`);
    return { skipped: true, reason: "sendgrid_not_configured", missing };
  }

  sgMail.setApiKey(config.apiKey);
  const { to, subject, html, attachments } = message;

  try {
    await sgMail.send({
      to,
      from: { email: config.fromEmail, name: config.fromName },
      subject,
      html,
      attachments: attachments?.map((attachment) => ({
        filename: attachment.filename,
        type: attachment.contentType,
        content: Buffer.isBuffer(attachment.content) ? attachment.content.toString("base64") : attachment.content,
        disposition: "attachment"
      }))
    });
    return { skipped: false, provider: "sendgrid" };
  } catch (error) {
    console.error("SendGrid delivery failed:", error.response?.body || error.message);
    const deliveryError = new Error("Email delivery failed via SendGrid. Check SENDGRID_API_KEY and that MAIL_FROM_EMAIL is a verified sender identity.");
    deliveryError.statusCode = 502;
    throw deliveryError;
  }
}

function portalInviteCopy(packageName) {
  if (packageName) {
    return `Your payment for <strong>${packageName}</strong> is complete. Please set your password to access your client portal.`;
  }
  return "Your client portal is ready. Please set your password to access your workspace.";
}

export async function sendPortalInviteEmail({ to, name, setPasswordUrl, packageName }) {
  return sendMail({
    to,
    subject: "Your DataCircles CRM portal is ready",
    html: `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px">
        <h2 style="margin:0 0 12px">Welcome${name ? `, ${name}` : ""}</h2>
        <p>${portalInviteCopy(packageName)}</p>
        <p><a href="${setPasswordUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:11px 16px;border-radius:10px;text-decoration:none;font-weight:700">Set password</a></p>
        <p style="font-size:13px;color:#6b7280">This secure link expires in 48 hours.</p>
      </div>
    `
  });
}

export async function sendInvoiceEmail({ to, name, invoiceNumber, packageName, total, html, pdfBuffer }) {
  const amount = typeof total === "number"
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(total)
    : total;

  return sendMail({
    to,
    subject: `Your tax invoice ${invoiceNumber} — The Copper Studio`,
    html:
      html ||
      `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px">
        <h2 style="margin:0 0 12px">Thank you${name ? `, ${name}` : ""}</h2>
        <p>Your payment${packageName ? ` for <strong>${packageName}</strong>` : ""} has been received in full.</p>
        <p>Tax invoice <strong>${invoiceNumber}</strong>${amount ? ` for <strong>${amount}</strong>` : ""} is attached to this email as a PDF.</p>
        <p style="font-size:13px;color:#6b7280">This is a computer-generated invoice. No further amount is due against it.</p>
      </div>
    `,
    attachments: pdfBuffer
      ? [{ filename: `${String(invoiceNumber || "invoice").replace(/[^a-z0-9-]/gi, "-")}.pdf`, content: pdfBuffer, contentType: "application/pdf" }]
      : undefined
  });
}

export async function sendOtpEmail({ to, code, label }) {
  return sendMail({
    to,
    subject: `Your ${label || "verification"} code — The Copper Studio`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px">
        <h2 style="margin:0 0 12px">Verify your ${label || "details"}</h2>
        <p>Use this code to complete checkout on The Copper Studio:</p>
        <p style="font-size:28px;font-weight:800;letter-spacing:6px;margin:18px 0;color:#2563eb">${code}</p>
        <p style="font-size:13px;color:#6b7280">This code expires in 10 minutes. Ignore this email if you did not request it.</p>
      </div>
    `
  });
}

export async function sendContactCreatedEmail({ name, email, phone, company }) {
  const to = clean(process.env.CONTACT_NOTIFY_EMAIL || process.env.SUPERADMIN_EMAIL);
  if (!to) return { skipped: true, reason: "no_notify_recipient" };

  return sendMail({
    to,
    subject: `New contact added${company ? `: ${company}` : ""}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px">
        <h2 style="margin:0 0 12px">New contact added</h2>
        <p><strong>${name || "Unnamed contact"}</strong>${company ? ` at <strong>${company}</strong>` : ""} was just added to the CRM.</p>
        <p style="font-size:13px;color:#6b7280">
          ${email ? `Email: ${email}<br/>` : ""}
          ${phone ? `Phone: ${phone}` : ""}
        </p>
      </div>
    `
  });
}

export async function sendForgotPasswordOtpEmail({ to, name, otp }) {
  return sendMail({
    to,
    subject: "Your DataCircles password reset OTP",
    html: `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px">
        <h2 style="margin:0 0 12px">Password reset request</h2>
        <p>Hello${name ? ` ${name}` : ""}, use this OTP to reset your CRM password:</p>
        <p style="font-size:28px;font-weight:800;letter-spacing:6px;margin:18px 0;color:#2563eb">${otp}</p>
        <p style="font-size:13px;color:#6b7280">This OTP expires in 10 minutes. Ignore this email if you did not request it.</p>
      </div>
    `
  });
}
