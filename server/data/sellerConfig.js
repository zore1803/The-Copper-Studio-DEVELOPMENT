/**
 * Seller (issuer) details printed on every tax invoice.
 *
 * ⚠️ PLACEHOLDERS — replace the values marked `REPLACE_*` with The Copper Studio's
 * real registered details before going live. These are STATIC company details
 * (they are not fetched from Razorpay). The client/customer block and the
 * transaction details ARE dynamic and come from the paid Order + Razorpay.
 *
 * Environment overrides (optional): any field can be supplied via env so you can
 * keep real GSTIN / bank details out of the repo. Env wins over the defaults here.
 */

export const seller = {
  legalName: process.env.SELLER_LEGAL_NAME || "The Copper Studio",
  tradeName: process.env.SELLER_TRADE_NAME || "The Copper Studio",
  // GST registration number. Must be a valid 15-char GSTIN before launch.
  gstin: process.env.SELLER_GSTIN || "REPLACE_GSTIN_27XXXXXXXXXXXZX",
  // Used for "Place of Supply" intra/inter-state CGST+SGST vs IGST decision.
  stateCode: process.env.SELLER_STATE_CODE || "27", // 27 = Maharashtra
  stateName: process.env.SELLER_STATE_NAME || "MAHARASHTRA",
  address: {
    line1: process.env.SELLER_ADDRESS_LINE1 || "REPLACE_ADDRESS_LINE_1",
    line2: process.env.SELLER_ADDRESS_LINE2 || "REPLACE_ADDRESS_LINE_2",
    city: process.env.SELLER_CITY || "Mumbai",
    state: process.env.SELLER_STATE_NAME || "MAHARASHTRA",
    pincode: process.env.SELLER_PINCODE || "400000"
  },
  mobile: process.env.SELLER_MOBILE || "+91 00000 00000",
  email: process.env.SELLER_EMAIL || "contact@thecopperstudio.in",
  website: process.env.SELLER_WEBSITE || "thecopperstudio.in",
  // Logo: absolute URL or data URI. Leave empty to print the text brand mark only.
  logoUrl: process.env.SELLER_LOGO_URL || ""
};

export const bank = {
  name: process.env.SELLER_BANK_NAME || "REPLACE_BANK_NAME",
  accountNumber: process.env.SELLER_BANK_ACCOUNT || "REPLACE_ACCOUNT_NUMBER",
  ifsc: process.env.SELLER_BANK_IFSC || "REPLACE_IFSC",
  branch: process.env.SELLER_BANK_BRANCH || "REPLACE_BRANCH",
  upiId: process.env.SELLER_UPI_ID || "" // optional, e.g. thecopperstudio@hdfcbank
};

export const invoiceSettings = {
  // Total stored on the order is GST-inclusive at this rate (matches finance.js).
  gstRatePercent: Number(process.env.INVOICE_GST_RATE || 18),
  currency: "INR",
  currencySymbol: "₹",
  // SAC (Services Accounting Code). 998314 = IT design & development services.
  defaultSac: process.env.INVOICE_DEFAULT_SAC || "998314",
  // Invoice is for a service already rendered + paid, so due == issue date.
  dueOnIssue: true,
  notes:
    process.env.INVOICE_NOTES ||
    "This is a computer-generated tax invoice for services rendered by The Copper Studio. Payment has been received in full via the online payment gateway; no further amount is due against this invoice.",
  terms: [
    "Payment received in full at the time of order via the online payment gateway.",
    "This invoice is issued against a digital service package and is non-transferable.",
    "Service delivery timelines begin from the date of successful payment as per the agreed package scope.",
    "Any additional scope requested beyond the purchased package may be billed separately.",
    "Any disputes shall be subject to the jurisdiction of the courts at the seller's registered location."
  ]
};

export default { seller, bank, invoiceSettings };
