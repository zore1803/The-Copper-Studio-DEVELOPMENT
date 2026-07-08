import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import { AlertCircle, ArrowUpDown, Check, CheckCircle2, ChevronLeft, ChevronRight, Download, Edit2, Eye, FileDown, FileText, Loader2, MoreVertical, Plus, ReceiptText, Save, Search, Send, WalletCards } from "lucide-react";
import { Button } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import { useAuth } from "../../auth/useAuth";
import { apiGet } from "../../lib/api";
import SidePanel from "../../components/SidePanel";
import FilterButton from "../../components/FilterButton";
import MobileListCard, { CARD_TONES, MobileListPagination } from "../../components/MobileListCard";
import { generateInvoiceNumber } from "../../lib/invoiceDefaults";
import { generateDefaultProjectName, generateProjectCode } from "../../lib/projectDefaults";

const PAGE_SIZE = 25;
const INVOICE_STATUSES = ["Draft", "Generated", "Sent", "Paid", "Overdue", "Cancelled"];
const UNPAID_STATUS_ACTIONS = ["Draft", "Generated", "Paid"];

const SORT_OPTIONS = [
  { value: "created_desc", label: "Newest first" },
  { value: "created_asc", label: "Oldest first" },
  { value: "amount_desc", label: "Amount (high–low)" },
  { value: "amount_asc", label: "Amount (low–high)" },
  { value: "company_asc", label: "Company (A–Z)" }
];

// Closes the sort dropdown when clicking outside its trigger/menu.
function useClickOutside(ref, onOutside, active) {
  useEffect(() => {
    if (!active) return;
    function onDown(event) {
      if (ref.current && ref.current.contains(event.target)) return;
      onOutside();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [active, onOutside, ref]);
}

function parseMoney(value) {
  return Number(String(value || "").replace(/[^\d.-]/g, "")) || 0;
}

function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function isPaidInvoice(invoice) {
  return String(invoice.status || invoice.paymentStatus || "").toLowerCase() === "paid";
}

function normalizedStatus(value, fallback = "Draft") {
  const status = String(value || "").trim();
  if (!status) return fallback;
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function isDraftLikeStatus(value) {
  const status = String(value || "").trim().toLowerCase();
  return !status || status === "draft" || status === "pending" || status === "generated";
}

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fff1ec] text-[#8D3118]">
          <Icon size={17} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">{label}</p>
          <p className="mt-0.5 text-lg font-bold text-[#111827]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", options, disabled = false, hint = "" }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[#374151]">{label}</span>
      {options ? (
        <select value={value || ""} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#8D3118] disabled:bg-[#f3f4f6] disabled:text-[#6b7280]">
          {options.map((opt) => (
            typeof opt === "string"
              ? <option key={opt} value={opt}>{opt}</option>
              : <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#8D3118] focus:ring-2 focus:ring-[#8D3118]/20 disabled:bg-[#f3f4f6] disabled:text-[#6b7280]" />
      )}
      {hint && <span className="mt-1 block text-[11px] text-[#9ca3af]">{hint}</span>}
    </label>
  );
}

// Coupon code input with a "Check" button that looks the code up the same
// way checkout validates one (existence, expiry, usage status) — but via the
// admin lookup endpoint, which doesn't require a matching real package/
// category (a manual invoice's amount is typed in directly, not tied to a
// live Package record), so it just reports what the coupon actually is.
function CouponCheckField({ value, onChange, onResult }) {
  const { token } = useAuth();
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null); // { ok: true, data } | { ok: false, message }

  async function check() {
    const code = String(value || "").trim();
    if (!code) return;
    setChecking(true);
    setResult(null);
    try {
      const data = await apiGet(`/api/admin/coupons/lookup/${encodeURIComponent(code)}`, token);
      setResult({ ok: data.isUsable, data });
      onResult?.(data.isUsable ? data : null);
    } catch (err) {
      setResult({ ok: false, message: err.message || "Could not look up this coupon." });
      onResult?.(null);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="sm:col-span-2">
      <span className="text-xs font-semibold text-[#374151]">Coupon Code</span>
      <div className="mt-1.5 flex gap-2">
        <input
          value={value || ""}
          onChange={(e) => { onChange(e.target.value.toUpperCase()); setResult(null); onResult?.(null); }}
          placeholder="Optional"
          className="flex-1 rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#8D3118] focus:ring-2 focus:ring-[#8D3118]/20"
        />
        <Button type="button" variant="secondary" onClick={check} disabled={!value || checking}>
          {checking ? <Loader2 size={14} className="animate-spin" /> : "Check"}
        </Button>
      </div>
      {result && (
        <div className={`mt-2 rounded-lg px-3 py-2 text-xs ${result.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
          {result.ok ? (
            <div className="flex items-start gap-1.5">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
              <span>
                Valid — {result.data.amountType === "fixed" ? `₹${result.data.amount} off` : `${result.data.amount}% off`}
                {result.data.category ? `, for ${result.data.category} packages` : ""}
                {result.data.packageName ? `, ${result.data.packageName} package only` : ""}. Status: {result.data.status}.
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-1.5">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{result.data?.message || result.message}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Per-row View / Download / Edit menu, replacing the old single download icon.
function InvoiceRowActions({ onView, onDownload, onEdit }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDown(event) {
      if (btnRef.current?.contains(event.target)) return;
      if (menuRef.current?.contains(event.target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function toggle() {
    if (!open) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.right - 160 });
    }
    setOpen((v) => !v);
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#374151] transition-colors"
      >
        <MoreVertical size={15} />
      </button>
      {open && pos && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: pos.top, left: pos.left }}
          className="z-50 w-40 rounded-xl border border-[#e5e7eb] bg-white shadow-lg py-1"
        >
          <button onClick={() => { setOpen(false); onView(); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#374151] hover:bg-[#f9fafb]">
            <Eye size={14} /> View
          </button>
          <button onClick={() => { setOpen(false); onDownload(); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#374151] hover:bg-[#f9fafb]">
            <Download size={14} /> Download
          </button>
          <button onClick={() => { setOpen(false); onEdit(); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#374151] hover:bg-[#f9fafb]">
            <Edit2 size={14} /> Edit
          </button>
        </div>,
        document.body
      )}
    </>
  );
}

// Lightweight edit panel for an existing invoice's own fields — amount, GST,
// due date, coupon, and the transaction reference. Doesn't touch the
// company/project it's linked to (that's fixed once created); use "Generate
// Invoice" for a brand-new one instead.
function EditInvoiceModal({ invoice, packages = [], onClose, onSave }) {
  const issueDate = invoice.issueDate || invoice.date;
  const issueD = issueDate ? new Date(issueDate) : null;
  const validIssueD = issueD && !Number.isNaN(issueD.getTime()) ? issueD : null;

  // If this invoice's package name matches a live Package record, its price
  // is fixed by the admin in the database — lock the total to that (plus GST)
  // instead of letting it be typed here, same as the Generate Invoice form.
  const matchedPackage = useMemo(
    () => packages.find((p) => p.name === invoice.package),
    [packages, invoice.package]
  );
  const isRealPackage = Boolean(matchedPackage);
  const [basePrice] = useState(() => (matchedPackage ? Number(matchedPackage.price) : 0));
  const [discountRupees, setDiscountRupees] = useState(0);

  const [form, setForm] = useState({
    total: String(invoice.total ?? invoice.amount ?? ""),
    tax: String(invoice.tax ?? invoice.gst ?? ""),
    dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().slice(0, 10) : "",
    couponCode: invoice.couponCode || "",
    razorpayPaymentId: invoice.razorpayPaymentId || invoice.paymentId || "",
    transactionDate: validIssueD ? validIssueD.toISOString().slice(0, 10) : "",
    transactionTime: validIssueD ? validIssueD.toISOString().slice(11, 16) : ""
  });
  const [saving, setSaving] = useState(false);
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  function handleCouponResult(data) {
    const base = isRealPackage ? basePrice : Math.round((Number(form.total) || 0) / 1.18);
    if (!data) {
      setDiscountRupees(0);
      if (isRealPackage) setForm((prev) => ({ ...prev, total: String(Math.round(basePrice * 1.18)) }));
      return;
    }
    const numericAmount = Number(String(data.amount || "").replace(/[^\d.]/g, "")) || 0;
    const discount = data.amountType === "fixed"
      ? Math.min(base, numericAmount)
      : Math.min(base, Math.round((base * numericAmount) / 100));
    setDiscountRupees(discount);
    const discountedBase = Math.max(0, base - discount);
    setForm((prev) => ({ ...prev, total: String(Math.round(discountedBase * 1.18)) }));
  }

  async function handleSave() {
    if (!(Number(form.total) > 0)) return alert("Enter a valid invoice total.");
    setSaving(true);
    try {
      let nextIssueDate = issueDate;
      if (form.transactionDate) {
        const combined = new Date(`${form.transactionDate}T${form.transactionTime || "00:00"}`);
        if (!Number.isNaN(combined.getTime())) nextIssueDate = combined.toISOString();
      }
      await onSave({
        total: Number(form.total),
        amount: Number(form.total),
        tax: Number(form.tax) || 0,
        gst: Number(form.tax) || 0,
        dueDate: form.dueDate || null,
        couponCode: form.couponCode,
        razorpayPaymentId: form.razorpayPaymentId,
        issueDate: nextIssueDate,
        date: nextIssueDate
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SidePanel
      title="Edit Invoice"
      subtitle={invoice.invoiceNumber || invoice.id || "Invoice"}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}><Save size={14} /> {saving ? "Saving…" : "Save Changes"}</Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Amount (INR, incl. GST)"
          type="number"
          value={form.total}
          onChange={set("total")}
          disabled={isRealPackage}
          hint={isRealPackage
            ? `Fixed package price: ₹${Math.round(basePrice * 1.18).toLocaleString("en-IN")}${discountRupees > 0 ? ` − ₹${Math.round(discountRupees * 1.18).toLocaleString("en-IN")} coupon discount` : ""}. Not editable — set by the package's price in the database.`
            : ""}
        />
        <Field label="GST / Tax (INR)" type="number" value={form.tax} onChange={set("tax")} />
        <Field label="Due Date" type="date" value={form.dueDate} onChange={set("dueDate")} />
        <CouponCheckField value={form.couponCode} onChange={set("couponCode")} onResult={handleCouponResult} />

        <div className="sm:col-span-2 mt-2 border-t border-[#f3f4f6] pt-4">
          <p className="text-sm font-bold text-[#111827]">Transaction Reference</p>
        </div>
        <div className="sm:col-span-2">
          <Field label="Transaction ID" value={form.razorpayPaymentId} onChange={set("razorpayPaymentId")} hint="Optional" />
        </div>
        <Field label="Transaction Date" type="date" value={form.transactionDate} onChange={set("transactionDate")} />
        <Field label="Transaction Time" type="time" value={form.transactionTime} onChange={set("transactionTime")} />
      </div>
    </SidePanel>
  );
}

function InvoiceModal({ companies, projects, contacts = [], packages = [], onClose, onSave }) {
  const [mode, setMode] = useState("existing");
  const [clientQuery, setClientQuery] = useState("");
  const [clientOpen, setClientOpen] = useState(false);
  const [pkgChoice, setPkgChoice] = useState("");
  const [form, setForm] = useState({
    companyId: "",
    companyName: "",
    customerEmail: "",
    customerPhone: "",
    customerName: "",
    billingAddressLine1: "",
    billingAddressLine2: "",
    city: "",
    state: "",
    pincode: "",
    companyGstin: "",
    companyWebsite: "",
    projectName: "",
    packageName: "",
    amount: "",
    couponCode: "",
    transactionId: "",
    transactionDate: "",
    transactionTime: ""
  });
  const [saving, setSaving] = useState(false);
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  // A real package's price is fixed by the admin in the database (not typed
  // in here), so once one is selected the Amount field just displays that
  // price minus whatever coupon discount applies — it isn't itself editable.
  // "Custom package" has no such fixed price, so it stays freely editable.
  const isRealPackage = Boolean(pkgChoice) && pkgChoice !== "custom";
  const [basePrice, setBasePrice] = useState(0);
  const [discountRupees, setDiscountRupees] = useState(0);
  const companyOptions = [
    { value: "", label: "Select company" },
    ...companies.map((company) => ({
      value: company._id || company.id,
      label: company.name || company.companyName || "Unnamed company"
    }))
  ];
  const selectedCompany = useMemo(
    () => companies.find((company) => String(company._id || company.id) === String(form.companyId)),
    [companies, form.companyId]
  );
  const normalizedSelectedCompany = useMemo(
    () => selectedCompany ? { ...selectedCompany, name: selectedCompany.name || selectedCompany.companyName || "Company" } : null,
    [selectedCompany]
  );
  const generatedProjectName = useMemo(
    () => normalizedSelectedCompany ? generateDefaultProjectName(normalizedSelectedCompany, projects) : "",
    [normalizedSelectedCompany, projects]
  );
  const generatedProjectCode = useMemo(
    () => normalizedSelectedCompany ? generateProjectCode(normalizedSelectedCompany, projects) : "",
    [normalizedSelectedCompany, projects]
  );

  useEffect(() => {
    if (mode !== "existing") return;
    setForm((prev) => ({ ...prev, projectName: generatedProjectName }));
  }, [mode, generatedProjectName]);

  // Package picker: the live packages plus a "Custom" option for ad-hoc work.
  const packageOptions = [
    { value: "", label: "Select package" },
    ...packages.map((p) => ({ value: p.id, label: `${p.name} — ₹${Number(p.price).toLocaleString("en-IN")}` })),
    { value: "custom", label: "Custom package…" }
  ];

  function onPackageChange(value) {
    setPkgChoice(value);
    setDiscountRupees(0);
    if (value === "custom") {
      setBasePrice(0);
      setForm((prev) => ({ ...prev, packageName: "" }));
    } else if (value) {
      const pkg = packages.find((p) => String(p.id) === String(value));
      const price = pkg ? Number(pkg.price) : 0;
      setBasePrice(price);
      setForm((prev) => ({ ...prev, packageName: pkg?.name || "", amount: pkg ? String(price) : prev.amount }));
    } else {
      setBasePrice(0);
      setForm((prev) => ({ ...prev, packageName: "" }));
    }
  }

  // Applies (or clears) a validated coupon's discount. For a real package the
  // base is its fixed DB price; for a custom package there's no fixed price,
  // so the base is whatever's currently typed into Amount at the moment the
  // coupon is checked.
  function handleCouponResult(data) {
    const base = isRealPackage ? basePrice : (Number(form.amount) || 0);
    if (!data) {
      setDiscountRupees(0);
      if (isRealPackage) setForm((prev) => ({ ...prev, amount: String(basePrice) }));
      return;
    }
    const numericAmount = Number(String(data.amount || "").replace(/[^\d.]/g, "")) || 0;
    const discount = data.amountType === "fixed"
      ? Math.min(base, numericAmount)
      : Math.min(base, Math.round((base * numericAmount) / 100));
    setDiscountRupees(discount);
    setForm((prev) => ({ ...prev, amount: String(Math.max(0, base - discount)) }));
  }

  // Searchable list of existing clients (contacts) for the recommendation dropdown.
  const clientMatches = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    const list = q
      ? contacts.filter((c) => `${c.name || ""} ${c.email || ""} ${c.company || ""}`.toLowerCase().includes(q))
      : contacts;
    return list.slice(0, 8);
  }, [contacts, clientQuery]);

  // Picking an existing client pre-fills their details and auto-selects their
  // company, so the admin only has to add the package + amount. A brand-new
  // project is still created for them on save (same pipeline as checkout).
  function selectClient(contact) {
    const company = companies.find(
      (c) => String(c._id || c.id) === String(contact.companyId) || (contact.company && c.name === contact.company)
    );
    setForm((prev) => ({
      ...prev,
      customerName: contact.name || "",
      customerEmail: contact.email || "",
      customerPhone: contact.phone || "",
      companyId: company ? (company._id || company.id) : prev.companyId,
      companyName: company ? "" : (contact.company || prev.companyName),
      companyGstin: company?.gstin || prev.companyGstin,
      companyWebsite: company?.website || prev.companyWebsite
    }));
    if (company) setMode("existing");
    setClientQuery(contact.name || contact.email || "");
    setClientOpen(false);
  }

  async function handleSave() {
    if (saving) return;
    if (mode === "existing" && !form.companyId) return alert("Please select a company.");
    if (mode === "new" && !form.companyName.trim()) return alert("Please enter a company name.");
    if (!form.customerName.trim() || !form.customerEmail.trim()) return alert("Customer name and email are required.");
    if (!pkgChoice) return alert("Please select a package (or choose Custom).");
    if (!form.packageName.trim()) return alert("Enter a name for the custom package.");
    if (!(Number(form.amount) > 0)) return alert("Enter a valid invoice amount.");
    setSaving(true);
    try {
      const payload = mode === "existing"
        ? { ...form, companyName: "", projectName: generatedProjectName }
        : { ...form, companyId: "" };
      await onSave(payload);
    } catch (error) {
      alert(error.message || "Could not generate invoice.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SidePanel
      title="Generate Invoice"
      subtitle="Create a paid manual invoice and link it to a company and project."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}><Save size={14} /> {saving ? "Saving…" : "Save Invoice"}</Button>
        </div>
      }
    >
      {/* Existing-client picker: search by name / email / company. Selecting one
          auto-fills the client + company so a new project is created under them. */}
      <div className="relative mb-5">
        <label className="text-xs font-semibold text-[#374151]">Bill an Existing Client</label>
        <div className="relative mt-1.5">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input
            value={clientQuery}
            onChange={(e) => { setClientQuery(e.target.value); setClientOpen(true); }}
            onFocus={() => setClientOpen(true)}
            onBlur={() => setTimeout(() => setClientOpen(false), 150)}
            placeholder="Search clients by name, email, or company…"
            className="w-full rounded-lg border border-[#e5e7eb] pl-9 pr-3 py-2 text-sm outline-none focus:border-[#8D3118] focus:ring-2 focus:ring-[#8D3118]/20"
          />
          {clientOpen && clientMatches.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-[#e5e7eb] bg-white py-1 shadow-lg">
              {clientMatches.map((contact) => (
                <li key={contact._id || contact.id || contact.email}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); selectClient(contact); }}
                    className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-[#fafafa]"
                  >
                    <span className="text-sm font-semibold text-[#111827]">{contact.name || "Unnamed client"}</span>
                    <span className="text-[11px] text-[#6b7280]">{[contact.email, contact.company].filter(Boolean).join(" · ") || "No details"}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="mt-1 text-[11px] text-[#9ca3af]">Or just fill in the details below for a new client.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 rounded-lg bg-[#f3f4f6] p-1">
        <button
          type="button"
          onClick={() => setMode("existing")}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${mode === "existing" ? "bg-white text-[#111827] shadow-sm" : "text-[#6b7280] hover:text-[#111827]"}`}
        >
          Existing Company
        </button>
        <button
          type="button"
          onClick={() => setMode("new")}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${mode === "new" ? "bg-white text-[#111827] shadow-sm" : "text-[#6b7280] hover:text-[#111827]"}`}
        >
          New Company
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Company: pick an existing one or name a brand-new one. */}
        {mode === "existing" ? (
          <div className="sm:col-span-2">
            <Field label="Select Company" value={form.companyId} onChange={set("companyId")} options={companyOptions} />
          </div>
        ) : (
          <div className="sm:col-span-2"><Field label="Company Name" value={form.companyName} onChange={set("companyName")} /></div>
        )}

        {/* Client details are always collected here: a manual invoice has no
            checkout form to pull them from. */}
        <div className="sm:col-span-2 mt-2 border-t border-[#f3f4f6] pt-4">
          <p className="text-sm font-bold text-[#111827]">Client Information</p>
          <p className="text-[11px] text-[#9ca3af]">Entered manually since the client did not go through checkout.</p>
        </div>
        <Field label="Customer Full Name" value={form.customerName} onChange={set("customerName")} />
        <Field label="Customer Email" type="email" value={form.customerEmail} onChange={set("customerEmail")} />
        <Field label="Customer Phone" value={form.customerPhone} onChange={set("customerPhone")} />
        <Field label="GSTIN" value={form.companyGstin} onChange={set("companyGstin")} hint="Optional" />
        <Field label="Website" value={form.companyWebsite} onChange={set("companyWebsite")} hint="Optional" />

        <div className="sm:col-span-2 mt-2 border-t border-[#f3f4f6] pt-4">
          <p className="text-sm font-bold text-[#111827]">Billing Address</p>
        </div>
        <div className="sm:col-span-2"><Field label="Address Line 1" value={form.billingAddressLine1} onChange={set("billingAddressLine1")} /></div>
        <div className="sm:col-span-2"><Field label="Address Line 2" value={form.billingAddressLine2} onChange={set("billingAddressLine2")} hint="Optional" /></div>
        <Field label="City" value={form.city} onChange={set("city")} />
        <Field label="State" value={form.state} onChange={set("state")} />
        <Field label="Pincode" value={form.pincode} onChange={set("pincode")} />

        <div className="sm:col-span-2 mt-2 border-t border-[#f3f4f6] pt-4">
          <p className="text-sm font-bold text-[#111827]">Project & Invoice Details</p>
        </div>
        <div className="sm:col-span-2">
          {mode === "existing" ? (
            <Field
              label="Project Name"
              value={generatedProjectName || "Select a company to generate"}
              onChange={() => {}}
              disabled
              hint={generatedProjectCode ? `Project ID: ${generatedProjectCode}` : "Auto-generated after company selection and locked for manual invoices."}
            />
          ) : (
            <Field label="Project Name" value={form.projectName} onChange={set("projectName")} />
          )}
        </div>
        <Field label="Package / Service" value={pkgChoice} onChange={onPackageChange} options={packageOptions} />
        {pkgChoice === "custom" && (
          <Field label="Custom Package Name" value={form.packageName} onChange={set("packageName")} hint="Describe the custom service" />
        )}
        <Field
          label="Amount before GST (INR)"
          type="number"
          value={form.amount}
          onChange={set("amount")}
          disabled={isRealPackage}
          hint={
            (isRealPackage
              ? `Fixed package price: ₹${basePrice.toLocaleString("en-IN")}${discountRupees > 0 ? ` − ₹${discountRupees.toLocaleString("en-IN")} coupon discount` : ""}. Not editable — set by the package's price in the database. `
              : "") +
            (Number(form.amount) > 0
              ? `18% GST added → total ₹${Math.round(Number(form.amount) * 1.18).toLocaleString("en-IN")}. `
              : "") +
            (!isRealPackage ? "Enter the pre-GST amount." : "")
          }
        />
        <CouponCheckField value={form.couponCode} onChange={set("couponCode")} onResult={handleCouponResult} />

        <div className="sm:col-span-2 mt-2 border-t border-[#f3f4f6] pt-4">
          <p className="text-sm font-bold text-[#111827]">Transaction Reference</p>
          <p className="text-[11px] text-[#9ca3af]">Optional — still recorded as a manual payment, but the transaction ID and paid-on date/time shown on the invoice come from these instead of "now".</p>
        </div>
        <div className="sm:col-span-2">
          <Field label="Transaction ID" value={form.transactionId} onChange={set("transactionId")} hint="Razorpay payment ID (e.g. pay_XXXXXXXXXXXX). Optional." />
        </div>
        <Field label="Transaction Date" type="date" value={form.transactionDate} onChange={set("transactionDate")} />
        <Field label="Transaction Time" type="time" value={form.transactionTime} onChange={set("transactionTime")} />
      </div>
    </SidePanel>
  );
}

// Matches server/data/sellerConfig.js's default (Maharashtra) — used only to
// decide CGST+SGST vs IGST for the export, since that config isn't reachable
// from the frontend.
const SELLER_STATE_CODE = "27";
const SELLER_STATE_NAME = "MAHARASHTRA";

const EXPORT_COLUMNS = [
  ["srNo", "Sr No"],
  ["invoiceDate", "Invoice Date"],
  ["dueDate", "Due Date"],
  ["companyName", "Company Name"],
  ["addressLine1", "Billing Address Line 1"],
  ["addressLine2", "Billing Address Line 2"],
  ["city", "City"],
  ["state", "State"],
  ["pincode", "Pincode"],
  ["gstNo", "GST No"],
  ["stateCode", "State Code"],
  ["customerName", "Customer Name"],
  ["mobile", "Mobile No (Primary)"],
  ["email", "Email ID"],
  ["packageCategory", "Package Category"],
  ["packagePlan", "Package Plan Name"],
  ["packageAmount", "Package Amount"],
  ["discount", "Discount"],
  ["totalAmount", "Total Amount"],
  ["sgst", "SGST (9%)"],
  ["cgst", "CGST (9%)"],
  ["igst", "IGST (18%)"],
  ["grandTotal", "Grand Total Amount"],
  ["modeOfPayment", "Mode of Payment"],
  ["paymentMethod", "Payment Method"],
  ["invoiceSerialNo", "Invoice Serial No"],
  ["paymentId", "Payment ID"]
];

function exportDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Builds one export row per invoice, cross-referencing companies/contacts/
// packages/coupons (already loaded elsewhere on this page) to fill in fields
// the Invoice record doesn't carry directly — billing address, GSTIN, phone,
// package category, and discount. "Mode of Payment" (Card/UPI/etc.) isn't
// captured anywhere in the system today, so it's left blank rather than guessed.
function buildExportRows(list, { companies, contacts, packages, coupons }) {
  const companyById = new Map();
  const companyByName = new Map();
  companies.forEach((c) => {
    companyById.set(String(c._id || c.id), c);
    if (c.name) companyByName.set(c.name.trim().toLowerCase(), c);
  });
  const contactByEmail = new Map();
  contacts.forEach((c) => { if (c.email) contactByEmail.set(c.email.trim().toLowerCase(), c); });
  const packageByName = new Map();
  packages.forEach((p) => { if (p.name) packageByName.set(p.name.trim().toLowerCase(), p); });
  const couponByCode = new Map();
  coupons.forEach((c) => { if (c.code) couponByCode.set(c.code.trim().toUpperCase(), c); });

  return list.map((invoice, index) => {
    const company = companyById.get(String(invoice.companyId)) || companyByName.get(String(invoice.company || "").trim().toLowerCase()) || {};
    const contact = contactByEmail.get(String(invoice.customerEmail || "").trim().toLowerCase());
    const pkg = packageByName.get(String(invoice.package || "").trim().toLowerCase());
    const coupon = invoice.couponCode ? couponByCode.get(String(invoice.couponCode).trim().toUpperCase()) : null;

    // Billing address state decides CGST+SGST vs IGST, not GSTIN — most
    // domestic customers never enter a GSTIN, so GSTIN-only logic defaulted
    // every such invoice to "same state" (CGST+SGST) regardless of where
    // they're actually billed from.
    const billingState = String(company.state || invoice.state || "").trim();
    const gstin = company.gstin || "";
    const isInterState = billingState
      ? billingState.toUpperCase() !== SELLER_STATE_NAME
      : Boolean(gstin) && gstin.slice(0, 2) !== SELLER_STATE_CODE;
    const total = parseMoney(invoice.total || invoice.amount);
    const gst = parseMoney(invoice.tax || invoice.gst);
    const cgst = isInterState ? 0 : Math.round((gst / 2) * 100) / 100;
    const sgst = isInterState ? 0 : gst - cgst;
    const igst = isInterState ? gst : 0;
    const discount = coupon
      ? (coupon.amountType === "percentage" ? `${coupon.amount}%` : `-₹${coupon.amount}`)
      : "";

    return {
      srNo: index + 1,
      invoiceDate: exportDate(invoice.issueDate || invoice.date),
      dueDate: exportDate(invoice.dueDate),
      companyName: invoice.company || invoice.client || "",
      addressLine1: company.addressLine1 || "",
      addressLine2: company.addressLine2 || "",
      city: company.city || "",
      state: company.state || "",
      pincode: company.pincode || "",
      gstNo: gstin,
      stateCode,
      customerName: invoice.client || "",
      mobile: contact?.phone || "",
      email: invoice.customerEmail || "",
      packageCategory: pkg?.category || "",
      packagePlan: invoice.package || "",
      packageAmount: pkg?.price ?? "",
      discount,
      totalAmount: total,
      sgst,
      cgst,
      igst,
      grandTotal: total + gst,
      modeOfPayment: "",
      paymentMethod: invoice.provider || "",
      invoiceSerialNo: invoice.invoiceNumber || invoice.id || "",
      paymentId: invoice.razorpayPaymentId || invoice.paymentId || ""
    };
  });
}

function downloadBlob(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function exportAsDelimited(rows, delimiter, extension, mime) {
  const header = EXPORT_COLUMNS.map(([, label]) => csvEscape(label)).join(delimiter);
  const lines = rows.map((row) => EXPORT_COLUMNS.map(([key]) => csvEscape(row[key])).join(delimiter));
  downloadBlob(`invoices-export-${Date.now()}.${extension}`, [header, ...lines].join("\n"), mime);
}

function exportAsPdf(rows) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt" });
  const marginX = 24;
  let y = 36;
  doc.setFontSize(14);
  doc.text("Invoices Export", marginX, y);
  y += 20;
  doc.setFontSize(8);

  rows.forEach((row, i) => {
    if (y > 560) { doc.addPage(); y = 36; }
    doc.setFont(undefined, "bold");
    doc.text(`${i + 1}. ${row.invoiceSerialNo || "Invoice"} — ${row.companyName || "—"}`, marginX, y);
    doc.setFont(undefined, "normal");
    y += 12;
    EXPORT_COLUMNS.forEach(([key, label]) => {
      if (key === "srNo") return;
      const value = row[key];
      if (value === "" || value === null || value === undefined) return;
      if (y > 560) { doc.addPage(); y = 36; }
      doc.text(`${label}: ${value}`, marginX + 10, y);
      y += 11;
    });
    y += 10;
  });

  doc.save(`invoices-export-${Date.now()}.pdf`);
}

export default function Invoices() {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [companyFilter, setCompanyFilter] = useState("");
  const [couponFilter, setCouponFilter] = useState("All");
  const [sortBy, setSortBy] = useState("created_desc");
  const [sortOpen, setSortOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(() => Boolean(location.state?.openCreate));
  const [editingInvoice, setEditingInvoice] = useState(null);
  const { records: invoices, save: saveInvoice } = useCrmRecords("invoices");
  const { records: companies } = useCrmRecords("companies");
  const { records: projects } = useCrmRecords("projects");
  const { records: contacts } = useCrmRecords("contacts");
  const { records: coupons } = useCrmRecords("coupons");
  const [packages, setPackages] = useState([]);
  const { showToast } = useToast();
  const sortRef = useRef(null);
  const exportRef = useRef(null);
  useClickOutside(sortRef, () => setSortOpen(false), sortOpen);
  useClickOutside(exportRef, () => setExportOpen(false), exportOpen);

  useEffect(() => {
    if (location.state?.openCreate) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL || "";
    fetch(`${base}/api/packages`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPackages(Array.isArray(data) ? data : []))
      .catch(() => setPackages([]));
  }, []);

  const filtered = useMemo(() => invoices.filter((invoice) => {
    const invoiceStatus = invoice.status || "Draft";
    const matchesStatus = status === "All" || invoiceStatus === status;
    const matchesCompany = !companyFilter.trim() || String(invoice.company || invoice.client || "").toLowerCase().includes(companyFilter.trim().toLowerCase());
    const hasCoupon = Boolean(String(invoice.couponCode || "").trim());
    const matchesCoupon = couponFilter === "All" || (couponFilter === "Yes" ? hasCoupon : !hasCoupon);
    const haystack = `${invoice.invoiceNumber || invoice.id || ""} ${invoice.company || invoice.client || ""} ${invoice.project || ""} ${invoiceStatus} ${invoice.package || ""} ${invoice.customerEmail || ""} ${invoice.couponCode || ""} ${invoice.razorpayPaymentId || invoice.paymentId || ""} ${invoice.total || invoice.amount || ""}`.toLowerCase();
    return matchesStatus && matchesCompany && matchesCoupon && haystack.includes(query.toLowerCase());
  }), [invoices, query, status, companyFilter, couponFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const amt = (i) => parseMoney(i.total || i.amount);
    const created = (i) => new Date(i.createdAt || i.issueDate || i.date || 0);
    const byStr = (a, b, key) => String(a[key] || "").localeCompare(String(b[key] || ""), undefined, { sensitivity: "base" });
    switch (sortBy) {
      case "created_asc": return arr.sort((a, b) => created(a) - created(b));
      case "amount_desc": return arr.sort((a, b) => amt(b) - amt(a));
      case "amount_asc": return arr.sort((a, b) => amt(a) - amt(b));
      case "company_asc": return arr.sort((a, b) => byStr(a, b, "company"));
      case "created_desc":
      default: return arr.sort((a, b) => created(b) - created(a));
    }
  }, [filtered, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  function resetFilters() {
    setStatus("All");
    setCompanyFilter("");
    setCouponFilter("All");
    setQuery("");
    setPage(1);
  }

  const totals = useMemo(() => {
    const paidInvoices = invoices.filter(isPaidInvoice);
    return {
      paidRevenue: paidInvoices.reduce((sum, invoice) => sum + parseMoney(invoice.total || invoice.amount), 0),
      paidTax: paidInvoices.reduce((sum, invoice) => sum + parseMoney(invoice.tax || invoice.gst), 0),
      paid: paidInvoices.length,
      overdue: invoices.filter((invoice) => invoice.status === "Overdue").length,
    };
  }, [invoices]);

  async function handleCreate(form) {
    const base = import.meta.env.VITE_API_BASE_URL || "";
    const response = await fetch(`${base}/api/invoices/manual`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Could not generate invoice.");
    const created = data.invoice
      ? await saveInvoice(data.invoice)
      : await saveInvoice({
          ...form,
          id: `invoice-${Date.now()}`,
          invoiceNumber: generateInvoiceNumber(invoices, new Date()),
          createdAt: new Date().toISOString()
        });
    setCreating(false);
    showToast({ title: "Invoice generated", message: `${created.invoiceNumber || created.id || "Invoice"} saved.` });
  }

  async function handleStatusChange(invoice, nextStatus) {
    const now = new Date().toISOString();
    const updated = {
      ...invoice,
      status: nextStatus,
      paymentStatus: nextStatus,
      paidAt: nextStatus === "Paid" ? (invoice.paidAt || now) : null,
      updatedAt: now
    };
    await saveInvoice(updated);
    showToast({
      title: "Invoice updated",
      message: `${invoice.invoiceNumber || invoice.id || "Invoice"} marked ${nextStatus}.`
    });
  }

  // Both View and Download hit the same server-rendered GST tax invoice
  // (single source of truth shared with the customer + email PDF) — just
  // .../html (opens inline in the tab) vs .../pdf (downloads as attachment).
  // Prefer the linked order, which carries the package line-item detail;
  // fall back to the invoice id / number.
  function invoicePath(invoice, format) {
    const base = import.meta.env.VITE_API_BASE_URL || "";
    const orderId = invoice.sourceOrderId || invoice.orderId;
    const path = orderId
      ? `/api/invoices/by-order/${orderId}/${format}`
      : `/api/invoices/${invoice._id || invoice.id || invoice.invoiceNumber}/${format}`;
    return `${base}${path}`;
  }
  function viewInvoice(invoice) {
    window.open(invoicePath(invoice, "html"), "_blank", "noopener");
  }
  function downloadInvoice(invoice) {
    window.open(invoicePath(invoice, "pdf"), "_blank", "noopener");
  }

  async function handleEditInvoice(invoice, changes) {
    const updated = { ...invoice, ...changes, updatedAt: new Date().toISOString() };
    await saveInvoice(updated);
    showToast({ title: "Invoice updated", message: `${invoice.invoiceNumber || invoice.id || "Invoice"} saved.` });
    setEditingInvoice(null);
  }

  // Exports whatever the current search/status filter resolves to — the
  // full list when nothing is filtered, or just the matching subset.
  function handleExport(format) {
    setExportOpen(false);
    const rows = buildExportRows(sorted, { companies, contacts, packages, coupons });
    if (!rows.length) {
      showToast({ type: "error", title: "Nothing to export", message: "No invoices match the current filters." });
      return;
    }
    if (format === "csv") exportAsDelimited(rows, ",", "csv", "text/csv");
    else if (format === "excel") exportAsDelimited(rows, ",", "csv", "application/vnd.ms-excel");
    else if (format === "txt") exportAsDelimited(rows, "\t", "txt", "text/plain");
    else if (format === "pdf") exportAsPdf(rows);
    showToast({ title: "Export ready", message: `${rows.length} invoice${rows.length === 1 ? "" : "s"} exported.` });
  }

  return (
    <div className="flex flex-col min-h-full bg-[#FFFFFF]">
      <div className="flex flex-col gap-4 border-b border-[#E1E4EA] bg-white px-6 py-3 lg:h-14 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:py-0">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#525866] hover:bg-[#f9fafb] sm:hidden">
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-base font-medium text-[#0E121B]">Invoices</h1>
            <p className="text-xs text-[#525866] mt-0.5">Legal billing documents, PDF generation, customer mapping, and payment mapping.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="flex h-8 w-full items-center gap-2 rounded-full border border-[#E1E4EA] px-3 sm:w-72 transition-colors focus-within:border-[#8D3118] focus-within:bg-[#fff8f6]">
            <Search size={14} className="text-[#525866] shrink-0" />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#525866]"
              placeholder="Search by invoice, company, or project…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            />
          </div>
          {/* Export */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen((value) => !value)}
              className={`flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors ${exportOpen ? "border-[#8D3118] bg-[#fff8f6] text-[#8D3118]" : "border-[#E1E4EA] bg-white text-[#1F2937] hover:bg-[#f9fafb]"}`}
            >
              <FileDown size={15} />
              <span className="hidden sm:inline">Export</span>
            </button>
            {exportOpen && (
              <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-[#e5e7eb] bg-white p-1 shadow-lg">
                <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
                  {status !== "All" || query ? "Export filtered" : "Export all"}
                </p>
                {[
                  { value: "pdf", label: "PDF" },
                  { value: "csv", label: "CSV" },
                  { value: "excel", label: "Excel (.csv)" },
                  { value: "txt", label: "Text (.txt)" }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleExport(opt.value)}
                    className="flex w-full items-center rounded-full px-3 py-2 text-left text-sm text-[#374151] hover:bg-[#f9fafb]"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Sort */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setSortOpen((value) => !value)}
              className={`flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors ${sortOpen ? "border-[#8D3118] bg-[#fff8f6] text-[#8D3118]" : "border-[#E1E4EA] bg-white text-[#1F2937] hover:bg-[#f9fafb]"}`}
            >
              <ArrowUpDown size={15} />
              <span className="hidden sm:inline">{SORT_OPTIONS.find((o) => o.value === sortBy)?.label || "Sort"}</span>
            </button>
            {sortOpen && (
              <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-[#e5e7eb] bg-white p-1 shadow-lg">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setSortOpen(false); setPage(1); }}
                    className={`flex w-full items-center justify-between rounded-full px-3 py-2 text-left text-sm hover:bg-[#f9fafb] ${sortBy === opt.value ? "font-semibold text-[#8D3118]" : "text-[#374151]"}`}
                  >
                    {opt.label}
                    {sortBy === opt.value && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <FilterButton
            onReset={resetFilters}
            buttonClassName="h-8 w-8"
            fields={[
              { key: "status", label: "Status", type: "select", value: status, onChange: (value) => { setStatus(value); setPage(1); }, options: ["All", ...INVOICE_STATUSES] },
              { key: "company", label: "Company", type: "text", value: companyFilter, onChange: (value) => { setCompanyFilter(value); setPage(1); }, placeholder: "Filter by company name…" },
              { key: "coupon", label: "Coupon Applied", type: "select", value: couponFilter, onChange: (value) => { setCouponFilter(value); setPage(1); }, options: ["All", "Yes", "No"] }
            ]}
          />
          <button
            onClick={() => setCreating(true)}
            className="flex h-8 items-center gap-1.5 rounded-full bg-[#8D3118] px-4 text-sm font-medium text-white hover:bg-[#8D3118] transition-colors shadow-sm"
          >
            <Plus size={16} /> Generate Invoice
          </button>
        </div>
      </div>

      <div className="p-5 xl:p-6">
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Paid Revenue" value={money(totals.paidRevenue)} icon={WalletCards} />
        <Metric label="Paid GST / Tax" value={money(totals.paidTax)} icon={ReceiptText} />
        <Metric label="Paid" value={totals.paid} icon={FileText} />
        <Metric label="Overdue" value={totals.overdue} icon={Send} />
      </div>

      {/* Mobile: one card per invoice */}
      <div className="flex flex-col gap-3 sm:hidden">
        {sorted.length ? paginated.map((invoice) => (
          <MobileListCard
            key={invoice._id || invoice.id || invoice.invoiceNumber}
            title={invoice.invoiceNumber || invoice.id || invoice._id}
            subtitle={invoice.project || "Not linked"}
            badge={<InvoiceStatus invoice={invoice} onChange={(nextStatus) => handleStatusChange(invoice, nextStatus)} />}
            fields={[
              { label: "Company", value: invoice.company || invoice.client || "Not linked" },
              { label: "Amount", value: money(parseMoney(invoice.total || invoice.amount)) },
            ]}
            actions={[
              { label: "View", icon: <Eye size={13} />, tone: CARD_TONES.view, onClick: () => viewInvoice(invoice) },
              { label: "Download", icon: <Download size={13} />, tone: CARD_TONES.neutral, onClick: () => downloadInvoice(invoice) },
              { label: "Edit", icon: <Edit2 size={13} />, tone: CARD_TONES.edit, onClick: () => setEditingInvoice(invoice) },
            ]}
          />
        )) : (
          <p className="py-10 text-center text-sm text-[#6b7280]">No invoices found.</p>
        )}
      </div>
      <MobileListPagination
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />

      <section className="hidden sm:block overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
        {sorted.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-[#8D3118] border-b border-[#6E2412]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white">Invoice Number</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white">Project</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-white">Amount</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-white">GST</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white">Issue Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white">Due Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white">Coupon</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white">Transaction ID</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-white">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-white"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {paginated.map((invoice) => (
                    <tr key={invoice._id || invoice.id || invoice.invoiceNumber} className="hover:bg-[#fafafa]">
                      <td className="px-4 py-3 font-mono text-xs text-[#6b7280]">{invoice.invoiceNumber || invoice.id || invoice._id}</td>
                      <td className="px-4 py-3 text-sm text-[#374151]">{invoice.company || invoice.client || "Not linked"}</td>
                      <td className="px-4 py-3 text-sm text-[#374151]">{invoice.project || "Not linked"}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-[#111827]">{money(parseMoney(invoice.total || invoice.amount))}</td>
                      <td className="px-4 py-3 text-right text-sm text-[#374151]">{money(parseMoney(invoice.tax || invoice.gst))}</td>
                      <td className="px-4 py-3 text-sm text-[#374151]">{formatDate(invoice.issueDate || invoice.date)}</td>
                      <td className="px-4 py-3 text-sm text-[#374151]">{formatDate(invoice.dueDate)}</td>
                      <td className="px-4 py-3 text-sm font-mono text-[#374151]">{invoice.couponCode || "-"}</td>
                      <td className="px-4 py-3 text-sm font-mono text-[#374151]">{invoice.razorpayPaymentId || invoice.paymentId || "-"}</td>
                      <td className="px-4 py-3 text-center"><InvoiceStatus invoice={invoice} onChange={(nextStatus) => handleStatusChange(invoice, nextStatus)} /></td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center">
                          <InvoiceRowActions
                            onView={() => viewInvoice(invoice)}
                            onDownload={() => downloadInvoice(invoice)}
                            onEdit={() => setEditingInvoice(invoice)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex h-14 items-center justify-between px-6 border-t border-[#E1E4EA]">
              <p className="text-sm text-[#6b7280]">
                Showing <span className="font-semibold text-[#111827]">{paginated.length}</span> of{" "}
                <span className="font-semibold text-[#111827]">{sorted.length}</span> Invoices
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                      p === page
                        ? "bg-[#8D3118] text-white"
                        : "border border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-[#111827]">No invoices yet.</p>
            <p className="mt-1 text-sm text-[#6b7280]">Invoices should be generated from successful payments and stored as PDFs in Document Center.</p>
          </div>
        )}
      </section>

      {creating && <InvoiceModal companies={companies} projects={projects} contacts={contacts} packages={packages} onClose={() => setCreating(false)} onSave={handleCreate} />}
      {editingInvoice && (
        <EditInvoiceModal
          invoice={editingInvoice}
          packages={packages}
          onClose={() => setEditingInvoice(null)}
          onSave={(changes) => handleEditInvoice(editingInvoice, changes)}
        />
      )}
      </div>
    </div>
  );
}

function statusTone(value) {
  return value === "Paid"
    ? "bg-emerald-50 text-emerald-700"
    : value === "Overdue"
      ? "bg-red-50 text-red-600"
      : value === "Sent"
        ? "bg-blue-50 text-blue-700"
        : "bg-[#f3f4f6] text-[#6b7280]";
}

function InvoiceStatus({ invoice, onChange }) {
  const rawValue = invoice.status || invoice.paymentStatus || "";
  const value = isDraftLikeStatus(rawValue) ? normalizedStatus(rawValue, "Draft") : normalizedStatus(rawValue);
  if (!isDraftLikeStatus(rawValue)) {
    return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusTone(value)}`}>{value}</span>;
  }

  return <StatusSelect value={value} onChange={onChange} />;
}

function StatusSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`rounded-full border-0 px-2 py-1 text-xs font-semibold outline-none ring-1 ring-transparent transition focus:ring-[#8D3118]/30 ${statusTone(value)}`}
      aria-label="Invoice status"
    >
      {UNPAID_STATUS_ACTIONS.map((status) => (
        <option key={status} value={status}>{status}</option>
      ))}
    </select>
  );
}
