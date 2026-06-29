import { seller, bank, signatory, invoiceSettings } from "../data/sellerConfig.js";

/* ------------------------------------------------------------------ helpers */

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen"
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n) {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? " " + ONES[n % 10] : ""}`;
}

function threeDigits(n) {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  let out = "";
  if (hundred) out += `${ONES[hundred]} Hundred`;
  if (rest) out += `${hundred ? " " : ""}${twoDigits(rest)}`;
  return out;
}

// Indian numbering: ...Crore Lakh Thousand Hundred
function numberToWordsIndian(num) {
  num = Math.floor(Math.abs(Number(num) || 0));
  if (num === 0) return "Zero";
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const rest = num % 1000;
  const parts = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (rest) parts.push(threeDigits(rest));
  return parts.join(", ");
}

export function amountInWordsINR(amount) {
  const rupees = Math.floor(Math.abs(Number(amount) || 0));
  const paise = Math.round((Math.abs(Number(amount) || 0) - rupees) * 100);
  let words = `INR ${numberToWordsIndian(rupees)}`;
  if (paise) words += ` and ${twoDigits(paise)} Paise`;
  return `${words} Rupees Only.`;
}

function money(value) {
  return Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isPaidStatus(value) {
  return ["paid", "completed", "success", "received"].includes(String(value || "").toLowerCase());
}

function invoicePaymentStatus(inv, payment) {
  if (isPaidStatus(payment?.status)) return "Paid";
  if (isPaidStatus(inv?.paymentStatus || inv?.status)) return "Paid";
  return "Pending";
}

/* ----------------------------------------------------- model normalization */

/**
 * Build a print-ready invoice model from a paid Order and (optionally) its
 * Invoice finance record. The Order carries the dynamic client + Razorpay
 * transaction details; sellerConfig carries the static issuer details.
 */
export function buildInvoiceModel({ order, invoice } = {}) {
  const src = order ? (typeof order.toObject === "function" ? order.toObject() : order) : null;
  const inv = invoice ? (typeof invoice.toObject === "function" ? invoice.toObject() : invoice) : null;

  const customer = src?.customer || {};
  const pkg = src?.package || {};
  const payment = src?.payment || {};

  const total = Number(inv?.total ?? pkg.total ?? pkg.price ?? inv?.amount ?? 0);
  const rate = invoiceSettings.gstRatePercent;
  // taxableAmount = the GST-exclusive amount actually charged (post-discount).
  const taxableAmount = total ? Math.round((total / (1 + rate / 100)) * 100) / 100 : 0;
  const gstTotal = Math.round((total - taxableAmount) * 100) / 100;

  // Discount: pkg.price is the GST-exclusive list price; taxableAmount is what was
  // actually charged ex-GST. Any positive gap is the coupon/discount applied.
  const listPrice = Number(pkg.price ?? 0);
  const discount = listPrice && taxableAmount && listPrice > taxableAmount
    ? Math.round((listPrice - taxableAmount) * 100) / 100
    : 0;
  // The line item shows the gross list price; the discount is then deducted below.
  const grossTaxable = discount ? listPrice : taxableAmount;

  // GST presentation depends on whether the customer supplied a GSTIN:
  //  • No GSTIN (B2C, as charged at checkout)  -> single consolidated GST 18% line
  //  • GSTIN in the seller's state             -> intra-state -> CGST + SGST
  //  • GSTIN registered in another state       -> inter-state -> IGST
  const clientGstin = customer.companyGstin || customer.customerGstin || inv?.customerGstin || "";
  const hasClientGstin = Boolean(clientGstin);
  const clientStateCode = clientGstin ? clientGstin.slice(0, 2) : seller.stateCode;
  const isInterState = clientStateCode !== seller.stateCode;

  const addressParts = [
    customer.billingAddressLine1,
    customer.billingAddressLine2,
    [customer.city, customer.state, customer.pincode].filter(Boolean).join(", ")
  ].filter((part) => part && String(part).trim());
  const clientAddress = customer.customerAddress || addressParts.join(", ");

  const cgst = isInterState ? 0 : Math.round((gstTotal / 2) * 100) / 100;
  const sgst = isInterState ? 0 : Math.round((gstTotal - cgst) * 100) / 100;
  const igst = isInterState ? gstTotal : 0;

  const invoiceNumber = inv?.invoiceNumber || payment.invoiceId || `INV-${String(src?._id || "").slice(-6).toUpperCase()}`;
  const issueDate = inv?.issueDate || inv?.date || payment.paidAt || src?.createdAt || new Date();
  const transactionStatus = invoicePaymentStatus(inv, payment);

  const includes = Array.isArray(pkg.includes) ? pkg.includes : [];

  return {
    seller,
    bank,
    settings: invoiceSettings,
    invoiceNumber,
    issueDate,
    dueDate: invoiceSettings.dueOnIssue ? issueDate : (inv?.dueDate || issueDate),
    placeOfSupply: `${seller.stateCode}-${seller.stateName}`,
    isInterState,
    client: {
      name: customer.customerName || inv?.client || "Customer",
      company: customer.customerCompany || inv?.company || "",
      email: customer.customerEmail || inv?.customerEmail || "",
      phone: customer.customerPhone || "",
      gstin: clientGstin,
      address: clientAddress
    },
    transaction: {
      provider: (payment.provider || inv?.provider || "Razorpay").replace(/^\w/, (c) => c.toUpperCase()),
      paymentId: payment.razorpayPaymentId || inv?.razorpayPaymentId || "",
      orderRef: payment.razorpayOrderId || inv?.razorpayOrderId || "",
      method: payment.method || "Online",
      status: transactionStatus,
      paidAt: payment.paidAt || inv?.paidAt || issueDate
    },
    items: [
      {
        sno: 1,
        name: pkg.name || inv?.package || "Service Package",
        label: pkg.label || "",
        description: includes,
        duration: pkg.duration || "",
        hsnSac: invoiceSettings.defaultSac,
        qty: 1,
        amount: grossTaxable
      }
    ],
    totals: {
      grossTaxable,
      discount,
      taxableAmount,
      gstRate: rate,
      hasClientGstin,
      gstTotal,
      cgst,
      sgst,
      igst,
      total,
      totalItems: 1,
      totalQty: 1,
      amountInWords: amountInWordsINR(total)
    }
  };
}

/* ------------------------------------------------------------ HTML rendering */

export function renderInvoiceHtml(input) {
  const m = input?.totals ? input : buildInvoiceModel(input);
  const { seller: s, bank: b, settings: cfg, client, transaction: tx, items, totals } = m;
  const sym = cfg.currencySymbol;
  const isPaid = tx.status === "Paid";

  const itemRows = items
    .map(
      (it) => `
      <tr class="item-row">
        <td class="c-sno">${it.sno}</td>
        <td class="c-item">
          <div class="item-name">${esc(it.name)}${it.label ? ` <span class="item-label">${esc(it.label)}</span>` : ""}</div>
          ${it.duration ? `<div class="item-sub">Duration: ${esc(it.duration)}</div>` : ""}
          ${
            it.description?.length
              ? `<ul class="item-includes">${it.description.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>`
              : ""
          }
        </td>
        <td class="c-hsn">${esc(it.hsnSac)}</td>
        <td class="c-amt">${sym}${money(it.amount)}</td>
      </tr>`
    )
    .join("");

  // No customer GSTIN (B2C) -> single GST line matching the flat 18% charged at
  // checkout. With a GSTIN: inter-state -> IGST, same-state -> CGST + SGST split.
  const taxRows = !totals.hasClientGstin
    ? `<div class="tot-row"><span>GST ${totals.gstRate}%</span><span>${sym}${money(totals.gstTotal)}</span></div>`
    : m.isInterState
      ? `<div class="tot-row"><span>IGST ${totals.gstRate}%</span><span>${sym}${money(totals.igst)}</span></div>`
      : `<div class="tot-row"><span>CGST ${totals.gstRate / 2}%</span><span>${sym}${money(totals.cgst)}</span></div>
         <div class="tot-row"><span>SGST ${totals.gstRate / 2}%</span><span>${sym}${money(totals.sgst)}</span></div>`;

  const txnLine = [
    tx.paymentId ? `Txn: ${esc(tx.paymentId)}` : "",
    tx.orderRef ? `Ref: ${esc(tx.orderRef)}` : ""
  ].filter(Boolean).join(" &nbsp;•&nbsp; ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Tax Invoice ${esc(m.invoiceNumber)}</title>
<style>
  :root { --ink:#1f2937; --muted:#6b7280; --line:#e5e7eb; --copper:#6e5b48; --bg:#ffffff; }
  * { box-sizing: border-box; }
  html, body { margin:0; padding:0; background:#f3f4f6; color:var(--ink);
    font-family: "Inter", "Segoe UI", Arial, sans-serif; font-size:12px; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .sheet { width:794px; min-height:1123px; margin:16px auto; background:var(--bg); padding:34px 38px; }

  .top { display:flex; justify-content:space-between; gap:18px; border-bottom:2px solid var(--copper); padding-bottom:14px; }
  .brand-block { display:flex; flex-direction:column; gap:10px; }
  .logo { max-height:64px; max-width:200px; object-fit:contain; }
  .title { letter-spacing:6px; font-size:12px; font-weight:700; color:var(--copper); margin:0; }
  .seller-block { text-align:right; max-width:380px; }
  .brand-name { font-size:18px; font-weight:800; color:var(--copper); margin:0 0 4px; }
  .seller-meta { color:var(--muted); line-height:1.55; }
  .seller-meta strong { color:var(--ink); font-weight:600; }

  .grid { display:flex; justify-content:space-between; gap:24px; margin-top:16px; }
  .mini-label { text-transform:uppercase; letter-spacing:1px; font-size:9.5px; font-weight:700; color:var(--copper); margin:0 0 5px; }
  .bill-to { max-width:340px; line-height:1.5; }
  .bill-to .name { font-size:13px; font-weight:700; }
  .bill-to .muted { color:var(--muted); }
  .meta-table { border-collapse:collapse; min-width:280px; }
  .meta-table td { padding:3px 0; vertical-align:top; }
  .meta-table td:first-child { color:var(--muted); padding-right:18px; white-space:nowrap; }
  .meta-table td:last-child { text-align:right; font-weight:600; font-family:"Courier New",monospace; word-break:break-all; }

  .items-card { border:1px solid var(--line); border-radius:4px; margin-top:20px; overflow:hidden; }
  table.items { width:100%; border-collapse:collapse; }
  table.items thead th { background:var(--copper); color:#fff; text-align:left; padding:8px 10px; font-size:10.5px; letter-spacing:.4px; }
  table.items thead th.c-amt { text-align:right; }
  table.items td { padding:9px 10px; vertical-align:top; }
  .c-sno { width:30px; color:var(--muted); }
  .c-hsn { width:90px; font-family:"Courier New",monospace; color:var(--muted); }
  .c-amt { width:110px; text-align:right; font-weight:600; white-space:nowrap; }
  .item-name { font-weight:700; }
  .item-label { font-weight:500; color:var(--muted); font-size:10.5px; }
  .item-sub { color:var(--muted); margin-top:2px; }
  .item-includes { margin:6px 0 0; padding-left:16px; color:var(--muted); }
  .item-includes li { margin:1px 0; }

  .totals-strip { border-top:1px solid var(--line); padding:10px 14px; display:flex; justify-content:flex-end; }
  .totals { min-width:260px; }
  .tot-row { display:flex; justify-content:space-between; padding:4px 0; }
  .tot-row.discount span:last-child { color:#15803d; font-weight:600; }
  .tot-row.grand { border-top:1px solid var(--line); margin-top:4px; padding-top:8px; font-size:14px; font-weight:800; color:var(--copper); }

  .below-card { display:flex; justify-content:space-between; gap:24px; margin-top:8px; padding-top:6px; font-size:11px; color:var(--muted); }
  .below-card strong { color:var(--ink); }
  .words { text-align:right; max-width:380px; }

  .paid-banner { margin-top:16px; display:flex; justify-content:flex-end; }
  .paid-banner .box { text-align:right; }
  .paid-banner .label { display:flex; justify-content:flex-end; align-items:center; gap:6px; font-weight:700; color:#15803d; }
  .paid-banner.pending .label { color:#92400e; }
  .paid-banner .tick { display:inline-flex; align-items:center; justify-content:center; width:14px; height:14px; border-radius:50%; background:#16a34a; color:#fff; font-size:9px; }
  .paid-banner.pending .tick { background:#f59e0b; }
  .paid-banner .meta { color:var(--muted); margin-top:2px; }
  .paid-banner .txn { font-family:"Courier New",monospace; font-size:10px; color:var(--muted); margin-top:2px; }

  .lower { display:flex; justify-content:space-between; gap:30px; margin-top:20px; }
  .bank-box { line-height:1.6; }
  .bank-box .row span:first-child { color:var(--muted); display:inline-block; min-width:74px; }
  .bank-box .row span:last-child { font-family:"Courier New",monospace; font-weight:600; }
  .sign { text-align:center; }
  .sign .for { font-weight:700; margin-bottom:6px; }
  .sign .sign-img { display:block; margin:0 auto; max-height:54px; max-width:180px; object-fit:contain; mix-blend-mode:multiply; }
  .sign .line { border-top:1px solid var(--ink); display:inline-block; padding-top:4px; color:var(--muted); min-width:200px; }

  /* Terms & Conditions + Notes always begin on a fresh page, flush to the top. */
  .notes { margin-top:0; padding-top:0; color:var(--muted); line-height:1.55; page-break-before:always; break-before:page; }
  .notes h4:first-child { margin-top:0; }
  .notes h4 { color:var(--ink); margin:0 0 4px; font-size:11px; }
  .notes ol { margin:4px 0 0; padding-left:18px; }
  .notes ol > li { margin-bottom:5px; }
  .notes .term-title { color:var(--ink); font-weight:600; }
  .notes ol ul { list-style:disc; margin:3px 0 2px; padding-left:16px; }
  .notes ol ul li { margin-bottom:2px; }
  .foot { margin-top:18px; text-align:center; color:var(--muted); font-size:10px; border-top:1px solid var(--line); padding-top:10px; }

  @media print { html, body { background:#fff; } .sheet { margin:0; padding:26px 30px; width:auto; min-height:auto; } @page { size:A4; margin:12mm; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="top">
      <div class="brand-block">
        ${s.logoUrl ? `<img class="logo" src="${esc(s.logoUrl)}" alt="${esc(s.legalName)}" />` : ""}
        <p class="title">TAX&nbsp;INVOICE</p>
      </div>
      <div class="seller-block">
        <p class="brand-name">${esc(s.legalName)}</p>
        <div class="seller-meta">
          <div><strong>GSTIN</strong> ${esc(s.gstin)}</div>
          <div>${esc(s.address.line1)}${s.address.line2 ? `, ${esc(s.address.line2)}` : ""}</div>
          <div>${esc(s.address.city)}, ${esc(s.address.state)}, ${esc(s.address.pincode)}</div>
          <div><strong>Mobile</strong> ${esc(s.mobile)}</div>
          <div><strong>Email</strong> ${esc(s.email)}</div>
        </div>
      </div>
    </div>

    <div class="grid">
      <div class="bill-to">
        <p class="mini-label">Bill To:</p>
        <div class="name">${esc(client.name)}</div>
        ${client.company ? `<div>${esc(client.company)}</div>` : ""}
        ${client.gstin ? `<div class="muted">GSTIN: ${esc(client.gstin)}</div>` : ""}
        ${client.phone ? `<div class="muted">Ph: ${esc(client.phone)}</div>` : ""}
        ${client.email ? `<div class="muted">${esc(client.email)}</div>` : ""}
        ${client.address ? `<div class="muted">${esc(client.address)}</div>` : ""}
      </div>
      <div>
        <table class="meta-table">
          <tr><td>Invoice #:</td><td>${esc(m.invoiceNumber)}</td></tr>
          <tr><td>Invoice Date:</td><td>${formatDate(m.issueDate)}</td></tr>
          <tr><td>Due Date:</td><td>${formatDate(m.dueDate)}</td></tr>
          <tr><td>Place of Supply:</td><td>${esc(m.placeOfSupply)}</td></tr>
          ${tx.orderRef ? `<tr><td>Order Ref:</td><td>${esc(tx.orderRef)}</td></tr>` : ""}
          ${tx.paymentId ? `<tr><td>Payment ID:</td><td>${esc(tx.paymentId)}</td></tr>` : ""}
        </table>
      </div>
    </div>

    <div class="items-card">
      <table class="items">
        <thead>
          <tr>
            <th class="c-sno">#</th>
            <th class="c-item">Item</th>
            <th class="c-hsn">HSN/SAC</th>
            <th class="c-amt">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <div class="totals-strip">
        <div class="totals">
          ${totals.discount ? `<div class="tot-row"><span>Sub Total</span><span>${sym}${money(totals.grossTaxable)}</span></div>
          <div class="tot-row discount"><span>Discount</span><span>- ${sym}${money(totals.discount)}</span></div>` : ""}
          <div class="tot-row"><span>Taxable Amount</span><span>${sym}${money(totals.taxableAmount)}</span></div>
          ${taxRows}
          <div class="tot-row grand"><span>Total</span><span>${sym}${money(totals.total)}</span></div>
        </div>
      </div>
    </div>

    <div class="below-card">
      <div>Total Items / Qty : ${totals.totalItems} / ${totals.totalQty}</div>
      <div class="words">Total amount (in words): <strong>${esc(totals.amountInWords)}</strong></div>
    </div>

    <div class="paid-banner${isPaid ? "" : " pending"}">
      <div class="box">
        <div class="label"><span class="tick">${isPaid ? "&#10003;" : "!"}</span> ${isPaid ? "Amount Paid" : "Payment Pending"}</div>
        <div class="meta">${sym}${money(totals.total)} ${isPaid ? `Paid via ${esc(tx.provider)} (${esc(tx.method)}) on ${formatDate(tx.paidAt)}` : `Pending as of ${formatDate(m.issueDate)}`}</div>
        ${isPaid && txnLine ? `<div class="txn">${txnLine}</div>` : ""}
      </div>
    </div>

    <div class="lower">
      <div class="bank-box">
        <p class="mini-label">Bank Details:</p>
        <div class="row"><span>Bank</span><span>${esc(b.name)}</span></div>
        ${b.accountName ? `<div class="row"><span>A/c Name</span><span>${esc(b.accountName)}</span></div>` : ""}
        <div class="row"><span>Account #</span><span>${esc(b.accountNumber)}</span></div>
        <div class="row"><span>IFSC Code</span><span>${esc(b.ifsc)}</span></div>
        <div class="row"><span>Branch</span><span>${esc(b.branch)}</span></div>
        ${b.upiId ? `<div class="row"><span>UPI</span><span>${esc(b.upiId)}</span></div>` : ""}
      </div>
      <div class="sign">
        <div class="for">For ${esc(s.legalName)}</div>
        ${isPaid && signatory.image ? `<img class="sign-img" src="${esc(signatory.image)}" alt="Signature" />` : ""}
        <div class="line">${signatory.name ? `${esc(signatory.name)}<br/>` : ""}Authorized Signatory</div>
      </div>
    </div>

    <div class="notes">
      <h4>Terms &amp; Conditions:</h4>
      <ol>${cfg.terms
        .map((t) =>
          typeof t === "string"
            ? `<li>${esc(t)}</li>`
            : `<li><span class="term-title">${esc(t.title)}</span>${
                (t.points || []).length
                  ? `<ul>${t.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>`
                  : ""
              }</li>`
        )
        .join("")}</ol>
      <h4 style="margin-top:12px">Notes:</h4>
      ${Array.isArray(cfg.notes)
        ? `<ol>${cfg.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ol>`
        : `<div>${esc(cfg.notes)}</div>`}
    </div>

    <div class="foot">This is a digitally generated invoice and does not require a physical signature. &nbsp;•&nbsp; ${esc(s.website)}</div>
  </div>
</body>
</html>`;
}

export default { buildInvoiceModel, renderInvoiceHtml, amountInWordsINR };
