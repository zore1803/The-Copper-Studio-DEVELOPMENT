import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Building2, Calendar, Download, Edit2, Eye, FileText, Filter,
  FolderKanban, Globe, Mail, Phone, Plus, Save, Search,
  StickyNote, Target, Trash2, Users
} from "lucide-react";
import { Avatar, Button, StatusBadge } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import SidePanel from "../../components/SidePanel";

const TABS = ["Overview", "Projects", "Contacts", "Invoices", "Tasks", "Meetings"];
const PROJECT_STATUS = ["Pending", "Confirmed", "Requirement Gathering", "Design", "Development", "Testing", "Review", "Deployment", "Completed", "Cancelled", "On Hold"];

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
            {PROJECT_STATUS.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
      </div>
    </SidePanel>
  );
}

function ContactPanel({ company, contact, onClose, onSave }) {
  const [form, setForm] = useState(contact || {
    salutation: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    whatsapp: "",
    designation: "",
    linkedin: "",
    status: "Active",
  });
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <SidePanel
      title={contact?._id || contact?.id ? "Edit Contact" : "Add Contact"}
      subtitle={`Link this person to ${company.name}.`}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}><Save size={14} /> Save Contact</Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Salutation" value={form.salutation} onChange={set("salutation")} />
        <Input label="Designation" value={form.designation} onChange={set("designation")} />
        <Input label="First name" value={form.firstName} onChange={set("firstName")} />
        <Input label="Last name" value={form.lastName} onChange={set("lastName")} />
        <Input label="Email" value={form.email} onChange={set("email")} />
        <Input label="Phone" value={form.phone} onChange={set("phone")} />
        <Input label="WhatsApp" value={form.whatsapp} onChange={set("whatsapp")} />
        <Input label="LinkedIn" value={form.linkedin} onChange={set("linkedin")} />
      </div>
    </SidePanel>
  );
}

function InvoicePanel({ invoice, onClose, onDownload }) {
  if (!invoice) return null;
  return (
    <SidePanel
      title={`Invoice ${invoice.invoiceId || invoice.id || invoice._id}`}
      subtitle="Invoice amount, payment status, and linked company details."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={() => onDownload(invoice)}><Download size={14} /> PDF</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <DetailRow label="Invoice ID" value={invoice.invoiceId || invoice.id || invoice._id} />
        <DetailRow label="Amount" value={formatINR(parseMoney(invoice.total || invoice.amount))} />
        <DetailRow label="Status" value={invoice.status || "Pending"} />
        <DetailRow label="Payment ID" value={invoice.paymentId || invoice.razorpayPaymentId || "Not linked"} />
        <DetailRow label="Order ID" value={invoice.orderId || "Not linked"} />
        <DetailRow label="Issue Date" value={invoice.date || invoice.createdAt || "Not added"} />
        <DetailRow label="Due Date" value={invoice.dueDate || "Not added"} />
      </div>
    </SidePanel>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[#374151]">{label}</span>
      <input
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20"
      />
    </label>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#111827]">{value || "Not added"}</p>
    </div>
  );
}

export default function CompanyDetail() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("Overview");
  const [creatingProject, setCreatingProject] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contactQuery, setContactQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const { records: companies } = useCrmRecords("companies");
  const { records: projects, save: saveProject } = useCrmRecords("projects");
  const { records: contacts, save: saveContact, remove: removeContact } = useCrmRecords("contacts");
  const { records: invoices } = useCrmRecords("invoices");
  const { records: tasks } = useCrmRecords("tasks");
  const { records: meetings } = useCrmRecords("meetings");

  const company = useMemo(() => companies.find((c) => String(c.id || c._id) === companyId), [companies, companyId]);
  const linked = useMemo(() => {
    const name = company?.name || "";
    const linkedProjects = projects.filter((p) => String(p.companyId) === companyId || p.client === name || p.company === name || p.companyName === name);
    const linkedProjectIds = new Set(linkedProjects.map((project) => String(project.id || project._id)));
    return {
      projects: linkedProjects,
      contacts: contacts.filter((c) => String(c.companyId) === companyId || c.company === name || c.companyName === name),
      invoices: invoices.filter((i) => String(i.companyId) === companyId || i.company === name || i.client === name || i.companyName === name),
      tasks: tasks.filter((t) => String(t.companyId) === companyId || t.company === name || t.companyName === name || linkedProjectIds.has(String(t.projectId)) || linkedProjectIds.has(String(t.project))),
      meetings: meetings.filter((m) => String(m.companyId) === companyId || m.company === name),
    };
  }, [company, companyId, contacts, invoices, meetings, projects, tasks]);
  const filteredContacts = useMemo(() => linked.contacts.filter((contact) => {
    const fullName = `${contact.salutation || ""} ${contact.firstName || ""} ${contact.lastName || ""} ${contact.name || ""}`;
    return `${fullName} ${contact.email} ${contact.phone} ${contact.designation}`.toLowerCase().includes(contactQuery.toLowerCase());
  }), [contactQuery, linked.contacts]);

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

  const collected = linked.invoices.filter((i) => String(i.status || "").toLowerCase() === "paid").reduce((sum, i) => sum + parseMoney(i.total || i.amount), 0);
  const outstanding = linked.invoices.filter((i) => String(i.status || "").toLowerCase() !== "paid").reduce((sum, i) => sum + parseMoney(i.total || i.amount), 0);
  const pipeline = linked.projects.reduce((sum, p) => sum + Number(p.budget || p.value || 0), 0);
  const companyValue = collected + outstanding + pipeline;

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

  async function handleSaveContact(form) {
    const fullName = `${form.salutation || ""} ${form.firstName || ""} ${form.lastName || ""}`.trim();
    if (!fullName && !form.name) {
      showToast({ type: "error", title: "Contact name required", message: "Add at least a first name or contact name." });
      return;
    }
    await saveContact({
      ...form,
      id: form.id || form._id || `contact-${Date.now()}`,
      name: form.name || fullName,
      companyId: company.id || company._id,
      company: company.name,
      companyName: company.name,
    });
    setEditingContact(null);
    showToast({ title: "Contact saved", message: `${fullName || form.name} is linked to ${company.name}.` });
  }

  async function handleDeleteContact(contact) {
    await removeContact(contact);
    showToast({ title: "Contact deleted", message: `${contact.name || contact.email || "Contact"} removed from ${company.name}.` });
  }

  async function downloadInvoicePdf(invoice) {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const invoiceNo = invoice.invoiceId || invoice.id || invoice._id;
    doc.setFillColor(136, 76, 45);
    doc.rect(0, 0, 595, 118, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("The Copper Studio", 48, 52);
    doc.setFontSize(12);
    doc.text(`Invoice ${invoiceNo}`, 48, 78);
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(16);
    doc.text(company.name || "Company", 48, 158);
    doc.setFontSize(10);
    const rows = [
      ["Invoice ID", invoiceNo],
      ["Company", company.name],
      ["Amount", formatINR(parseMoney(invoice.total || invoice.amount))],
      ["Status", invoice.status || "Pending"],
      ["Payment ID", invoice.paymentId || invoice.razorpayPaymentId || "-"],
      ["Order ID", invoice.orderId || "-"],
      ["Issue Date", invoice.date || invoice.createdAt || "-"],
      ["Due Date", invoice.dueDate || "-"],
    ];
    rows.forEach(([label, value], index) => {
      const y = 205 + index * 28;
      doc.setFont("helvetica", "bold");
      doc.text(label, 48, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value || "-"), 180, y);
    });
    doc.save(`${String(invoiceNo || "invoice").replace(/[^a-z0-9-]/gi, "-")}.pdf`);
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
          <KpiChip label="Company Value" value={formatINR(companyValue)} icon={Target} />
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
              <Section title="Contacts" action={<Button size="sm" onClick={() => setEditingContact({})}><Plus size={14} /> Contact</Button>}>
                <ContactToolbar query={contactQuery} onQuery={setContactQuery} />
                {filteredContacts.length ? <ContactsTable contacts={filteredContacts} onEdit={setEditingContact} onDelete={handleDeleteContact} /> : <EmptyState icon={Users} title="No contacts linked." text="Add contacts and they will stay attached to this company." />}
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
        {activeTab === "Projects" && (
          <Section title="Projects Overview" action={<Button size="sm" onClick={() => setCreatingProject(true)}><Plus size={14} /> Project</Button>}>
            {linked.projects.length ? <ProjectOverviewGrid projects={linked.projects} companyId={companyId} onOpen={navigate} /> : <EmptyState icon={FolderKanban} title="No projects yet." action={<Button onClick={() => setCreatingProject(true)}><Plus size={14} /> New Project</Button>} />}
          </Section>
        )}
        {activeTab === "Contacts" && (
          <Section title="Contacts" action={<Button size="sm" onClick={() => setEditingContact({})}><Plus size={14} /> Contact</Button>}>
            <ContactToolbar query={contactQuery} onQuery={setContactQuery} />
            {filteredContacts.length ? <ContactsTable contacts={filteredContacts} onEdit={setEditingContact} onDelete={handleDeleteContact} /> : <EmptyState icon={Users} title="No contacts linked." />}
          </Section>
        )}
        {activeTab === "Invoices" && (
          <Section title="Invoices">
            {linked.invoices.length ? <InvoicesTable invoices={linked.invoices} onView={setSelectedInvoice} onDownload={downloadInvoicePdf} /> : <EmptyState icon={FileText} title="No invoices linked." />}
          </Section>
        )}
        {activeTab === "Tasks" && (
          <div className="space-y-5">
            {linked.tasks.length ? <TaskGantt tasks={linked.tasks} projects={linked.projects} /> : <EmptyState icon={StickyNote} title="No tasks linked." />}
            {linked.tasks.length ? <SimpleList items={linked.tasks} /> : null}
          </div>
        )}
        {activeTab === "Meetings" && (linked.meetings.length ? <SimpleList items={linked.meetings} /> : <EmptyState icon={Calendar} title="No meetings linked." />)}
      </div>

      {creatingProject && <ProjectPanel company={company} onClose={() => setCreatingProject(false)} onSave={handleCreateProject} />}
      {editingContact && <ContactPanel company={company} contact={editingContact._id || editingContact.id ? editingContact : null} onClose={() => setEditingContact(null)} onSave={handleSaveContact} />}
      {selectedInvoice && <InvoicePanel invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} onDownload={downloadInvoicePdf} />}
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

function ProjectOverviewGrid({ projects, companyId, onOpen }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {projects.map((project) => {
        const progress = Number(project.progress) || 0;
        return (
          <button
            key={project.id || project._id}
            onClick={() => onOpen(`/admin/companies/${companyId}/projects/${project.id || project._id}`)}
            className="rounded-xl border border-[#e5e7eb] bg-white p-5 text-left hover:border-[#884c2d]/40 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-bold text-[#111827]">{project.name || "Untitled project"}</p>
                <p className="mt-1 text-sm text-[#6b7280]">{project.packageName || project.package || "No package linked"}</p>
              </div>
              <StatusBadge status={project.status || project.currentPhase || "Not Started"} />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <DetailMini label="Manager" value={project.projectManager || project.manager || "Not assigned"} />
              <DetailMini label="Primary Contact" value={project.primaryContact || project.contact || "Not linked"} />
              <DetailMini label="Start" value={project.startDate || "Not set"} />
              <DetailMini label="Due" value={project.dueDate || project.expectedEndDate || "Not set"} />
              <DetailMini label="Budget" value={formatINR(Number(project.budget || project.value || 0))} />
              <DetailMini label="Current Stage" value={project.currentPhase || project.status || "Not started"} />
            </div>
            <div className="mt-5">
              <div className="mb-1 flex justify-between text-xs font-semibold text-[#6b7280]">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#f3f4f6]">
                <div className="h-full rounded-full bg-[#884c2d]" style={{ width: `${Math.min(progress, 100)}%` }} />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DetailMini({ label, value }) {
  return (
    <div className="rounded-lg bg-[#f9fafb] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">{label}</p>
      <p className="mt-1 truncate font-semibold text-[#374151]">{value || "Not added"}</p>
    </div>
  );
}

function ContactToolbar({ query, onQuery }) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#884c2d]/20">
        <Search size={14} className="text-[#9ca3af]" />
        <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Filter contacts by name, email, phone, designation" className="w-full bg-transparent text-sm outline-none" />
      </div>
      <div className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#e5e7eb] px-3 text-sm font-semibold text-[#6b7280]">
        <Filter size={14} />
        Filter
      </div>
    </div>
  );
}

function ContactsTable({ contacts, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <tbody className="divide-y divide-[#f3f4f6]">
          {contacts.map((contact) => {
            const name = contact.name || `${contact.salutation || ""} ${contact.firstName || ""} ${contact.lastName || ""}`.trim();
            return (
            <tr key={contact.id || contact._id}>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                  <Avatar name={name} size="sm" />
                  <div>
                    <p className="font-semibold text-[#111827]">{name || "Unnamed contact"}</p>
                    <p className="text-xs text-[#6b7280]">{contact.designation || "No designation"}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 pr-4 text-[#374151]"><span className="inline-flex items-center gap-1"><Mail size={12} /> {contact.email || "No email"}</span></td>
              <td className="py-3 text-[#374151]"><span className="inline-flex items-center gap-1"><Phone size={12} /> {contact.phone || "No phone"}</span></td>
              <td className="py-3 text-right">
                <div className="inline-flex items-center gap-2">
                  <button onClick={() => onEdit(contact)} className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#884c2d]"><Edit2 size={14} /></button>
                  <button onClick={() => onDelete(contact)} className="rounded-lg p-2 text-[#6b7280] hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              </td>
            </tr>
          );})}
        </tbody>
      </table>
    </div>
  );
}

function InvoicesTable({ invoices, onView, onDownload }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <tbody className="divide-y divide-[#f3f4f6]">
          {invoices.map((invoice) => (
            <tr key={invoice.id || invoice._id}>
              <td className="py-3 pr-4 font-mono text-xs text-[#6b7280]">{invoice.invoiceId || invoice.id || invoice._id}</td>
              <td className="py-3 pr-4 font-semibold text-[#111827]">{formatINR(parseMoney(invoice.total || invoice.amount))}</td>
              <td className="py-3 pr-4"><StatusBadge status={invoice.status || "Pending"} /></td>
              <td className="py-3 pr-4 text-[#374151]">{invoice.date || invoice.createdAt || "No date"}</td>
              <td className="py-3 text-right">
                <div className="inline-flex items-center gap-2">
                  <button onClick={() => onView(invoice)} className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#884c2d]"><Eye size={14} /></button>
                  <button onClick={() => onDownload(invoice)} className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#884c2d]"><Download size={14} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TaskGantt({ tasks, projects }) {
  const projectNames = Object.fromEntries(projects.map((project) => [String(project.id || project._id), project.name]));
  const rows = tasks.map((task) => {
    const start = new Date(task.startDate || task.createdAt || Date.now());
    const end = new Date(task.dueDate || task.deadline || task.expectedEndDate || Date.now());
    const safeStart = Number.isNaN(start.getTime()) ? new Date() : start;
    const safeEnd = Number.isNaN(end.getTime()) ? safeStart : end;
    return { ...task, safeStart, safeEnd };
  });
  const min = Math.min(...rows.map((row) => row.safeStart.getTime()));
  const max = Math.max(...rows.map((row) => row.safeEnd.getTime()), min + 86400000);
  const range = Math.max(max - min, 86400000);

  return (
    <Section title="Project Tasks Gantt Chart">
      <div className="space-y-3">
        {rows.map((task) => {
          const left = ((task.safeStart.getTime() - min) / range) * 100;
          const width = Math.max(((task.safeEnd.getTime() - task.safeStart.getTime()) / range) * 100, 8);
          return (
            <div key={task.id || task._id} className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-center">
              <div>
                <p className="text-sm font-semibold text-[#111827]">{task.title || task.taskName || "Untitled task"}</p>
                <p className="text-xs text-[#6b7280]">{projectNames[String(task.projectId || task.project)] || task.projectName || "No project"} / {task.status || "Backlog"}</p>
              </div>
              <div className="relative h-9 rounded-lg bg-[#f3f4f6]">
                <div
                  className="absolute top-1.5 h-6 rounded-lg bg-[#884c2d]"
                  style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}
                  title={`${task.safeStart.toLocaleDateString("en-IN")} - ${task.safeEnd.toLocaleDateString("en-IN")}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Section>
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
