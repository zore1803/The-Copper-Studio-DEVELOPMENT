import { useEffect, useMemo, useRef, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "./ui";
import SidePanel from "./SidePanel";
import SearchableSelectField from "./SearchableSelect";
import { generateProjectCode, generateDefaultProjectName, PROJECT_TEMPLATES } from "../lib/projectDefaults";

const PROJECT_TEMPLATE_OPTIONS = Object.keys(PROJECT_TEMPLATES);
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];
const PAYMENT_STATUS_OPTIONS = ["Pending", "Partial", "Paid", "Overdue"];

function parseMoney(value) {
  return Number(String(value || "").replace(/[^\d.-]/g, "")) || 0;
}

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
}

function FormSection({ title, children }) {
  return (
    <div className="space-y-3 border-t border-[#f3f4f6] pt-5 first:border-t-0 first:pt-0">
      <h4 className="text-xs font-bold uppercase tracking-wide text-[#C55418]">{title}</h4>
      <div className="grid gap-4 sm:grid-cols-3">{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", disabled = false, span = false, hint, error }) {
  return (
    <label className={`block ${span ? "sm:col-span-3" : ""}`}>
      <span className="text-xs font-semibold text-[#374151]">{label}</span>
      <input
        type={type}
        value={value || ""}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.value)}
        aria-invalid={Boolean(error)}
        className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${
          error ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-[#e5e7eb] focus:border-[#C55418] focus:ring-[#C55418]/20"
        } ${disabled ? "bg-[#f9fafb] text-[#6b7280]" : ""}`}
      />
      {error
        ? <span className="mt-1 block text-[11px] font-semibold text-red-500">{error}</span>
        : hint
          ? <span className="mt-1 block text-[11px] text-[#9ca3af]">{hint}</span>
          : null}
    </label>
  );
}

function Textarea({ label, value, onChange, span = false }) {
  return (
    <label className={`block ${span ? "sm:col-span-3" : ""}`}>
      <span className="text-xs font-semibold text-[#374151]">{label}</span>
      <textarea
        value={value || ""}
        rows={3}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full resize-none rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#C55418] focus:ring-2 focus:ring-[#C55418]/20"
      />
    </label>
  );
}

function Select({ label, value, onChange, options = [], span = false, error, hint }) {
  const normalized = options.map((option) => (typeof option === "string" ? { value: option, label: option } : option));
  return (
    <label className={`block ${span ? "sm:col-span-3" : ""}`}>
      <span className="text-xs font-semibold text-[#374151]">{label}</span>
      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${
          error ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-[#e5e7eb] focus:border-[#C55418] focus:ring-[#C55418]/20"
        }`}
      >
        <option value="">Select…</option>
        {normalized.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {error
        ? <span className="mt-1 block text-[11px] font-semibold text-red-500">{error}</span>
        : hint
          ? <span className="mt-1 block text-[11px] text-[#9ca3af]">{hint}</span>
          : null}
    </label>
  );
}

/** Rich project creation form, shared between the company workspace and the global Projects page. */
export default function ProjectFormPanel({ company, companies = [], contacts = [], invoices = [], projects = [], preselectCompanyId = "", onCreateCompany, onClose, onSave }) {
  const [companyId, setCompanyId] = useState(() => String(company?.id || company?._id || preselectCompanyId || ""));
  const [form, setForm] = useState({
    name: "",
    projectManager: "",
    primaryContactId: "",
    packageName: "",
    customPackageName: "",
    startDate: "",
    expectedEndDate: "",
    priority: "Medium",
    status: "Requirement Gathering",
    template: "Custom",
    budget: "",
    discount: "",
    discountType: "amount", // "amount" (₹) or "percent" (%)
    linkedInvoiceId: "",
    paymentStatus: "Pending",
    internalNotes: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const nameTouched = useRef(false);
  const set = (key) => (value) => {
    if (key === "name") nameTouched.current = true;
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
  };
  // Discount can be entered as a flat rupee amount or as a percentage of the
  // package value; resolve it to the actual rupees taken off before computing
  // the final amount.
  const discountAmount = form.discountType === "percent"
    ? Math.round((parseMoney(form.budget) * Math.min(parseMoney(form.discount), 100)) / 100)
    : parseMoney(form.discount);
  const finalAmount = Math.max(parseMoney(form.budget) - discountAmount, 0);

  // Live package catalogue (name + price) so picking a package auto-fills the
  // package value, exactly like the manual-invoice form.
  const [livePackages, setLivePackages] = useState([]);
  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL || "";
    fetch(`${base}/api/packages`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLivePackages(Array.isArray(data) ? data : []))
      .catch(() => setLivePackages([]));
  }, []);
  const packageOptions = useMemo(
    () => [
      ...livePackages.map((p) => ({ value: p.name, label: `${p.name} — ${formatINR(p.price)}` })),
      { value: "Custom", label: "Custom" },
    ],
    [livePackages]
  );

  const resolvedCompany = useMemo(
    () => company || companies.find((c) => String(c.id || c._id) === companyId),
    [company, companies, companyId]
  );
  const projectCode = useMemo(
    () => (resolvedCompany ? generateProjectCode(resolvedCompany, projects) : ""),
    [resolvedCompany, projects]
  );
  useEffect(() => {
    if (!resolvedCompany || nameTouched.current) return;
    setForm((prev) => ({ ...prev, name: generateDefaultProjectName(resolvedCompany, projects) }));
  }, [resolvedCompany, projects]);
  // Contacts link to a company by id (companyId) or by name (company/companyName),
  // so match on both — matching only on companyId is why the list came up empty.
  // Before a company is picked we show every contact, so choosing a contact can
  // back-fill its company.
  const scopedContacts = useMemo(() => {
    if (company) return contacts;
    if (!companyId) return contacts;
    const cName = resolvedCompany?.name || resolvedCompany?.companyName || "";
    return contacts.filter((c) => {
      const cid = String(c.companyId || "");
      const linkName = c.company || c.companyName || "";
      return cid === companyId || (cName && linkName === cName);
    });
  }, [company, contacts, companyId, resolvedCompany]);
  const scopedInvoices = useMemo(
    () => (company ? invoices : invoices.filter((i) => String(i.companyId) === companyId)),
    [company, invoices, companyId]
  );

  // Resolve a contact's company to a company id, matching by id first then name.
  function contactCompanyId(contact) {
    if (!contact) return "";
    if (contact.companyId) {
      const byId = companies.find((c) => String(c.id || c._id) === String(contact.companyId));
      if (byId) return String(byId.id || byId._id);
    }
    const linkName = contact.company || contact.companyName || "";
    if (linkName) {
      const byName = companies.find((c) => (c.name || c.companyName) === linkName);
      if (byName) return String(byName.id || byName._id);
    }
    return contact.companyId ? String(contact.companyId) : "";
  }

  // Picking a package fills the package value; picking a contact back-fills its
  // company (kept editable) so the project, contact, and company all line up.
  function onPackageChange(val) {
    set("packageName")(val);
    if (PROJECT_TEMPLATE_OPTIONS.includes(val)) set("template")(val);
    const pkg = livePackages.find((p) => p.name === val);
    if (pkg) set("budget")(String(pkg.price));
  }
  function onContactChange(val) {
    set("primaryContactId")(val);
    if (company) return; // company is fixed on the company-scoped page
    const contact = contacts.find((c) => String(c.id || c._id) === String(val));
    const cid = contactCompanyId(contact);
    if (cid) {
      setCompanyId(cid);
      setErrors((prev) => (prev.company ? { ...prev, company: "" } : prev));
    }
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = "Project name is required.";
    if (!resolvedCompany) next.company = "Select a company.";
    if (form.packageName === "Custom" && !form.customPackageName.trim()) next.customPackageName = "Name the custom package.";
    if (form.startDate && form.expectedEndDate && new Date(form.expectedEndDate) < new Date(form.startDate)) {
      next.expectedEndDate = "Completion date can't be before the start date.";
    }
    if (parseMoney(form.budget) < 0) next.budget = "Value can't be negative.";
    if (form.discountType === "percent") {
      if (parseMoney(form.discount) > 100) next.discount = "Percentage can't exceed 100%.";
    } else if (parseMoney(form.discount) > parseMoney(form.budget)) {
      next.discount = "Discount can't exceed the package value.";
    }
    return next;
  }

  async function handleSave() {
    if (saving) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || !resolvedCompany) return;
    const contact = scopedContacts.find((c) => String(c.id || c._id) === form.primaryContactId);
    setSaving(true);
    try {
      await onSave(resolvedCompany, {
        ...form,
        projectCode,
        packageName: form.packageName === "Custom" ? (form.customPackageName || "Custom") : form.packageName,
        primaryContact: contact ? (contact.name || `${contact.firstName || ""} ${contact.lastName || ""}`.trim()) : "",
        // Persist the resolved rupee discount (not the raw %) so finance reads a real amount.
        discount: discountAmount,
        finalAmount,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SidePanel
      title="New Project"
      subtitle={company ? `Link this project to ${company.name}.` : "Create a project linked to an existing company."}
      width="max-w-2xl"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}><Save size={14} /> {saving ? "Creating…" : "Create Project"}</Button>
        </div>
      }
    >
      <div className="space-y-6">
        <FormSection title="Basic Information">
          <Input span label="Project name *" value={form.name} onChange={set("name")} error={errors.name}
            hint={!errors.name ? "Auto-filled from company name, project #, and month/year — edit freely." : undefined} />
          <Input label="Project ID" value={projectCode} disabled hint={resolvedCompany ? "Auto-generated from company" : "Select a company to generate"} />
          {company ? (
            <Input label="Company" value={company.name} disabled />
          ) : (
            <div className="block">
              <SearchableSelectField label="Company *" value={companyId}
                onChange={(value) => { setCompanyId(value); setErrors((prev) => (prev.company ? { ...prev, company: "" } : prev)); }}
                error={errors.company} placeholder="Search companies…"
                options={companies.map((c) => ({ value: String(c.id || c._id), label: c.name || c.companyName }))} />
              {onCreateCompany && (
                <button type="button" onClick={onCreateCompany}
                  className="mt-1 text-[11px] font-semibold text-[#C55418] hover:underline">
                  + New company
                </button>
              )}
            </div>
          )}
          <SearchableSelectField label="Primary contact" value={form.primaryContactId} onChange={onContactChange}
            placeholder="Search contacts…"
            hint={!company && !companyId ? "Pick a contact to auto-fill its company." : undefined}
            options={scopedContacts.map((c) => ({ value: String(c.id || c._id), label: c.name || `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email }))} />
          <SearchableSelectField span label="Project manager" value={form.projectManager} onChange={set("projectManager")}
            placeholder="Search team…"
            options={scopedContacts.map((c) => ({ value: c.name || `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email, label: c.name || `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email }))} />
          <Select
            label="Package purchased"
            value={form.packageName}
            onChange={onPackageChange}
            options={packageOptions}
            hint="Selecting a package auto-fills the package value below."
          />
          {form.packageName === "Custom" && (
            <Input label="Custom package name" value={form.customPackageName} onChange={set("customPackageName")} error={errors.customPackageName} />
          )}
        </FormSection>

        <FormSection title="Timeline">
          <Input type="date" label="Project start date" value={form.startDate} onChange={set("startDate")} />
          <Input type="date" label="Expected completion date" value={form.expectedEndDate} onChange={set("expectedEndDate")} error={errors.expectedEndDate} />
          <Select label="Priority" value={form.priority} onChange={set("priority")} options={PRIORITY_OPTIONS} />
        </FormSection>

        <FormSection title="Delivery Pipeline">
          <Select label="Project template" value={form.template} onChange={set("template")} options={PROJECT_TEMPLATE_OPTIONS}
            hint="Generates the editable project-stage roadmap" />
        </FormSection>

        <FormSection title="Commercials">
          <Input type="number" label="Package value" value={form.budget} onChange={set("budget")} error={errors.budget} />
          <label className="block">
            <span className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#374151]">Discount applied</span>
              <span className="inline-flex overflow-hidden rounded-md border border-[#e5e7eb] text-[11px] font-semibold">
                {["amount", "percent"].map((mode) => (
                  <button key={mode} type="button" onClick={() => set("discountType")(mode)}
                    className={`px-2 py-0.5 ${form.discountType === mode ? "bg-[#C55418] text-white" : "bg-white text-[#6b7280]"}`}>
                    {mode === "amount" ? "₹" : "%"}
                  </button>
                ))}
              </span>
            </span>
            <input type="number" value={form.discount || ""} onChange={(e) => set("discount")(e.target.value)}
              aria-invalid={Boolean(errors.discount)}
              className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${
                errors.discount ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-[#e5e7eb] focus:border-[#C55418] focus:ring-[#C55418]/20"
              }`} />
            {errors.discount
              ? <span className="mt-1 block text-[11px] font-semibold text-red-500">{errors.discount}</span>
              : form.discountType === "percent" && discountAmount > 0
                ? <span className="mt-1 block text-[11px] text-[#9ca3af]">= {formatINR(discountAmount)} off</span>
                : null}
          </label>
          <Input label="Final amount" value={formatINR(finalAmount)} disabled />
          <SearchableSelectField label="Invoice linked" value={form.linkedInvoiceId} onChange={set("linkedInvoiceId")}
            options={scopedInvoices.map((i) => ({ value: String(i.id || i._id), label: i.invoiceId || i.id || i._id }))} placeholder="Search invoices…" />
          <Select label="Payment status" value={form.paymentStatus} onChange={set("paymentStatus")} options={PAYMENT_STATUS_OPTIONS} />
        </FormSection>

        <FormSection title="Internal">
          <Textarea span label="Internal notes" value={form.internalNotes} onChange={set("internalNotes")} />
        </FormSection>
      </div>
    </SidePanel>
  );
}
