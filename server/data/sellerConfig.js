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

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Embed the brand logo as a data URI so it renders inside the Puppeteer-generated
// PDF (the invoice HTML is loaded via setContent, so relative/served URLs won't
// resolve). Falls back to the text brand mark if the file can't be read.
function assetDataUri(relativeFromAssets, mime) {
  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const filePath = path.resolve(here, "../../assets/", relativeFromAssets);
    const base64 = fs.readFileSync(filePath).toString("base64");
    return `data:${mime};base64,${base64}`;
  } catch {
    return "";
  }
}

function loadLogoDataUri() {
  if (process.env.SELLER_LOGO_URL) return process.env.SELLER_LOGO_URL;
  return assetDataUri("copper-studio-logo.jpeg", "image/jpeg");
}

// Authorized-signatory signature image. Drop the file in as assets/signature.png
// (or .jpg/.jpeg). A white background is handled at render time via
// mix-blend-mode: multiply, so it disappears against the white invoice/email.
function loadSignatureDataUri() {
  if (process.env.SELLER_SIGNATURE_URL) return process.env.SELLER_SIGNATURE_URL;
  return (
    assetDataUri("signature.png", "image/png") ||
    assetDataUri("signature.jpg", "image/jpeg") ||
    assetDataUri("signature.jpeg", "image/jpeg")
  );
}

export const seller = {
  legalName: process.env.SELLER_LEGAL_NAME || "The Copper Studio",
  tradeName: process.env.SELLER_TRADE_NAME || "The Copper Studio",
  // GST registration number.
  gstin: process.env.SELLER_GSTIN || "27AJXPM6211H2ZT",
  // Used for "Place of Supply" intra/inter-state CGST+SGST vs IGST decision.
  stateCode: process.env.SELLER_STATE_CODE || "27", // 27 = Maharashtra
  stateName: process.env.SELLER_STATE_NAME || "MAHARASHTRA",
  address: {
    line1: process.env.SELLER_ADDRESS_LINE1 || "Registered Office No. 721, Floor 7th, Centura Square IT Park",
    line2: process.env.SELLER_ADDRESS_LINE2 || "Road No. 27, Wagle Estate",
    city: process.env.SELLER_CITY || "Thane (West)",
    state: process.env.SELLER_STATE_NAME || "Maharashtra",
    pincode: process.env.SELLER_PINCODE || "400604"
  },
  mobile: process.env.SELLER_MOBILE || "+91 98209 33877",
  email: process.env.SELLER_EMAIL || "contact@thecopperstudio.com",
  website: process.env.SELLER_WEBSITE || "thecopperstudio.com",
  // Logo: absolute URL or data URI. Leave empty to print the text brand mark only.
  logoUrl: loadLogoDataUri()
};

export const signatory = {
  name: process.env.SELLER_SIGNATORY_NAME || "Mukesh Mishra",
  title: process.env.SELLER_SIGNATORY_TITLE || "",
  // Data URI of the signature image (empty until assets/signature.* exists).
  image: loadSignatureDataUri()
};

export const bank = {
  name: process.env.SELLER_BANK_NAME || "State Bank of India",
  accountName: process.env.SELLER_BANK_ACCOUNT_NAME || "DataCircles Technology",
  accountNumber: process.env.SELLER_BANK_ACCOUNT || "44478970783",
  ifsc: process.env.SELLER_BANK_IFSC || "SBIN0061707",
  branch: process.env.SELLER_BANK_BRANCH || "Wagle Circle",
  upiId: process.env.SELLER_UPI_ID || "" // optional, e.g. thecopperstudio@sbi
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

export default { seller, bank, signatory, invoiceSettings };
