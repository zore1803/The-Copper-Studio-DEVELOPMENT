import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "./ui";
import SidePanel from "./SidePanel";
import { isGstin } from "../lib/validators";

const SOCIAL_DOMAINS = {
  linkedin: { domains: ["linkedin.com", "lnkd.in"], label: "a linkedin.com" },
  instagram: { domains: ["instagram.com"], label: "an instagram.com" },
  facebook: { domains: ["facebook.com", "fb.com"], label: "a facebook.com" },
  twitter: { domains: ["twitter.com", "x.com"], label: "a twitter.com / x.com" },
};

// Checks the URL's hostname against the platform's known domains, so a
// LinkedIn link pasted into the Instagram field (or vice versa) gets caught
// at save time instead of silently pointing the icon button at the wrong site.
function matchesSocialDomain(value, key) {
  const rule = SOCIAL_DOMAINS[key];
  if (!rule) return true;
  const trimmed = String(value || "").trim();
  if (!trimmed) return true;
  try {
    const url = new URL(/^[a-z]+:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return rule.domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

const EMPLOYEE_RANGES = ["1–10", "11–50", "51–200", "201–500", "501–1000", "1001–5000", "5000+"];

function Field({ label, value, onChange, placeholder = "", type = "text", error = "" }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[#374151]">{label}</span>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all focus:ring-2 ${
          error ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-[#e5e7eb] focus:border-[#884c2d] focus:ring-[#884c2d]/20"
        }`}
      />
      {error && <span className="mt-1 block text-[11px] font-semibold text-red-500">{error}</span>}
    </label>
  );
}

function SelectField({ label, value, onChange, options, placeholder = "Select…" }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[#374151]">{label}</span>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none transition-all focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20 bg-white"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

export default function CompanyFormPanel({ company, onClose, onSave }) {
  const [form, setForm] = useState(company);
  const [errors, setErrors] = useState({});
  const set = (key) => (value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
  };

  function handleSubmit() {
    const next = {};
    if (!String(form.name || "").trim()) next.name = "Company name is required.";
    if (form.gstin && !isGstin(form.gstin)) next.gstin = "Enter a valid 15-character GSTIN.";
    if (form.website && !/^([a-z]+:\/\/)?[^\s.]+\.[^\s]{2,}$/i.test(String(form.website).trim())) next.website = "Enter a valid website URL.";
    for (const key of Object.keys(SOCIAL_DOMAINS)) {
      if (form[key] && !matchesSocialDomain(form[key], key)) {
        next[key] = `Enter ${SOCIAL_DOMAINS[key].label} link.`;
      }
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    onSave({ ...form, gstin: form.gstin ? String(form.gstin).toUpperCase() : form.gstin });
  }

  return (
    <SidePanel
      title={company._id || company.id ? "Edit Company" : "Add Company"}
      subtitle="Update company profile, GSTIN, contact, and project details."
      width="max-w-2xl"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}><Save size={14} /> Save Company</Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Company name" value={form.name} onChange={set("name")} error={errors.name} />
        <Field label="GSTIN number" value={form.gstin} onChange={set("gstin")} placeholder="27ABCDE1234F1Z5" error={errors.gstin} />
        <Field label="Industry" value={form.industry} onChange={set("industry")} />
        <SelectField label="Employees" value={form.employees} onChange={set("employees")} options={EMPLOYEE_RANGES} placeholder="Select range…" />
        <Field label="Primary contact" value={form.contact} onChange={set("contact")} />
        <Field label="Projects" type="number" value={form.projects} onChange={set("projects")} />
        <Field label="Status" value={form.status} onChange={set("status")} />
        <Field label="Website" value={form.website} onChange={set("website")} error={errors.website} />
        <Field label="Address" value={form.address} onChange={set("address")} />
        <Field label="City" value={form.city} onChange={set("city")} />
        <Field label="State" value={form.state} onChange={set("state")} />
        <Field label="Pincode" value={form.pincode} onChange={set("pincode")} placeholder="e.g. 400001" />
        <Field label="Company owner" value={form.owner} onChange={set("owner")} placeholder="Account owner" />
        <Field label="Lead source" value={form.leadSource} onChange={set("leadSource")} />
        <div className="sm:col-span-3 mt-1 border-t border-[#f1f1f5] pt-3">
          <span className="text-xs font-bold uppercase tracking-wide text-[#9ca3af]">Social profiles</span>
        </div>
        <Field label="LinkedIn" value={form.linkedin} onChange={set("linkedin")} placeholder="https://linkedin.com/company/…" error={errors.linkedin} />
        <Field label="Instagram" value={form.instagram} onChange={set("instagram")} placeholder="https://instagram.com/…" error={errors.instagram} />
        <Field label="Facebook" value={form.facebook} onChange={set("facebook")} placeholder="https://facebook.com/…" error={errors.facebook} />
        <Field label="X (Twitter)" value={form.twitter} onChange={set("twitter")} placeholder="https://x.com/…" error={errors.twitter} />
        <Field label="Personal website" value={form.personalWebsite} onChange={set("personalWebsite")} placeholder="https://…" />
        <label className="block sm:col-span-3">
          <span className="text-xs font-semibold text-[#374151]">Notes</span>
          <textarea
            value={form.notes || ""}
            onChange={(e) => set("notes")(e.target.value)}
            className="mt-1.5 min-h-24 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20 transition-all"
          />
        </label>
      </div>
    </SidePanel>
  );
}
