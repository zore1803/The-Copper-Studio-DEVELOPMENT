import Contact from "../models/Contact.js";
import Company from "../models/Company.js";
import { sendAccountStatusEmail } from "./email.js";

// Notifies a client whose own portal login was deactivated/reactivated, and
// separately notifies their company's primary contact (if one is linked and
// isn't the same person) so someone at the company knows a teammate's
// access changed. Failures here should never block the status change itself.
export async function notifyAccountStatusChange(user, activated) {
  try {
    if (!user?.email) return;
    await sendAccountStatusEmail({ to: user.email, recipientName: user.name, activated });

    const contact = await Contact.findOne({ userId: user._id }).catch(() => null);
    if (!contact?.companyId) return;

    const company = await Company.findById(contact.companyId).catch(() => null);
    if (!company?.primaryContactId) return;

    const primaryContact = await Contact.findById(company.primaryContactId).catch(() => null);
    if (!primaryContact?.email || primaryContact.email.toLowerCase() === user.email.toLowerCase()) return;

    await sendAccountStatusEmail({
      to: primaryContact.email,
      recipientName: primaryContact.name,
      clientName: user.name,
      activated,
      forCompany: true
    });
  } catch (error) {
    console.error("notifyAccountStatusChange failed:", error.message);
  }
}
