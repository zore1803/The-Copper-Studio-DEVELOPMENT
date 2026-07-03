import Contact from "../models/Contact.js";
import Company from "../models/Company.js";
import { sendAccountStatusEmail } from "./email.js";

// Notifies a client whose own portal login was deactivated/reactivated, and
// separately notifies their company's primary contact (set via "Make Primary"
// on a contact) if one is set and isn't the same person. Failures here should
// never block the status change itself.
export async function notifyAccountStatusChange(user, activated) {
  try {
    if (!user?.email) return;
    await sendAccountStatusEmail({ to: user.email, recipientName: user.name, activated });

    const contact = await Contact.findOne({ userId: user._id }).select("companyId company").catch(() => null);
    if (!contact) return;

    const company = contact.companyId
      ? await Company.findById(contact.companyId).select("primaryContact primaryContactEmail").catch(() => null)
      : await Company.findOne({ name: contact.company }).select("primaryContact primaryContactEmail").catch(() => null);
    if (!company?.primaryContactEmail || company.primaryContactEmail.toLowerCase() === user.email.toLowerCase()) return;

    await sendAccountStatusEmail({
      to: company.primaryContactEmail,
      recipientName: company.primaryContact,
      clientName: user.name,
      activated,
      forCompany: true
    });
  } catch (error) {
    console.error("notifyAccountStatusChange failed:", error.message);
  }
}
