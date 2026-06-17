import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, ChevronLeft, ChevronRight, Filter,
  Globe, MoreVertical, Plus, Save, Search, SlidersHorizontal
} from "lucide-react";
import { Button } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import SidePanel from "../../components/SidePanel";

const PAGE_SIZE = 10;

function Field({ label, value, onChange, placeholder = "", type = "text" }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[#374151]">{label}</span>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20 transition-all"
      />
    </label>
  );
}

function DocSignedBadge({ status }) {
  const map = {
    Accepted: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    Pending: "bg-amber-50 text-amber-700 border border-amber-100",
    Rejected: "bg-red-50 text-red-600 border border-red-100",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${map[status] || "bg-[#f3f4f6] text-[#6b7280] border border-[#e5e7eb]"}`}>
      {status || "—"}
    </span>
  );
}

function CompanyRow({ company, onEdit, onDelete, onClick }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <tr
      className="border-b border-[#f3f4f6] hover:bg-[#fafafa] cursor-pointer transition-colors group"
      onClick={onClick}
    >
      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" className="rounded border-[#d1d5db] accent-[#884c2d]" />
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 shrink-0 rounded-full bg-[#f3f4f6] border border-[#e5e7eb] flex items-center justify-center">
            <Building2 size={14} className="text-[#9ca3af]" />
          </div>
          <span className="text-sm font-semibold text-[#111827]">{company.name}</span>
        </div>
      </td>
      <td className="px-4 py-3.5 text-sm text-[#374151]">{company.industry || "—"}</td>
      <td className="px-4 py-3.5 text-sm text-[#374151] max-w-[140px] truncate">
        {company.address ? company.address.slice(0, 22) + (company.address.length > 22 ? "…" : "") : "—"}
      </td>
      <td className="px-4 py-3.5">
        {company.website ? (
          <a
            href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
            onClick={(e) => e.stopPropagation()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-[#884c2d] hover:underline"
          >
            <Globe size={12} />
            {company.website.replace(/^https?:\/\//, "").slice(0, 22)}…
          </a>
        ) : "—"}
      </td>
      <td className="px-4 py-3.5 text-sm font-mono text-[#6b7280]">{company.gstin || "—"}</td>
      <td className="px-4 py-3.5">
        <DocSignedBadge status={company.status === "Active" ? "Accepted" : company.status === "Prospect" ? "Pending" : company.status} />
      </td>
      <td className="px-4 py-3.5 text-sm text-[#374151]">{company.leadSource || "—"}</td>
      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#374151] transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-10 mt-1 w-36 rounded-xl border border-[#e5e7eb] bg-white shadow-lg py-1">
              <button
                onClick={() => { setMenuOpen(false); onEdit(company); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#374151] hover:bg-[#f9fafb]"
              >
                Edit
              </button>
              <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#374151] hover:bg-[#f9fafb]">
                Move to Folder
              </button>
              <button
                onClick={() => { setMenuOpen(false); onDelete(company); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function Companies() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);
  const { records: companies, save, remove, loading } = useCrmRecords("companies");
  const { showToast } = useToast();

  const filtered = useMemo(() =>
    companies.filter((c) =>
      `${c.name} ${c.industry} ${c.contact} ${c.status}`.toLowerCase().includes(search.toLowerCase())
    ), [companies, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function saveCompany(company) {
    try {
      const isNew = !company._id;
      await save({ ...company, id: company.id || `company-${Date.now()}`, projects: Number(company.projects) || 0 });
      setEditing(null);
      showToast({ title: isNew ? "Company created" : "Company updated", message: `${company.name || "Company"} saved.` });
    } catch (err) {
      showToast({ type: "error", title: "Could not save company", message: err.message });
    }
  }

  async function deleteCompany(company) {
    await remove(company);
    showToast({ title: "Company deleted", message: `${company.name || "Company"} removed.` });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-6 py-5 bg-white border-b border-[#e5e7eb]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#111827]">Companies</h1>
            <p className="text-sm text-[#6b7280] mt-0.5">Manage your organisation contracts</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="flex h-9 w-full items-center gap-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 focus-within:border-[#884c2d] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#884c2d]/20 transition-all sm:w-80">
              <Search size={13} className="text-[#9ca3af] shrink-0" />
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#9ca3af]"
                placeholder="Search name, industry, contact, or status"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-[#f9fafb] transition-colors">
              <MoreVertical size={15} />
            </button>
            <button className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors">
              <Filter size={14} />
              Filters
            </button>
            <button
                onClick={() => setEditing({ name: "", gstin: "", industry: "", contact: "", projects: 0, status: "Prospect", address: "", website: "", leadSource: "", notes: "" })}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-[#884c2d] px-3 text-sm font-semibold text-white hover:bg-[#6f381a] transition-colors shadow-sm"
            >
              <Plus size={14} />
              Add Company
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="min-w-full">
          <thead className="sticky top-0 bg-white border-b border-[#e5e7eb] z-10">
            <tr>
              <th className="px-4 py-3 w-10">
                <input type="checkbox" className="rounded border-[#d1d5db] accent-[#884c2d]" />
              </th>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                  <Building2 size={12} />
                  Company Name
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                  <SlidersHorizontal size={12} />
                  Industry
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                  Location
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                  <Globe size={12} />
                  Website
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                  GSTIN
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                  Document Signed
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                  Lead Source
                </div>
              </th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="bg-white">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-[#6b7280]">Loading companies…</td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-[#6b7280]">No companies found.</td>
              </tr>
            ) : paginated.map((company) => (
              <CompanyRow
                key={company._id || company.id}
                company={company}
                onEdit={setEditing}
                onDelete={deleteCompany}
                onClick={() => navigate(`/admin/companies/${company.id || company._id}`)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-white border-t border-[#e5e7eb]">
        <p className="text-sm text-[#6b7280]">
          Showing <span className="font-semibold text-[#111827]">{Math.min(paginated.length, PAGE_SIZE)}</span> of{" "}
          <span className="font-semibold text-[#111827]">{filtered.length}</span> Companies
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                p === page
                  ? "bg-[#884c2d] text-white"
                  : "border border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb]"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {editing && <CompanyModal company={editing} onClose={() => setEditing(null)} onSave={saveCompany} />}
    </div>
  );
}

function CompanyModal({ company, onClose, onSave }) {
  const [form, setForm] = useState(company);
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  return (
    <SidePanel
      title={company._id || company.id ? "Edit Company" : "Add Company"}
      subtitle="Update company profile, GSTIN, contact, and project details."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}><Save size={14} /> Save Company</Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company name" value={form.name} onChange={set("name")} />
        <Field label="GSTIN number" value={form.gstin} onChange={set("gstin")} placeholder="27ABCDE1234F1Z5" />
        <Field label="Industry" value={form.industry} onChange={set("industry")} />
        <Field label="Primary contact" value={form.contact} onChange={set("contact")} />
        <Field label="Projects" type="number" value={form.projects} onChange={set("projects")} />
        <Field label="Status" value={form.status} onChange={set("status")} />
        <Field label="Website" value={form.website} onChange={set("website")} />
        <Field label="Address" value={form.address} onChange={set("address")} />
        <Field label="Lead source" value={form.leadSource} onChange={set("leadSource")} />
        <label className="block sm:col-span-2">
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
  async function deleteCompany(company) {
    await remove(company);
    showToast({ title: "Company deleted", message: `${company.name || "Company"} removed.` });
  }
