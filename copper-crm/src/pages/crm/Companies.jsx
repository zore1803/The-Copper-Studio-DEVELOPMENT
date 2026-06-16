import { useMemo, useState } from "react";
import { Building2, Edit3, FolderKanban, Plus, Save, Search, Users } from "lucide-react";
import { Button, Avatar, StatusBadge } from "../../components/ui";
import { companies as fallbackCompanies } from "../../data/mockData";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import SidePanel from "../../components/SidePanel";

function Card({ children, className = "" }) {
  return <section className={`rounded-xl border border-gray-200 bg-white shadow-sm shadow-gray-100/60 ${className}`}>{children}</section>;
}

function Field({ label, value, onChange, placeholder = "", type = "text" }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-gray-600">{label}</span>
      <input type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
    </label>
  );
}

export default function Companies() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const { records: companies, save, loading } = useCrmRecords("companies", fallbackCompanies);
  const { showToast } = useToast();

  const filtered = useMemo(() => companies.filter((company) =>
    `${company.name} ${company.industry} ${company.contact} ${company.status}`.toLowerCase().includes(search.toLowerCase())
  ), [companies, search]);

  async function saveCompany(company) {
    try {
      const isNew = !company._id;
      await save({
        ...company,
        id: company.id || `CO-${Date.now()}`,
        projects: Number(company.projects) || 0
      });
      setEditing(null);
      showToast({
        title: isNew ? "Company created" : "Company updated",
        message: `${company.name || "Company"} saved successfully.`,
      });
    } catch (error) {
      showToast({ type: "error", title: "Could not save company", message: error.message });
    }
  }

  return (
    <div className="p-5 xl:p-6">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">Account management</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">Companies</h1>
          <p className="mt-1 text-sm text-gray-500">{filtered.length} visible companies - account data persists in MongoDB</p>
        </div>
        <Button onClick={() => setEditing({ name: "", gstin: "", industry: "", contact: "", projects: 0, status: "Prospect", address: "", website: "", notes: "" })}><Plus size={14} /> Add Company</Button>
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        {[
          ["Companies", companies.length, Building2],
          ["Active projects", companies.reduce((sum, item) => sum + Number(item.projects || 0), 0), FolderKanban],
          ["Primary contacts", companies.filter((item) => item.contact).length, Users],
        ].map(([label, value, Icon]) => (
          <Card key={label} className="p-4">
            <Icon size={18} className="text-[#2563EB]" />
            <p className="mt-3 text-2xl font-bold text-gray-950">{value}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="grid gap-3 border-b border-gray-100 p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
            <Search size={14} className="text-gray-400" />
            <input className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" placeholder="Search companies, industry, status" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <span className="inline-flex h-10 items-center rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-500">{loading ? "Loading..." : "Mongo ready"}</span>
        </div>

        <div className="grid gap-4 p-4 xl:grid-cols-2">
          {filtered.map((company) => (
            <button key={company._id || company.id} onClick={() => setEditing(company)} className="rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl border border-gray-200 bg-gray-50 text-gray-400"><Building2 size={18} /></div>
                  <div>
                    <p className="text-sm font-bold text-gray-950">{company.name}</p>
                    <p className="text-xs font-semibold text-gray-500">{company.industry}</p>
                    {company.gstin && <p className="mt-0.5 font-mono text-[10px] font-bold text-gray-400">GSTIN {company.gstin}</p>}
                  </div>
                </div>
                <StatusBadge status={company.status} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Contact</p>
                  <div className="mt-2 flex items-center gap-2"><Avatar name={company.contact} size="sm" /><span className="truncate text-xs font-bold text-gray-700">{company.contact}</span></div>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Projects</p>
                  <p className="mt-2 text-lg font-bold text-gray-950">{company.projects}</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Next</p>
                  <p className="mt-2 text-xs font-bold text-blue-700">Review</p>
                </div>
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#2563EB]"><Edit3 size={12} /> Edit company</div>
            </button>
          ))}
        </div>
      </Card>

      {editing && <CompanyModal company={editing} onClose={() => setEditing(null)} onSave={saveCompany} />}
    </div>
  );
}

function CompanyModal({ company, onClose, onSave }) {
  const [form, setForm] = useState(company);
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  return (
    <SidePanel
      title={company._id || company.id ? "Edit company" : "Add company"}
      subtitle="Update company profile, GSTIN, contact, and project details."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}><Save size={14} /> Save company</Button>
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
        <label className="block sm:col-span-2">
          <span className="text-xs font-bold text-gray-600">Notes</span>
          <textarea value={form.notes || ""} onChange={(event) => set("notes")(event.target.value)} className="mt-1.5 min-h-24 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
        </label>
      </div>
    </SidePanel>
  );
}
