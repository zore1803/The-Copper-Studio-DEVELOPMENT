import EmailTemplate from "../models/EmailTemplate.js";

const DEFAULT_EMAIL_TEMPLATES = [
  {
    category: "Welcome",
    name: "Welcome to The Copper Studio",
    subject: "Welcome aboard, {{client_name}}!",
    body: "Hi {{client_name}},\n\nWelcome to The Copper Studio! We're thrilled to have {{company_name}} on board.\n\nOur team will be in touch shortly to kick things off. If you have any questions in the meantime, just reply to this email.\n\nWarm regards,\nThe Copper Studio Team",
  },
  {
    category: "Consultation Booked",
    name: "Consultation Confirmation",
    subject: "Your consultation is confirmed, {{client_name}}",
    body: "Hi {{client_name}},\n\nThanks for booking a consultation with us. We've confirmed your slot and look forward to discussing {{company_name}}'s goals.\n\nWe'll send a calendar invite with the meeting link shortly.\n\nSee you soon,\nThe Copper Studio Team",
  },
  {
    category: "Proposal Sent",
    name: "Proposal Delivered",
    subject: "Your proposal {{proposal_id}} is ready",
    body: "Hi {{client_name}},\n\nWe've prepared proposal {{proposal_id}} for {{company_name}}. Please review it at your convenience and let us know if you have any questions.\n\nLooking forward to working with you,\nThe Copper Studio Team",
  },
  {
    category: "Proposal Reminder",
    name: "Proposal Follow-up",
    subject: "Following up on proposal {{proposal_id}}",
    body: "Hi {{client_name}},\n\nJust a friendly reminder about proposal {{proposal_id}} we sent over for {{company_name}}. Let us know if you'd like to discuss any part of it or move forward.\n\nBest,\nThe Copper Studio Team",
  },
  {
    category: "Coupon Issued",
    name: "Coupon Code Issued",
    subject: "Here's your coupon code, {{client_name}}",
    body: "Hi {{client_name}},\n\nAs promised, here's your coupon code: {{coupon_code}}. Apply it at checkout to redeem your discount.\n\nThanks for choosing The Copper Studio,\nThe Copper Studio Team",
  },
  {
    category: "Payment Success",
    name: "Payment Received",
    subject: "Payment received - thank you, {{client_name}}",
    body: "Hi {{client_name}},\n\nWe've received your payment of {{payment_amount}}. Thank you! A receipt will follow shortly.\n\nBest,\nThe Copper Studio Team",
  },
  {
    category: "Payment Cancelled",
    name: "Payment Not Completed",
    subject: "Payment not completed | The Copper Studio",
    body: "Hi {{client_name}},\n\nYour payment for {{company_name}} was cancelled or could not be completed successfully.\n\nNo successful order has been created from this payment attempt. If any amount was deducted, it is usually reversed by your payment provider within a few working days. Please do not make a duplicate payment — contact us with your payment reference if needed.\n\nBest,\nThe Copper Studio Team",
  },
  {
    category: "Invoice Generated",
    name: "New Invoice",
    subject: "Invoice {{invoice_id}} for {{company_name}}",
    body: "Hi {{client_name}},\n\nPlease find invoice {{invoice_id}} attached for {{company_name}}. Let us know if you have any questions about the charges.\n\nThanks,\nThe Copper Studio Team",
  },
  {
    category: "Project Started",
    name: "Project Kickoff",
    subject: "{{project_name}} has officially started",
    body: "Hi {{client_name}},\n\nGreat news - {{project_name}} is now underway! We'll keep you posted as we hit each milestone.\n\nExcited to get started,\nThe Copper Studio Team",
  },
  {
    category: "Project Update",
    name: "Project Status Update",
    subject: "Update on {{project_name}}",
    body: "Hi {{client_name}},\n\nHere's a quick update on {{project_name}}: current status is {{project_status}}.\n\nReach out if you have any questions.\n\nBest,\nThe Copper Studio Team",
  },
  {
    category: "Testing Started",
    name: "Testing Phase Started",
    subject: "{{project_name}} has entered testing",
    body: "Hi {{client_name}},\n\n{{project_name}} has moved into the testing phase. We'll share results and next steps soon.\n\nThanks for your patience,\nThe Copper Studio Team",
  },
  {
    category: "Project Delivered",
    name: "Project Delivered",
    subject: "{{project_name}} is complete!",
    body: "Hi {{client_name}},\n\nWe're excited to let you know that {{project_name}} has been delivered. Thank you for trusting The Copper Studio with this project.\n\nWarm regards,\nThe Copper Studio Team",
  },
  {
    category: "Support Follow-up",
    name: "Support Follow-up",
    subject: "Checking in, {{client_name}}",
    body: "Hi {{client_name}},\n\nJust checking in to see how things are going with {{company_name}}. Let us know if you need any support or have questions.\n\nBest,\nThe Copper Studio Team",
  },
];

// Inserts any missing default email templates (by category) without touching
// ones that already exist — safe to call on every server start.
export async function seedEmailTemplates() {
  const existing = await EmailTemplate.find({}, { category: 1 }).lean();
  const existingCategories = new Set(existing.map((t) => t.category));

  const missing = DEFAULT_EMAIL_TEMPLATES.filter((t) => !existingCategories.has(t.category));
  if (!missing.length) return;

  await EmailTemplate.insertMany(
    missing.map((t) => ({
      ...t,
      id: `email-template-seed-${t.category.replace(/\s+/g, "-").toLowerCase()}`,
      status: "Active",
    }))
  );

  console.log(`Seeded ${missing.length} email template(s): ${missing.map((t) => t.category).join(", ")}`);
}
