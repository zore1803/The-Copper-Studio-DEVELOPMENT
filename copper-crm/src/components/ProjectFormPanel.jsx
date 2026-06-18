import { useMemo, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "./ui";
import SidePanel from "./SidePanel";

const PROJECT_STATUS = ["Pending", "Confirmed", "Requirement Gathering", "Design", "Development", "Testing", "Review", "Deployment", "Completed", "Cancelled", "On Hold"];
const PACKAGE_OPTIONS = ["Starter", "Growth", "Enterprise", "Custom"];
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
      <h4 className="text-xs font-bold uppercase tracking-wide text-[#884c2d]">{title}</h4>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", disabled = false, span = false, hint }) {
  return (
    <label className={`block ${span ? "sm:col-span-2" : ""}`}>
      <span className="text-xs font-semibold text-[#374151]">{label}</span>
      <input
        type={type}
        value={value || ""}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.value)}
        className={`mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20 ${disabled ? "bg-[#f9fafb] text-[#6b7280]" : ""}`}
      />
      {hint && <span className="mt-1 block text-[11px] text-[#9ca3af]">{hint}</span>}
    </label>
  );
}

function Textarea({ label, value, onChange, span = false }) {
  return (
    <label className={`block ${span ? "sm:col-span-2" : ""}`}>
      <span className="text-xs font-semibold text-[#374151]">{label}</span>
      <textarea
        value={value || ""}
        rows={3}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full resize-none rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20"
      />
    </label>
  );
}

function Select({ label, value, onChange, options = [], span = false }) {
  const normalized = options.map((option) => (typeof option === "string" ? { value: option, label: option } : option));
  return (
    <label className={`block ${span ? "sm:col-span-2" : ""}`}>
      <span className="text-xs font-semibold text-[#374151]">{label}</span>
      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20"
      >
        <option value="">Select…</option>
        {normalized.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

/** Rich project creation form, shared between the company workspace and the global Projects page. */
export default function ProjectFormPanel({ company, companies = [], contacts = [], invoices = [], onClose, onSave }) {
  const [projectCode] = useState(() => `PRJ-${Date.now().toString(36).toUpperCase()}`);
  const [companyId, setCompanyId] = useState(() => String(company?.id || company?._id || ""));
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
    budget: "",
    discount: "",
    linkedInvoiceId: "",
    paymentStatus: "Pending",
    internalNotes: "",
    assignedTeam: "",
    tags: "",
  });
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  const finalAmount = Math.max(parseMoney(form.budget) - parseMoney(form.discount), 0);

  const resolvedCompany = useMemo(
    () => company || companies.find((c) => String(c.id || c._id) === companyId),
    [company, companies, companyId]
  );
  const scopedContacts = useMemo(
    () => (company ? contacts : contacts.filter((c) => String(c.companyId) === companyId)),
    [company, contacts, companyId]
  );
  const scopedInvoices = useMemo(
    () => (company ? invoices : invoices.filter((i) => String(i.companyId) === companyId)),
    [company, invoices, companyId]
  );

  function handleSave() {
    if (!resolvedCompany) return;
    const contact = scopedContacts.find((c) => String(c.id || c._id) === form.primaryContactId);
    onSave(resolvedCompany, {
      ...form,
      projectCode,
      packageName: form.packageName === "Custom" ? (form.customPackageName || "Custom") : form.packageName,
      primaryContact: contact ? (contact.name || `${contact.firstName || ""} ${contact.lastName || ""}`.trim()) : "",
      finalAmount,
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      assignedTeam: form.assignedTeam.split(",").map((name) => name.trim()).filter(Boolean),
    });
  }

  return (
    <SidePanel
      title="New Project"
      subtitle={company ? `Link this project to ${company.name}.` : "Create a project linked to an existing company."}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!resolvedCompany || !form.name.trim()}><Save size={14} /> Create Project</Button>
        </div>
      }
    >
      <div className="space-y-6">
        <FormSection title="Basic Information">
          <Input span label="Project name *" value={form.name} onChange={set("name")} />
          <Input label="Project ID" value={projectCode} disabled />
          {company ? (
            <Input label="Company" value={company.name} disabled />
          ) : (
            <Select label="Company *" value={companyId} onChange={setCompanyId}
              options={companies.map((c) => ({ value: String(c.id || c._id), label: c.name }))} />
          )}
          <Select label="Primary contact" value={form.primaryContactId} onChange={set("primaryContactId")}
            options={scopedContacts.map((c) => ({ value: String(c.id || c._id), label: c.name || `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email }))} />
          <Input span label="Project manager" value={form.projectManager} onChange={set("projectManager")} />
          <Select label="Package purchased" value={form.packageName} onChange={set("packageName")} options={PACKAGE_OPTIONS} />
          {form.packageName === "Custom" && (
            <Input label="Custom package name" value={form.customPackageName} onChange={set("customPackageName")} />
          )}
        </FormSection>

        <FormSection title="Timeline">
          <Input type="date" label="Project start date" value={form.startDate} onChange={set("startDate")} />
          <Input type="date" label="Expected completion date" value={form.expectedEndDate} onChange={set("expectedEndDate")} />
          <Select label="Priority" value={form.priority} onChange={set("priority")} options={PRIORITY_OPTIONS} />
        </FormSection>

        <FormSection title="Delivery Pipeline">
          <Select span label="Delivery stage" value={form.status} onChange={set("status")} options={PROJECT_STATUS} />
        </FormSection>

        <FormSection title="Commercials">
          <Input type="number" label="Package value" value={form.budget} onChange={set("budget")} />
          <Input type="number" label="Discount applied" value={form.discount} onChange={set("discount")} />
          <Input label="Final amount" value={formatINR(finalAmount)} disabled />
          <Select label="Invoice linked" value={form.linkedInvoiceId} onChange={set("linkedInvoiceId")}
            options={scopedInvoices.map((i) => ({ value: String(i.id || i._id), label: i.invoiceId || i.id || i._id }))} />
          <Select label="Payment status" value={form.paymentStatus} onChange={set("paymentStatus")} options={PAYMENT_STATUS_OPTIONS} />
        </FormSection>

        <FormSection title="Internal">
          <Input span label="Assigned team (comma separated)" value={form.assignedTeam} onChange={set("assignedTeam")} />
          <Input span label="Tags (comma separated)" value={form.tags} onChange={set("tags")} />
          <Textarea span label="Internal notes" value={form.internalNotes} onChange={set("internalNotes")} />
        </FormSection>
      </div>
    </SidePanel>
  );
}
