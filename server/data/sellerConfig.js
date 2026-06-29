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
  // Numbered notes printed under the "Notes" heading.
  notes: [
    "This invoice has been raised upon receipt of 100% advance payment as per our payment policy.",
    "GST has been charged based on the Place of Supply as per the GST Act, 2017.",
    "TDS deductions, if applicable, must be made under Section 194J (Professional / Technical Services) and Form 16A must be furnished within 15 days of quarterly filing.",
    "Ownership and intellectual property rights of all deliverables shall vest with the client only upon receipt of complete payment.",
    "The scope of this invoice is limited to the services described herein. Any additional requirements will be scoped and billed separately.",
    "For any invoice-related queries, please contact: accounts@thecopperstudio.com"
  ],
  // Terms & Conditions printed as numbered sections, each with sub-points.
  terms: [
    {
      title: "Payment Terms",
      points: [
        "100% advance payment is required prior to commencement of any work or delivery of services.",
        "Invoice is raised only upon receipt of advance payment confirmation.",
        "Payments to be made via NEFT/RTGS/UPI to the bank details mentioned on this invoice."
      ]
    },
    {
      title: "Scope of Services",
      points: [
        "This invoice covers only the services/deliverables explicitly described herein.",
        "Any additional scope of work will be billed separately under a new invoice."
      ]
    },
    {
      title: "Taxation",
      points: [
        "All prices are exclusive of GST unless stated otherwise.",
        "GST is charged as per prevailing rates under the GST Act, 2017.",
        "The Place of Supply is as indicated on this invoice.",
        "Clients eligible for TDS deduction must deduct under Section 194J at applicable rates and furnish Form 16A within 15 days of quarterly filing."
      ]
    },
    {
      title: "Intellectual Property",
      points: [
        "Full ownership and intellectual property rights of deliverables shall be transferred to the client only upon receipt of complete payment.",
        "DataCircles Technology retains the right to showcase completed work in its portfolio unless restricted by a signed NDA."
      ]
    },
    {
      title: "Refund & Cancellation",
      points: [
        "Services once rendered are non-refundable.",
        "In case of project cancellation by the client, payment for work completed till the date of cancellation will be due and payable.",
        "Any advance paid is non-refundable in the event of client-side cancellation."
      ]
    },
    {
      title: "Dispute Resolution",
      points: [
        "Any disputes arising from this invoice shall first be resolved through mutual discussion within 15 days of raising the dispute.",
        "If unresolved, disputes shall be subject to arbitration under the Arbitration and Conciliation Act, 1996.",
        "Jurisdiction: Courts of Thane, Maharashtra shall have exclusive jurisdiction over all matters."
      ]
    },
    {
      title: "Governing Law",
      points: [
        "This invoice and all related engagements shall be governed by the laws of India."
      ]
    },
    {
      title: "Limitation of Liability",
      points: [
        "DataCircles Technology's liability shall not exceed the total value of the invoice in question under any circumstance."
      ]
    },
    {
      title: "Acceptance",
      points: [
        "Payment of this invoice constitutes acceptance of all terms and conditions mentioned herein."
      ]
    }
  ]
};

export default { seller, bank, invoiceSettings };
