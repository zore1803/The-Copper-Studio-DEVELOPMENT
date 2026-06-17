import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Building2, Calendar, Edit2, FileText, FolderKanban, Globe,
  Mail, Phone, Plus, Save, StickyNote, Target, Users
} from "lucide-react";
import { Avatar, Button, StatusBadge } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import SidePanel from "../../components/SidePanel";

const TABS = ["Overview", "Projects", "Contacts", "Invoices", "Tasks", "Meetings"];

function parseMoney(value) {
  return Number(String(value || "").replace(/[^\d.-]/g, "")) || 0;
}

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
}

function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="rounded-xl border border-dashed border-[#d8c2b9] bg-white p-10 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[#fff1ec] text-[#884c2d]">
        <Icon size={20} />
      </div>
      <p className="text-sm font-semibold text-[#111827]">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-md text-sm text-[#6b7280]">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function KpiChip({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f3f4f6] text-[#6b7280]">
          <Icon size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#6b7280]">{label}</p>
          <p className="mt-0.5 truncate text-base font-bold text-[#111827]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ProjectPanel({ company, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    packageName: "",
    startDate: "",
    expectedEndDate: "",
    budget: "",
    progress: 0,
    status: "Requirement Gathering",
    clientStatus: "not_started",
  });
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <SidePanel
      title="New Project"
      subtitle={`Link this project to ${company.name}.`}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}><Save size={14} /> Create Project</Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-[#374151]">Project name</span>
          <input value={form.name} onChange={(e) => set("name")(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20" />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-[#374151]">Package / scope</span>
          <input value={form.packageName} onChange={(e) => set("packageName")(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-[#374151]">Start date</span>
          <input type="date" value={form.startDate} onChange={(e) => set("startDate")(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-[#374151]">Expected end date</span>
          <input type="date" value={form.expectedEndDate} onChange={(e) => set("expectedEndDate")(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-[#374151]">Budget</span>
          <input type="number" value={form.budget} onChange={(e) => set("budget")(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-[#374151]">Status</span>
          <select value={form.status} onChange={(e) => set("status")(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20">
            {["Requirement Gathering", "Design", "Development", "Testing", "Review", "Completed"].map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
      </div>
    </SidePanel>
  );
}

export default function CompanyDetail() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("Overview");
  const [creatingProject, setCreatingProject] = useState(false);
  const { records: companies } = useCrmRecords("companies");
  const { records: projects, save: saveProject } = useCrmRecords("projects");
  const { records: contacts } = useCrmRecords("contacts");
  const { records: invoices } = useCrmRecords("invoices");
  const { records: tasks } = useCrmRecords("tasks");
  const { records: meetings } = useCrmRecords("meetings");

  const company = useMemo(() => companies.find((c) => String(c.id || c._id) === companyId), [companies, companyId]);
  const linked = useMemo(() => {
    const name = company?.name || "";
    return {
      projects: projects.filter((p) => String(p.companyId) === companyId || p.client === name || p.company === name),
      contacts: contacts.filter((c) => String(c.companyId) === companyId || c.company === name),
      invoices: invoices.filter((i) => String(i.companyId) === companyId || i.company === name || i.client === name),
      tasks: tasks.filter((t) => String(t.companyId) === companyId || t.company === name),
      meetings: meetings.filter((m) => String(m.companyId) === companyId || m.company === name),
    };
  }, [company, companyId, contacts, invoices, meetings, projects, tasks]);

  if (!company) {
    return (
      <div className="m-6 rounded-xl border border-[#e5e7eb] bg-white p-12 text-center">
        <p className="text-sm font-semibold text-[#6b7280]">Company not found.</p>
        <button onClick={() => navigate("/admin/companies")} className="mt-4 text-sm font-semibold text-[#884c2d] hover:underline">
          Back to Companies
        </button>
      </div>
    );
  }

  const collected = linked.invoices.filter((i) => i.status === "Paid").reduce((sum, i) => sum + parseMoney(i.total || i.amount), 0);
  const outstanding = linked.invoices.filter((i) => i.status !== "Paid").reduce((sum, i) => sum + parseMoney(i.total || i.amount), 0);
  const pipeline = linked.projects.reduce((sum, p) => sum + Number(p.budget || p.value || 0), 0);

  async function handleCreateProject(form) {
    if (!form.name.trim()) {
      showToast({ type: "error", title: "Project name required", message: "Add a name before creating the project." });
      return;
    }
    const created = await saveProject({
      ...form,
      id: `project-${Date.now()}`,
      companyId: company.id || company._id,
      client: company.name,
      budget: Number(form.budget) || 0,
      budgetUsed: 0,
      progress: Number(form.progress) || 0,
      documents: [],
      customFolders: [],
      activity: [],
    });
    setCreatingProject(false);
    showToast({ title: "Project created", message: `${created.name} is linked to ${company.name}.` });
  }

  return (
    <div className="flex min-h-full flex-col bg-[#f8fafc]">
      <div className="border-b border-[#e5e7eb] bg-white">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#e5e7eb] bg-[#f9fafb]">
                <Building2 size={20} className="text-[#884c2d]" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-[#111827]">{company.name}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#6b7280]">
                  {company.industry && <span>{company.industry}</span>}
                  {company.website && <a className="inline-flex items-center gap-1 text-[#884c2d] hover:underline" href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer"><Globe size={12} /> Website</a>}
                  {company.contact && <span className="inline-flex items-center gap-1"><Users size={12} /> {company.contact}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => navigate("/admin/companies")}><Edit2 size={14} /> Edit in List</Button>
              <Button onClick={() => setCreatingProject(true)}><Plus size={14} /> New Project</Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 px-6 pb-4 lg:grid-cols-5">
          <KpiChip label="Pipeline" value={formatINR(pipeline)} icon={Target} />
          <KpiChip label="Collected" value={formatINR(collected)} icon={FileText} />
          <KpiChip label="Outstanding" value={formatINR(outstanding)} icon={FileText} />
          <KpiChip label="Projects" value={linked.projects.length} icon={FolderKanban} />
          <KpiChip label="Contacts" value={linked.contacts.length} icon={Users} />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto px-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === tab ? "border-[#884c2d] text-[#884c2d]" : "border-transparent text-[#6b7280] hover:text-[#374151]"}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6">
        {activeTab === "Overview" && (
          <div className="grid gap-5 xl:grid-cols-3">
            <div className="space-y-5 xl:col-span-2">
              <Section title="Linked Projects" action={<Button size="sm" onClick={() => setCreatingProject(true)}><Plus size={14} /> Project</Button>}>
                {linked.projects.length ? <ProjectsTable projects={linked.projects} companyId={companyId} onOpen={navigate} /> : <EmptyState icon={FolderKanban} title="No linked projects yet." text="Create the first project from this company so files, invoices, and updates stay connected." action={<Button onClick={() => setCreatingProject(true)}><Plus size={14} /> New Project</Button>} />}
              </Section>
              <Section title="Contacts">
                {linked.contacts.length ? <ContactsTable contacts={linked.contacts} /> : <EmptyState icon={Users} title="No contacts linked." text="Add contacts from the Contacts page and set the company name or company ID." />}
              </Section>
            </div>
            <div className="space-y-5">
              <InfoBlock company={company} />
              <Section title="Upcoming">
                {linked.tasks.length || linked.meetings.length ? (
                  <div className="divide-y divide-[#f3f4f6]">
                    {[...linked.tasks, ...linked.meetings].slice(0, 6).map((item) => (
                      <div key={item._id || item.id || item.title || item.name} className="py-3 text-sm text-[#374151]">{item.title || item.name || item.subject || "Scheduled item"}</div>
                    ))}
                  </div>
                ) : <EmptyState icon={Calendar} title="No upcoming work." />}
              </Section>
            </div>
          </div>
        )}
        {activeTab === "Projects" && (linked.projects.length ? <ProjectsTable projects={linked.projects} companyId={companyId} onOpen={navigate} /> : <EmptyState icon={FolderKanban} title="No projects yet." action={<Button onClick={() => setCreatingProject(true)}><Plus size={14} /> New Project</Button>} />)}
        {activeTab === "Contacts" && (linked.contacts.length ? <ContactsTable contacts={linked.contacts} /> : <EmptyState icon={Users} title="No contacts linked." />)}
        {activeTab === "Invoices" && (linked.invoices.length ? <InvoicesTable invoices={linked.invoices} /> : <EmptyState icon={FileText} title="No invoices linked." />)}
        {activeTab === "Tasks" && (linked.tasks.length ? <SimpleList items={linked.tasks} /> : <EmptyState icon={StickyNote} title="No tasks linked." />)}
        {activeTab === "Meetings" && (linked.meetings.length ? <SimpleList items={linked.meetings} /> : <EmptyState icon={Calendar} title="No meetings linked." />)}
      </div>

      {creatingProject && <ProjectPanel company={company} onClose={() => setCreatingProject(false)} onSave={handleCreateProject} />}
    </div>
  );
}

function Section({ title, action, children }) {
  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-white">
      <div className="flex items-center justify-between border-b border-[#f3f4f6] px-5 py-4">
        <h3 className="text-sm font-bold text-[#111827]">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function InfoBlock({ company }) {
  return (
    <Section title="Company Details">
      <div className="space-y-3 text-sm">
        <InfoLine label="GSTIN" value={company.gstin} />
        <InfoLine label="Address" value={company.address} />
        <InfoLine label="Status" value={company.status} />
        <InfoLine label="Notes" value={company.notes} />
      </div>
    </Section>
  );
}

function InfoLine({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">{label}</p>
      <p className="mt-0.5 text-[#374151]">{value || "Not added"}</p>
    </div>
  );
}

function ProjectsTable({ projects, companyId, onOpen }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-[#f3f4f6] text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
            <th className="py-3 pr-4">Project</th>
            <th className="py-3 pr-4">Status</th>
            <th className="py-3 pr-4">Progress</th>
            <th className="py-3 pr-4">Due</th>
            <th className="py-3 text-right">Budget</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id || project._id} onClick={() => onOpen(`/admin/companies/${companyId}/projects/${project.id || project._id}`)} className="cursor-pointer border-b border-[#f9fafb] hover:bg-[#fafafa]">
              <td className="py-3 pr-4 font-semibold text-[#111827]">{project.name || "Untitled project"}</td>
              <td className="py-3 pr-4"><StatusBadge status={project.status || project.currentPhase || "Not Started"} /></td>
              <td className="py-3 pr-4 text-[#374151]">{Number(project.progress) || 0}%</td>
              <td className="py-3 pr-4 text-[#374151]">{project.dueDate || project.expectedEndDate || "Not set"}</td>
              <td className="py-3 text-right font-semibold text-[#111827]">{formatINR(Number(project.budget || project.value || 0))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContactsTable({ contacts }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <tbody className="divide-y divide-[#f3f4f6]">
          {contacts.map((contact) => (
            <tr key={contact.id || contact._id}>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                  <Avatar name={contact.name} size="sm" />
                  <div>
                    <p className="font-semibold text-[#111827]">{contact.name || "Unnamed contact"}</p>
                    <p className="text-xs text-[#6b7280]">{contact.designation || "No designation"}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 pr-4 text-[#374151]"><span className="inline-flex items-center gap-1"><Mail size={12} /> {contact.email || "No email"}</span></td>
              <td className="py-3 text-[#374151]"><span className="inline-flex items-center gap-1"><Phone size={12} /> {contact.phone || "No phone"}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InvoicesTable({ invoices }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <tbody className="divide-y divide-[#f3f4f6]">
          {invoices.map((invoice) => (
            <tr key={invoice.id || invoice._id}>
              <td className="py-3 pr-4 font-mono text-xs text-[#6b7280]">{invoice.id || invoice._id}</td>
              <td className="py-3 pr-4 font-semibold text-[#111827]">{formatINR(parseMoney(invoice.total || invoice.amount))}</td>
              <td className="py-3 pr-4"><StatusBadge status={invoice.status || "Pending"} /></td>
              <td className="py-3 text-[#374151]">{invoice.date || "No date"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SimpleList({ items }) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-5">
      <div className="divide-y divide-[#f3f4f6]">
        {items.map((item) => (
          <div key={item.id || item._id || item.title || item.name} className="py-3 text-sm text-[#374151]">
            {item.title || item.name || item.subject || "Untitled"}
          </div>
        ))}
      </div>
    </div>
  );
}
