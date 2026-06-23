import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Building2, ChevronLeft, ChevronRight, Download, Eye, Filter, FolderPlus,
  Folder as FolderIcon, Globe, Grid2x2, List, MoreVertical, Plus, Save, Search,
  SlidersHorizontal, X
} from "lucide-react";
import { Button } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import SidePanel from "../../components/SidePanel";
import { isGstin } from "../../lib/validators";

const PAGE_SIZE = 10;
const DEFAULT_FOLDERS = ["Key Accounts", "New Prospects", "Renewals Due", "High Value"];

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

function CompanyRow({ company, onEdit, onDelete, onClick, onOpen }) {
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
            className="h-8 w-8 flex items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#374151] transition-colors"
          >
            <MoreVertical size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-[#e5e7eb] bg-white shadow-lg py-1">
              <button
                onClick={() => { setMenuOpen(false); onOpen(company); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#374151] hover:bg-[#f9fafb]"
              >
                <Eye size={14} /> Open workspace
              </button>
              <button
                onClick={() => { setMenuOpen(false); onEdit(company); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#374151] hover:bg-[#f9fafb]"
              >
                Edit company
              </button>
              <button
                onClick={() => { setMenuOpen(false); window.dispatchEvent(new CustomEvent("cs-open-document-center", { detail: { companyId: company.id || company._id } })); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#374151] hover:bg-[#f9fafb]"
              >
                Move to folder
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

function FolderCard({ folder, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
        active ? "border-[#C57E5B] bg-[#fff8f6]" : "border-[#E1E4EA] bg-white hover:bg-[#fafafa]"
      }`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${active ? "border-[#C57E5B] text-[#C57E5B]" : "border-[#E1E4EA] text-[#525866]"}`}>
        <FolderIcon size={18} />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#0E121B]">{folder}</p>
        <p className="text-xs text-[#525866] mt-0.5">{count} companies</p>
      </div>
    </button>
  );
}

export default function Companies() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(() => (location.state?.openCreate
    ? { name: "", gstin: "", industry: "", contact: "", projects: 0, status: "Prospect", address: "", website: "", leadSource: "", notes: "" }
    : null));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [industryFilter, setIndustryFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [view, setView] = useState("table");
  const [folders, setFolders] = useState(DEFAULT_FOLDERS);
  const [folderSearch, setFolderSearch] = useState("");
  const [activeFolder, setActiveFolder] = useState(null);
  const { records: companies, save, remove, loading } = useCrmRecords("companies");
  const { showToast } = useToast();

  useEffect(() => {
    if (location.state?.openCreate) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const industries = useMemo(() => ["All", ...Array.from(new Set(companies.map((company) => company.industry).filter(Boolean)))], [companies]);
  const filtered = useMemo(() =>
    companies.filter((c) => {
      const matchesSearch = `${c.name} ${c.industry} ${c.contact} ${c.status} ${c.gstin} ${c.leadSource}`.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || c.status === statusFilter || (statusFilter === "Accepted" && c.status === "Active") || (statusFilter === "Pending" && c.status === "Prospect");
      const matchesIndustry = industryFilter === "All" || c.industry === industryFilter;
      return matchesSearch && matchesStatus && matchesIndustry;
    }), [companies, industryFilter, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const visibleFolders = useMemo(
    () => folders.filter((f) => f.toLowerCase().includes(folderSearch.toLowerCase())),
    [folders, folderSearch]
  );

  function folderCount(index) {
    if (companies.length === 0 || folders.length === 0) return 0;
    return companies.filter((_, i) => i % folders.length === index).length;
  }

  function addFolder() {
    const name = window.prompt("New folder name");
    if (name && name.trim()) setFolders((prev) => [...prev, name.trim()]);
  }

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

  function openCompany(company) {
    navigate(`/admin/companies/${company.id || company._id}`);
  }

  function exportCompanies() {
    const headers = ["Company Name", "Industry", "GSTIN", "Status", "Lead Source", "Website"];
    const rows = filtered.map((company) => [company.name, company.industry, company.gstin, company.status, company.leadSource, company.website]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "companies.csv";
    link.click();
    URL.revokeObjectURL(url);
    setActionsOpen(false);
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Sub-header */}
      <div className="flex flex-col gap-4 border-b border-[#E1E4EA] px-6 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-base font-medium text-[#0E121B]">Companies</h1>
          <p className="text-xs text-[#525866] mt-0.5">Manage your organisation contracts</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="flex h-11 w-full items-center gap-2 rounded-full border border-[#1F2937]/10 px-3.5 sm:w-72">
            <Search size={16} className="text-[#1F2937]/50 shrink-0" />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#1F2937]/50"
              placeholder="Search by name, industry, or status…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="relative">
            <button onClick={() => setActionsOpen((value) => !value)} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E1E4EA] bg-white text-[#1F2937] hover:bg-[#f9fafb] transition-colors">
              <MoreVertical size={16} />
            </button>
            {actionsOpen && (
              <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-[#e5e7eb] bg-white p-1 shadow-lg">
                <button onClick={exportCompanies} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#374151] hover:bg-[#f9fafb]">
                  <Download size={14} /> Export filtered CSV
                </button>
                <button onClick={() => { setSearch(""); setStatusFilter("All"); setIndustryFilter("All"); setActionsOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#374151] hover:bg-[#f9fafb]">
                  <X size={14} /> Clear filters
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setFiltersOpen((value) => !value)}
            className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${filtersOpen ? "border-[#884c2d] bg-[#fff8f6] text-[#884c2d]" : "border-[#E1E4EA] bg-white text-[#1F2937] hover:bg-[#f9fafb]"}`}
          >
            <Filter size={16} />
          </button>
          {/* View toggle */}
          <button
            onClick={() => setView((v) => (v === "table" ? "hotlist" : "table"))}
            className={`flex items-center gap-1.5 rounded-full p-1 transition-colors ${view === "hotlist" ? "bg-[#0085FF]/20" : "bg-[#F1F1F5]"}`}
          >
            <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-sm font-medium shadow-[0_0_6px_rgba(0,0,0,0.1)]">
              <Grid2x2 size={16} className={view === "hotlist" ? "text-[#C57E5B]" : "text-[#1F2937]"} />
              <span className={view === "hotlist" ? "text-[#C57E5B]" : "text-[#1F2937]"}>Hotlist</span>
            </span>
          </button>
          <button
            onClick={() => setEditing({ name: "", gstin: "", industry: "", contact: "", projects: 0, status: "Prospect", address: "", website: "", leadSource: "", notes: "" })}
            className="flex h-11 items-center gap-1.5 rounded-full bg-[#C57E5B] px-4 text-sm font-medium text-white hover:bg-[#b06a48] transition-colors shadow-sm"
          >
            <Plus size={16} />
            Add Company
          </button>
        </div>
      </div>

      {filtersOpen && (
        <div className="mx-6 mt-4 grid gap-3 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-4 sm:grid-cols-3">
          <label className="block">
            <span className="text-xs font-semibold text-[#6b7280]">Document / Status</span>
            <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#884c2d]">
              {["All", "Accepted", "Pending", "Rejected", "Active", "Prospect"].map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[#6b7280]">Industry</span>
            <select value={industryFilter} onChange={(event) => { setIndustryFilter(event.target.value); setPage(1); }} className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#884c2d]">
              {industries.map((industry) => <option key={industry}>{industry}</option>)}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <Button variant="secondary" onClick={() => { setSearch(""); setStatusFilter("All"); setIndustryFilter("All"); setPage(1); }}><X size={14} /> Reset</Button>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-auto bg-[#F1F1F5] p-6">
        {view === "table" ? (
          <div className="overflow-hidden rounded-xl border border-[#E1E4EA] bg-white shadow-[0_4px_4px_rgba(0,0,0,0.05)]">
            <div className="overflow-auto">
              <table className="min-w-full">
                <thead className="bg-[#F5F7FA] border-b border-[#E1E4EA]">
                  <tr>
                    <th className="px-3 py-3 w-12">
                      <input type="checkbox" className="rounded border-[#d1d5db] accent-[#884c2d]" />
                    </th>
                    <th className="px-3 py-3 text-left">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[#525866]">
                        <Building2 size={13} />
                        Company Name
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[#525866]">
                        <SlidersHorizontal size={13} />
                        Industry
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[#525866]">
                        Location
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[#525866]">
                        <Globe size={13} />
                        Website
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[#525866]">
                        GSTIN
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[#525866]">
                        Document Signed
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[#525866]">
                        Lead Source
                      </div>
                    </th>
                    <th className="px-3 py-3 w-10" />
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
                      onOpen={openCompany}
                      onClick={() => openCompany(company)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#E1E4EA]">
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
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Company Hotlists panel */}
            <div className="flex flex-col gap-4 rounded-lg border border-[#E1E4EA] bg-white p-6 shadow-[0_4px_4px_rgba(0,0,0,0.05)] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-medium text-[#0E121B]">Company Hotlists</p>
                <p className="text-xs text-[#525866] mt-0.5">Organise your companies into custom folders</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-[42px] w-full items-center gap-2 rounded-full border border-[#1F2937]/10 px-3.5 sm:w-72">
                  <Search size={15} className="text-[#1F2937]/50 shrink-0" />
                  <input
                    className="w-full bg-transparent text-xs outline-none placeholder:text-[#1F2937]/50"
                    placeholder="Search by companies by name, industry, or location…"
                    value={folderSearch}
                    onChange={(e) => setFolderSearch(e.target.value)}
                  />
                </div>
                <button
                  onClick={addFolder}
                  className="flex h-[42px] items-center gap-1.5 whitespace-nowrap rounded-full bg-[#C57E5B] px-3.5 text-xs font-medium text-white hover:bg-[#b06a48] transition-colors"
                >
                  <FolderPlus size={15} />
                  New Folder
                </button>
              </div>
            </div>

            {/* Density / count row */}
            <div className="flex items-center justify-between px-1">
              <p className="text-sm text-[#525866]">{visibleFolders.length} folders</p>
              <div className="flex items-center gap-1.5">
                <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#EAECF0] text-[#525866] hover:bg-[#f9fafb] transition-colors">
                  <List size={16} className="opacity-50" />
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C57E5B] text-white">
                  1
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#EAECF0] text-[#525866] hover:bg-[#f9fafb] transition-colors">
                  2
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#EAECF0] text-[#525866] hover:bg-[#f9fafb] transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Folder grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {visibleFolders.map((folder) => (
                <FolderCard
                  key={folder}
                  folder={folder}
                  count={folderCount(folders.indexOf(folder))}
                  active={activeFolder === folder}
                  onClick={() => setActiveFolder((f) => (f === folder ? null : folder))}
                />
              ))}
              {visibleFolders.length === 0 && (
                <p className="col-span-full text-center text-sm text-[#6b7280] py-12">No folders found.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {editing && <CompanyModal company={editing} onClose={() => setEditing(null)} onSave={saveCompany} />}
    </div>
  );
}

function CompanyModal({ company, onClose, onSave }) {
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
    setErrors(next);
    if (Object.keys(next).length) return;
    onSave({ ...form, gstin: form.gstin ? String(form.gstin).toUpperCase() : form.gstin });
  }

  return (
    <SidePanel
      title={company._id || company.id ? "Edit Company" : "Add Company"}
      subtitle="Update company profile, GSTIN, contact, and project details."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}><Save size={14} /> Save Company</Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company name" value={form.name} onChange={set("name")} error={errors.name} />
        <Field label="GSTIN number" value={form.gstin} onChange={set("gstin")} placeholder="27ABCDE1234F1Z5" error={errors.gstin} />
        <Field label="Industry" value={form.industry} onChange={set("industry")} />
        <Field label="Primary contact" value={form.contact} onChange={set("contact")} />
        <Field label="Projects" type="number" value={form.projects} onChange={set("projects")} />
        <Field label="Status" value={form.status} onChange={set("status")} />
        <Field label="Website" value={form.website} onChange={set("website")} error={errors.website} />
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
