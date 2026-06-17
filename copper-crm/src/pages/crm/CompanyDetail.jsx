import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle, Building2, Calendar, CheckCircle2, Clock3, Download,
  Edit2, Eye, FileText, Filter, FolderKanban, FolderOpen, Globe,
  Link as LinkIcon, Mail, MessageSquare, Phone, Plus, ReceiptText,
  Save, Search, Send, StickyNote, Target, Trash2, Users
} from "lucide-react";
import { Avatar, Button, StatusBadge } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import SidePanel from "../../components/SidePanel";

const TABS = ["Overview", "Projects", "Contacts", "Invoices", "Documents", "Tasks", "Activity", "Meetings"];
const PROJECT_STATUS = ["Pending", "Confirmed", "Requirement Gathering", "Design", "Development", "Testing", "Review", "Deployment", "Completed", "Cancelled", "On Hold"];
const TASK_VIEWS = ["List", "Board", "Calendar", "Gantt"];
const PROJECT_VIEWS = ["Table", "Board", "Timeline", "Gantt"];
const PACKAGE_OPTIONS = ["Starter", "Growth", "Enterprise", "Custom"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];
const PAYMENT_STATUS_OPTIONS = ["Pending", "Partial", "Paid", "Overdue"];

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

function ProjectPanel({ company, contacts = [], invoices = [], onClose, onSave }) {
  const [projectCode] = useState(() => `PRJ-${Date.now().toString(36).toUpperCase()}`);
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

  function handleSave() {
    const contact = contacts.find((c) => String(c.id || c._id) === form.primaryContactId);
    onSave({
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
      subtitle={`Link this project to ${company.name}.`}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}><Save size={14} /> Create Project</Button>
        </div>
      }
    >
      <div className="space-y-6">
        <FormSection title="Basic Information">
          <Input span label="Project name *" value={form.name} onChange={set("name")} />
          <Input label="Project ID" value={projectCode} disabled />
          <Input label="Company" value={company.name} disabled />
          <Select label="Primary contact" value={form.primaryContactId} onChange={set("primaryContactId")}
            options={contacts.map((c) => ({ value: String(c.id || c._id), label: c.name || `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email }))} />
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
            options={invoices.map((i) => ({ value: String(i.id || i._id), label: i.invoiceId || i.id || i._id }))} />
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

function ContactPanel({ company, contact, onClose, onSave }) {
  const [form, setForm] = useState(contact || {
    salutation: "",
    firstName: "",
    lastName: "",
    designation: "",
    email: "",
    whatsapp: "",
    alternatePhone: "",
    department: "",
    isDecisionMaker: false,
    isPrimary: false,
    isBillingContact: false,
    isTechnicalContact: false,
    linkedin: "",
    website: "",
    preferences: "",
    notes: "",
    meetingNotes: "",
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
      <div className="space-y-6">
        <FormSection title="Personal Information">
          <Input label="Salutation" value={form.salutation} onChange={set("salutation")} />
          <Input label="Designation" value={form.designation} onChange={set("designation")} />
          <Input label="First name" value={form.firstName} onChange={set("firstName")} />
          <Input label="Last name" value={form.lastName} onChange={set("lastName")} />
        </FormSection>

        <FormSection title="Communication">
          <Input label="Work email" value={form.email} onChange={set("email")} />
          <Input label="WhatsApp number" value={form.whatsapp} onChange={set("whatsapp")}
            hint="Primary WhatsApp number used for project updates." />
          <Input label="Alternative number" value={form.alternatePhone} onChange={set("alternatePhone")} />
        </FormSection>

        <FormSection title="Company Mapping">
          <Input label="Associated company" value={company.name} disabled />
          <Input label="Department" value={form.department} onChange={set("department")} />
          <Checkbox span label="Decision maker" checked={form.isDecisionMaker} onChange={set("isDecisionMaker")} />
          <Checkbox label="Primary contact" checked={form.isPrimary} onChange={set("isPrimary")} />
          <Checkbox label="Billing contact" checked={form.isBillingContact} onChange={set("isBillingContact")} />
          <Checkbox label="Technical contact" checked={form.isTechnicalContact} onChange={set("isTechnicalContact")} />
        </FormSection>

        <FormSection title="Social">
          <Input label="LinkedIn" value={form.linkedin} onChange={set("linkedin")} />
          <Input label="Website" value={form.website} onChange={set("website")} />
        </FormSection>

        <FormSection title="Notes">
          <Textarea span label="Preferences" value={form.preferences} onChange={set("preferences")} />
          <Textarea span label="Important notes" value={form.notes} onChange={set("notes")} />
          <Textarea span label="Meeting notes" value={form.meetingNotes} onChange={set("meetingNotes")} />
        </FormSection>
      </div>
    </SidePanel>
  );
}

function InvoicePanel({ invoice, onClose, onDownload, onMarkPaid }) {
  if (!invoice) return null;
  return (
    <SidePanel
      title={`Invoice ${invoice.invoiceId || invoice.id || invoice._id}`}
      subtitle="Invoice amount, payment status, and linked company details."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button variant="secondary" onClick={() => onMarkPaid(invoice)}><CheckCircle2 size={14} /> Mark Paid</Button>
          <Button variant="secondary" onClick={() => navigator.clipboard?.writeText(`Invoice ${invoice.invoiceId || invoice.id || invoice._id}`)}><Send size={14} /> Send Invoice</Button>
          <Button onClick={() => onDownload(invoice)}><Download size={14} /> PDF</Button>
        </div>
      }
    >
      <div className="mb-4 rounded-xl border border-[#e5e7eb] bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-[#9ca3af]">PDF Preview</p>
        <div className="mt-4 rounded-lg border border-dashed border-[#d8c2b9] bg-[#fff8f6] p-5">
          <p className="text-lg font-bold text-[#111827]">The Copper Studio</p>
          <p className="mt-1 text-sm text-[#6b7280]">Invoice {invoice.invoiceId || invoice.id || invoice._id}</p>
          <p className="mt-5 text-2xl font-bold text-[#884c2d]">{formatINR(parseMoney(invoice.total || invoice.amount))}</p>
        </div>
      </div>
      <div className="space-y-4">
        <DetailRow label="Invoice ID" value={invoice.invoiceId || invoice.id || invoice._id} />
        <DetailRow label="Amount" value={formatINR(parseMoney(invoice.total || invoice.amount))} />
        <DetailRow label="Invoice Status" value={invoice.status || "Pending"} />
        <DetailRow label="Payment Status" value={invoice.paymentStatus || invoice.status || "Pending"} />
        <DetailRow label="GST" value={invoice.gst || invoice.gstAmount || "Not added"} />
        <DetailRow label="Discount" value={invoice.discount || "Not added"} />
        <DetailRow label="Coupon" value={invoice.coupon || invoice.couponCode || "Not linked"} />
        <DetailRow label="Payment ID" value={invoice.paymentId || invoice.razorpayPaymentId || "Not linked"} />
        <DetailRow label="Transaction ID" value={invoice.transactionId || invoice.paymentId || "Not linked"} />
        <DetailRow label="Order ID" value={invoice.orderId || "Not linked"} />
        <DetailRow label="Issue Date" value={invoice.date || invoice.createdAt || "Not added"} />
        <DetailRow label="Due Date" value={invoice.dueDate || "Not added"} />
        <DetailRow label="History" value={invoice.history || "Generated / Sent / Paid events will appear here."} />
      </div>
    </SidePanel>
  );
}

function ContactDetailPanel({ contact, projects, meetings, onClose, onEdit, onDelete, onPrimary }) {
  if (!contact) return null;
  const name = contact.name || `${contact.salutation || ""} ${contact.firstName || ""} ${contact.lastName || ""}`.trim();
  return (
    <SidePanel
      title={name || "Contact"}
      subtitle={contact.designation || "Company contact"}
      onClose={onClose}
      footer={
        <div className="flex justify-between gap-2">
          <Button variant="secondary" onClick={() => onDelete(contact)}><Trash2 size={14} /> Delete</Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => onPrimary(contact)}><CheckCircle2 size={14} /> Make Primary</Button>
            <Button onClick={() => onEdit(contact)}><Edit2 size={14} /> Edit</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-4">
          <Avatar name={name} size="md" />
          <div>
            <p className="font-bold text-[#111827]">{name}</p>
            <p className="text-sm text-[#6b7280]">{contact.email || "No email"}</p>
          </div>
        </div>
        <DetailRow label="WhatsApp" value={contact.whatsapp} />
        <DetailRow label="Alternative Number" value={contact.alternatePhone} />
        <DetailRow label="Department" value={contact.department} />
        <DetailRow
          label="Roles"
          value={[
            contact.isDecisionMaker && "Decision Maker",
            contact.isPrimary && "Primary Contact",
            contact.isBillingContact && "Billing Contact",
            contact.isTechnicalContact && "Technical Contact",
          ].filter(Boolean).join(", ") || "Not set"}
        />
        <DetailRow label="LinkedIn" value={contact.linkedin} />
        <DetailRow label="Website" value={contact.website} />
        <DetailRow label="Status" value={contact.status || "Active"} />
        <DetailRow label="Communication History" value="Emails, WhatsApp, calls, and notes will be logged here." />
        <DetailRow label="Projects Involved" value={projects.map((project) => project.name).join(", ") || "No projects linked"} />
        <DetailRow label="Meetings" value={`${meetings.length} meetings linked`} />
        <DetailRow label="Preferences" value={contact.preferences || "No preferences added"} />
        <DetailRow label="Notes" value={contact.notes || "No notes added"} />
        <DetailRow label="Meeting Notes" value={contact.meetingNotes || "No meeting notes added"} />
      </div>
    </SidePanel>
  );
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

function Checkbox({ label, checked, onChange, span = false }) {
  return (
    <label className={`flex items-center gap-2 rounded-lg border border-[#e5e7eb] px-3 py-2.5 text-sm font-medium text-[#374151] cursor-pointer hover:bg-[#f9fafb] ${span ? "sm:col-span-2" : ""}`}>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-[#d1d5db] text-[#884c2d] focus:ring-[#884c2d]/30"
      />
      {label}
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

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "No date";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function buildRevenueTrend(invoices) {
  const months = {};
  invoices.forEach((invoice) => {
    const date = new Date(invoice.date || invoice.createdAt || invoice.paidAt || Date.now());
    const key = Number.isNaN(date.getTime()) ? "Current" : date.toLocaleDateString("en-IN", { month: "short" });
    months[key] = months[key] || { month: key, collected: 0, outstanding: 0 };
    const amount = parseMoney(invoice.total || invoice.amount);
    if (String(invoice.status || "").toLowerCase() === "paid") months[key].collected += amount;
    else months[key].outstanding += amount;
  });
  const rows = Object.values(months);
  return rows.length ? rows : [{ month: "No data", collected: 0, outstanding: 0 }];
}

function buildActivity(linked, company) {
  const items = [
    ...linked.invoices.map((invoice) => ({
      type: "Invoice",
      title: `Invoice ${invoice.invoiceId || invoice.id || invoice._id} ${invoice.status || "created"}`,
      date: invoice.paidAt || invoice.date || invoice.createdAt,
      icon: ReceiptText,
    })),
    ...linked.projects.map((project) => ({
      type: "Project",
      title: `${project.name || "Project"} ${project.status || project.currentPhase || "created"}`,
      date: project.updatedAt || project.createdAt || project.startDate,
      icon: FolderKanban,
    })),
    ...linked.tasks.map((task) => ({
      type: "Task",
      title: `${task.title || task.taskName || "Task"} ${task.status || "updated"}`,
      date: task.updatedAt || task.createdAt || task.dueDate,
      icon: StickyNote,
    })),
    ...linked.contacts.map((contact) => ({
      type: "Contact",
      title: `${contact.name || contact.email || "Contact"} added`,
      date: contact.createdAt,
      icon: Users,
    })),
    ...linked.meetings.map((meeting) => ({
      type: "Meeting",
      title: meeting.title || meeting.subject || "Meeting scheduled",
      date: meeting.scheduled || meeting.scheduledAt || meeting.createdAt,
      icon: Calendar,
    })),
    ...(company.createdAt ? [{ type: "Company", title: "Company created", date: company.createdAt, icon: Building2 }] : []),
  ];
  return items
    .map((item) => ({ ...item, sortDate: new Date(item.date || 0), dateLabel: formatDate(item.date) }))
    .sort((a, b) => b.sortDate - a.sortDate);
}

function addDays(value, days) {
  const base = value ? new Date(value) : new Date();
  if (Number.isNaN(base.getTime())) return "";
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

function createDefaultTimeline(startDate) {
  const stages = [
    ["Requirement Gathering", 0, 4],
    ["Design", 5, 12],
    ["Development", 13, 28],
    ["Testing", 29, 35],
    ["Review", 36, 40],
    ["Deployment", 41, 45],
  ];
  return stages.map(([name, startOffset, dueOffset], index) => ({
    id: `milestone-${Date.now()}-${index}`,
    name,
    startDate: addDays(startDate, startOffset),
    dueDate: addDays(startDate, dueOffset),
    status: index === 0 ? "On Track" : "Upcoming",
    owner: "",
    completion: 0,
    clientVisible: true,
  }));
}

function createStarterTasks(project, company, timeline) {
  return timeline.map((milestone, index) => ({
    id: `task-${Date.now()}-${index}`,
    taskId: `TASK-${String(index + 1).padStart(3, "0")}`,
    title: `${milestone.name} checkpoint`,
    taskName: `${milestone.name} checkpoint`,
    companyId: company.id || company._id,
    company: company.name,
    projectId: project.id,
    projectName: project.name,
    project: project.id,
    assignedTo: Array.isArray(project.assignedTeam) ? project.assignedTeam[0] || "" : "",
    priority: project.priority || "Medium",
    status: index === 0 ? "To Do" : "Backlog",
    startDate: milestone.startDate,
    dueDate: milestone.dueDate,
    estimatedHours: "",
    actualHours: "",
    tags: [milestone.name, ...(project.tags || [])],
    clientVisible: false,
    createdAt: new Date().toISOString(),
  }));
}

function createProjectFolders(project, company) {
  return ["Proposals", "Contracts", "Invoices", "Design Files", "Development Files", "Deliverables", "Internal Documents", "Client Shared Documents"].map((name, index) => ({
    id: `folder-${Date.now()}-${index}`,
    folderId: `folder-${Date.now()}-${index}`,
    fileName: name,
    name,
    type: "folder",
    fileType: "Folder",
    companyId: company.id || company._id,
    company: company.name,
    projectId: project.id,
    projectName: project.name,
    visibility: name.includes("Client") ? "Client Visible" : name.includes("Internal") ? "Private" : "Project Team",
    category: name,
    tags: [project.packageName, project.priority].filter(Boolean),
    createdAt: new Date().toISOString(),
  }));
}

export default function CompanyDetail() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("Overview");
  const [creatingProject, setCreatingProject] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactQuery, setContactQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [projectView, setProjectView] = useState("Table");
  const [taskView, setTaskView] = useState("List");
  const [projectStatusFilter, setProjectStatusFilter] = useState("All");
  const [projectPackageFilter, setProjectPackageFilter] = useState("All");
  const [projectManagerFilter, setProjectManagerFilter] = useState("All");
  const [projectTimelineFilter, setProjectTimelineFilter] = useState("All");
  const { records: companies, save: saveCompany } = useCrmRecords("companies");
  const { records: projects, save: saveProject } = useCrmRecords("projects");
  const { records: contacts, save: saveContact, remove: removeContact } = useCrmRecords("contacts");
  const { records: invoices, save: saveInvoice } = useCrmRecords("invoices");
  const { records: tasks } = useCrmRecords("tasks");
  const { records: meetings } = useCrmRecords("meetings");
  const { records: documents } = useCrmRecords("documents");

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
      documents: documents.filter((d) => String(d.companyId) === companyId || d.company === name || d.companyName === name || linkedProjectIds.has(String(d.projectId))),
    };
  }, [company, companyId, contacts, documents, invoices, meetings, projects, tasks]);
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
  const today = new Date();
  const activeTasks = linked.tasks.filter((task) => !["completed", "done"].includes(String(task.status || "").toLowerCase())).length;
  const overdueTasks = linked.tasks.filter((task) => {
    const due = new Date(task.dueDate || task.deadline || "");
    return !Number.isNaN(due.getTime()) && due < today && !["completed", "done"].includes(String(task.status || "").toLowerCase());
  }).length;
  const primaryContact = linked.contacts.find((contact) => contact.isPrimary || contact.name === company.primaryContact || contact.email === company.primaryContactEmail) || linked.contacts[0];
  const activityItems = buildActivity(linked, company);
  const lastActivity = activityItems[0]?.dateLabel || "None";
  const revenueTrend = buildRevenueTrend(linked.invoices);
  const projectPackages = ["All", ...Array.from(new Set(linked.projects.map((project) => project.packageName || project.package).filter(Boolean)))];
  const projectManagers = ["All", ...Array.from(new Set(linked.projects.map((project) => project.projectManager || project.manager).filter(Boolean)))];
  const visibleProjects = linked.projects.filter((project) => {
    const due = new Date(project.dueDate || project.expectedEndDate || "");
    const statusOk = projectStatusFilter === "All" || project.status === projectStatusFilter || project.currentPhase === projectStatusFilter;
    const packageOk = projectPackageFilter === "All" || project.packageName === projectPackageFilter || project.package === projectPackageFilter;
    const managerOk = projectManagerFilter === "All" || project.projectManager === projectManagerFilter || project.manager === projectManagerFilter;
    const timelineOk = projectTimelineFilter === "All" ||
      (projectTimelineFilter === "Overdue" && !Number.isNaN(due.getTime()) && due < today) ||
      (projectTimelineFilter === "Due Soon" && !Number.isNaN(due.getTime()) && due >= today && due <= new Date(Date.now() + 7 * 86400000));
    return statusOk && packageOk && managerOk && timelineOk;
  });

  async function handleCreateProject(form) {
    if (!form.name.trim()) {
      showToast({ type: "error", title: "Project name required", message: "Add a name before creating the project." });
      return;
    }
    const projectId = `project-${Date.now()}`;
    const timeline = createDefaultTimeline(form.startDate);
    const folderRecords = createProjectFolders({ ...form, id: projectId }, company);
    const projectPayload = {
      ...form,
      id: projectId,
      projectId: form.projectCode || projectId,
      companyId: company.id || company._id,
      companyName: company.name,
      client: company.name,
      budget: Number(form.budget) || 0,
      packageValue: Number(form.budget) || 0,
      discountApplied: Number(form.discount) || 0,
      finalAmount: Number(form.finalAmount) || Math.max(Number(form.budget || 0) - Number(form.discount || 0), 0),
      linkedInvoiceId: form.linkedInvoiceId,
      budgetUsed: 0,
      progress: Number(form.progress) || 0,
      stages: timeline.map((item) => ({ name: item.name, status: item.status === "On Track" ? "in_progress" : "not_started" })),
      timeline,
      tasksBoard: ["Backlog", "To Do", "In Progress", "Review", "Completed", "Blocked"],
      documents: folderRecords,
      customFolders: folderRecords,
      activity: [
        { icon: "check", text: "Project workspace created", time: "Just now" },
        { icon: "check", text: "Timeline initialized", time: "Just now" },
        { icon: "check", text: "Tasks board initialized", time: "Just now" },
        { icon: "upload", text: "Document folders initialized", time: "Just now" },
      ],
      history: [
        { event: "Project Created", createdAt: new Date().toISOString() },
        { event: "Timeline Generated", createdAt: new Date().toISOString() },
        { event: "Tasks Created", createdAt: new Date().toISOString() },
        { event: "Document Folders Created", createdAt: new Date().toISOString() },
      ],
      createdAt: new Date().toISOString(),
    };
    const starterTasks = createStarterTasks(projectPayload, company, timeline);
    const created = await saveProject(projectPayload);
    await Promise.all(starterTasks.map((task) => saveTask(task)));
    await Promise.all(folderRecords.map((folder) => saveDocument(folder)));
    setCreatingProject(false);
    showToast({ title: "Project workspace created", message: `${created.name} now has timeline, tasks, documents, and activity.` });
  }

  async function handleSaveContact(form) {
    const fullName = `${form.salutation || ""} ${form.firstName || ""} ${form.lastName || ""}`.trim();
    if (!fullName && !form.name) {
      showToast({ type: "error", title: "Contact name required", message: "Add at least a first name or contact name." });
      return;
    }
    const savedContact = await saveContact({
      ...form,
      id: form.id || form._id || `contact-${Date.now()}`,
      name: form.name || fullName,
      phone: form.phone || form.whatsapp || form.alternatePhone,
      companyId: company.id || company._id,
      company: company.name,
      companyName: company.name,
    });
    if (form.isPrimary) {
      await saveCompany({
        ...company,
        primaryContact: savedContact.name || fullName,
        primaryContactEmail: savedContact.email,
        contact: savedContact.name || company.contact,
      });
    }
    setEditingContact(null);
    showToast({ title: "Contact saved", message: `${fullName || form.name} is linked to ${company.name}.` });
  }

  async function handleDeleteContact(contact) {
    await removeContact(contact);
    showToast({ title: "Contact deleted", message: `${contact.name || contact.email || "Contact"} removed from ${company.name}.` });
  }

  async function handleMakePrimary(contact) {
    await saveCompany({
      ...company,
      primaryContact: contact.name || `${contact.firstName || ""} ${contact.lastName || ""}`.trim(),
      primaryContactEmail: contact.email,
      contact: contact.name || company.contact,
    });
    showToast({ title: "Primary contact updated", message: `${contact.name || contact.email} is now the primary contact.` });
  }

  async function handleMarkInvoicePaid(invoice) {
    await saveInvoice({
      ...invoice,
      status: "Paid",
      paymentStatus: "Paid",
      paidAt: new Date().toISOString(),
    });
    setSelectedInvoice(null);
    showToast({ title: "Invoice marked paid", message: `${invoice.invoiceId || invoice.id || "Invoice"} has been updated.` });
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
                  {company.phone && <span className="inline-flex items-center gap-1"><Phone size={12} /> {company.phone}</span>}
                  {company.website && <a className="inline-flex items-center gap-1 text-[#884c2d] hover:underline" href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer"><Globe size={12} /> Website</a>}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#6b7280]">
                  <span>GSTIN: <b className="text-[#374151]">{company.gstin || "Not added"}</b></span>
                  <span>Client since: <b className="text-[#374151]">{formatDate(company.createdAt || company.clientSince)}</b></span>
                  <span>Primary: <b className="text-[#374151]">{primaryContact?.name || company.primaryContact || "Not set"}</b></span>
                  <span>Lead source: <b className="text-[#374151]">{company.leadSource || "Not added"}</b></span>
                  <span>Owner: <b className="text-[#374151]">{company.owner || company.companyOwner || "Unassigned"}</b></span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => navigate("/admin/companies")}><Edit2 size={14} /> Edit in List</Button>
              <Button onClick={() => setCreatingProject(true)}><Plus size={14} /> New Project</Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 px-6 pb-4 lg:grid-cols-4 xl:grid-cols-8">
          <KpiChip label="Company Value" value={formatINR(companyValue)} icon={Target} />
          <KpiChip label="Collected" value={formatINR(collected)} icon={FileText} />
          <KpiChip label="Outstanding" value={formatINR(outstanding)} icon={FileText} />
          <KpiChip label="Projects" value={linked.projects.length} icon={FolderKanban} />
          <KpiChip label="Contacts" value={linked.contacts.length} icon={Users} />
          <KpiChip label="Tasks" value={`${activeTasks} active`} icon={StickyNote} />
          <KpiChip label="Invoices" value={linked.invoices.length} icon={ReceiptText} />
          <KpiChip label="Activity" value={lastActivity} icon={Clock3} />
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
              <RevenueGraph data={revenueTrend} />
              <Section title="Linked Projects" action={<Button size="sm" onClick={() => setCreatingProject(true)}><Plus size={14} /> Project</Button>}>
                {linked.projects.length ? <ProjectsTable projects={linked.projects} companyId={companyId} onOpen={navigate} /> : <EmptyState icon={FolderKanban} title="No linked projects yet." text="Create the first project from this company so files, invoices, and updates stay connected." action={<Button onClick={() => setCreatingProject(true)}><Plus size={14} /> New Project</Button>} />}
              </Section>
              <Section title="Contacts" action={<Button size="sm" onClick={() => setEditingContact({})}><Plus size={14} /> Contact</Button>}>
                <ContactToolbar query={contactQuery} onQuery={setContactQuery} />
                {filteredContacts.length ? <ContactsTable contacts={filteredContacts} onEdit={setEditingContact} onDelete={handleDeleteContact} onView={setSelectedContact} onPrimary={handleMakePrimary} /> : <EmptyState icon={Users} title="No contacts linked." text="Add contacts and they will stay attached to this company." />}
              </Section>
            </div>
            <div className="space-y-5">
              <CompanySidebar
                company={company}
                primaryContact={primaryContact}
                collected={collected}
                outstanding={outstanding}
                activeTasks={activeTasks}
                overdueTasks={overdueTasks}
                linked={linked}
                onProject={() => setCreatingProject(true)}
                onContact={() => setEditingContact({})}
                onDocuments={() => setActiveTab("Documents")}
                onProposal={() => navigate("/admin/services/proposal-generator")}
                onInvoice={() => navigate("/admin/invoices")}
              />
              <ActivityTimeline items={activityItems.slice(0, 5)} />
            </div>
          </div>
        )}
        {activeTab === "Projects" && (
          <ProjectsWorkspace
            projects={visibleProjects}
            allProjects={linked.projects}
            companyId={companyId}
            view={projectView}
            onView={setProjectView}
            onOpen={navigate}
            onCreate={() => setCreatingProject(true)}
            statusFilter={projectStatusFilter}
            packageFilter={projectPackageFilter}
            managerFilter={projectManagerFilter}
            timelineFilter={projectTimelineFilter}
            onStatusFilter={setProjectStatusFilter}
            onPackageFilter={setProjectPackageFilter}
            onManagerFilter={setProjectManagerFilter}
            onTimelineFilter={setProjectTimelineFilter}
            packages={projectPackages}
            managers={projectManagers}
          />
        )}
        {activeTab === "Contacts" && (
          <Section title="Contacts" action={<Button size="sm" onClick={() => setEditingContact({})}><Plus size={14} /> Contact</Button>}>
            <ContactToolbar query={contactQuery} onQuery={setContactQuery} />
            {filteredContacts.length ? <ContactsTable contacts={filteredContacts} onEdit={setEditingContact} onDelete={handleDeleteContact} onView={setSelectedContact} onPrimary={handleMakePrimary} /> : <EmptyState icon={Users} title="No contacts linked." />}
          </Section>
        )}
        {activeTab === "Invoices" && (
          <Section title="Invoices">
            {linked.invoices.length ? <InvoicesTable invoices={linked.invoices} onView={setSelectedInvoice} onDownload={downloadInvoicePdf} /> : <EmptyState icon={FileText} title="No invoices linked." />}
          </Section>
        )}
        {activeTab === "Documents" && <DocumentsTab documents={linked.documents} projects={linked.projects} />}
        {activeTab === "Tasks" && (
          <TasksWorkspace tasks={linked.tasks} projects={linked.projects} view={taskView} onView={setTaskView} />
        )}
        {activeTab === "Activity" && <ActivityTimeline items={activityItems} full />}
        {activeTab === "Meetings" && (linked.meetings.length ? <SimpleList items={linked.meetings} /> : <EmptyState icon={Calendar} title="No meetings linked." />)}
      </div>

      {creatingProject && <ProjectPanel company={company} contacts={linked.contacts} invoices={linked.invoices} onClose={() => setCreatingProject(false)} onSave={handleCreateProject} />}
      {editingContact && <ContactPanel company={company} contact={editingContact._id || editingContact.id ? editingContact : null} onClose={() => setEditingContact(null)} onSave={handleSaveContact} />}
      {selectedContact && <ContactDetailPanel contact={selectedContact} projects={linked.projects} meetings={linked.meetings} onClose={() => setSelectedContact(null)} onEdit={(contact) => { setSelectedContact(null); setEditingContact(contact); }} onDelete={handleDeleteContact} onPrimary={handleMakePrimary} />}
      {selectedInvoice && <InvoicePanel invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} onDownload={downloadInvoicePdf} onMarkPaid={handleMarkInvoicePaid} />}
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

function RevenueGraph({ data }) {
  const max = Math.max(...data.map((item) => item.collected + item.outstanding), 1);
  return (
    <Section title="Revenue Trend">
      <div className="grid gap-4">
        <div className="flex items-center gap-4 text-xs font-semibold text-[#6b7280]">
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#884c2d]" /> Collected Revenue</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> Outstanding Revenue</span>
        </div>
        <div className="flex h-52 items-end gap-3">
          {data.map((item) => (
            <div key={item.month} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-40 w-full max-w-16 items-end gap-1">
                <div className="w-1/2 rounded-t bg-[#884c2d]" style={{ height: `${Math.max((item.collected / max) * 100, item.collected ? 6 : 0)}%` }} />
                <div className="w-1/2 rounded-t bg-[#f59e0b]" style={{ height: `${Math.max((item.outstanding / max) * 100, item.outstanding ? 6 : 0)}%` }} />
              </div>
              <span className="text-xs font-semibold text-[#6b7280]">{item.month}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function ActivityTimeline({ items, full = false }) {
  return (
    <Section title="Activity Timeline">
      {items.length ? (
        <div className="space-y-4">
          {items.map((item, index) => {
            const Icon = item.icon || MessageSquare;
            return (
              <div key={`${item.type}-${item.title}-${index}`} className="flex gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#fff1ec] text-[#884c2d]">
                  <Icon size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#9ca3af]">{item.dateLabel}</p>
                  <p className="mt-0.5 text-sm font-semibold text-[#111827]">{item.title}</p>
                  {full && <p className="text-xs text-[#6b7280]">{item.type}</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : <EmptyState icon={Clock3} title="No activity yet." />}
    </Section>
  );
}

function CompanySidebar({ company, primaryContact, collected, outstanding, activeTasks, overdueTasks, linked, onProject, onContact, onInvoice, onProposal, onDocuments }) {
  const totalSignals = linked.projects.length + linked.contacts.length + linked.invoices.length + activeTasks;
  const riskPenalty = overdueTasks * 12 + (outstanding > 0 ? 8 : 0);
  const score = Math.max(0, Math.min(100, 68 + Math.min(totalSignals * 3, 24) - riskPenalty));
  return (
    <div className="space-y-5">
      <Section title="Company Health">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-[#111827]">{score}%</p>
            <p className="text-sm text-[#6b7280]">{score >= 80 ? "Healthy relationship" : score >= 55 ? "Needs attention" : "High priority"}</p>
          </div>
          <div className="grid h-16 w-16 place-items-center rounded-full border-8 border-[#fff1ec] text-sm font-bold text-[#884c2d]">{score}</div>
        </div>
      </Section>
      <Section title="Quick Stats">
        <div className="grid grid-cols-2 gap-3">
          <DetailMini label="Revenue" value={formatINR(collected)} />
          <DetailMini label="Outstanding" value={formatINR(outstanding)} />
          <DetailMini label="Projects" value={linked.projects.length} />
          <DetailMini label="Tasks" value={activeTasks} />
        </div>
      </Section>
      <Section title="Primary Contact">
        {primaryContact ? (
          <div className="space-y-2 text-sm">
            <p className="font-bold text-[#111827]">{primaryContact.name || `${primaryContact.firstName || ""} ${primaryContact.lastName || ""}`.trim()}</p>
            <p className="text-[#6b7280]">{primaryContact.phone || "No phone"}</p>
            <p className="text-[#6b7280]">{primaryContact.email || "No email"}</p>
          </div>
        ) : <EmptyState icon={Users} title="No primary contact." action={<Button size="sm" onClick={onContact}><Plus size={14} /> Add Contact</Button>} />}
      </Section>
      <Section title="Upcoming">
        <div className="space-y-2 text-sm text-[#374151]">
          <p>Deadlines: <b>{linked.tasks.filter((task) => task.dueDate || task.deadline).length}</b></p>
          <p>Meetings: <b>{linked.meetings.length}</b></p>
          <p>Invoices due: <b>{linked.invoices.filter((invoice) => String(invoice.status || "").toLowerCase() !== "paid").length}</b></p>
        </div>
      </Section>
      <Section title="Quick Actions">
        <div className="grid gap-2">
          <Button variant="secondary" onClick={onProject}><Plus size={14} /> New Project</Button>
          <Button variant="secondary" onClick={onContact}><Users size={14} /> New Contact</Button>
          <Button variant="secondary" onClick={onInvoice}><ReceiptText size={14} /> New Invoice</Button>
          <Button variant="secondary" onClick={onProposal}><FileText size={14} /> Generate Proposal</Button>
          <Button variant="secondary" onClick={onDocuments}><FolderOpen size={14} /> Upload Document</Button>
        </div>
      </Section>
      <InfoBlock company={company} />
    </div>
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
            <th className="py-3 pr-4">Package</th>
            <th className="py-3 pr-4">Status</th>
            <th className="py-3 pr-4">Progress</th>
            <th className="py-3 pr-4">Due</th>
            <th className="py-3 pr-4">Project Manager</th>
            <th className="py-3 text-right">Budget</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id || project._id} onClick={() => onOpen(`/admin/companies/${companyId}/projects/${project.id || project._id}`)} className="cursor-pointer border-b border-[#f9fafb] hover:bg-[#fafafa]">
              <td className="py-3 pr-4 font-semibold text-[#111827]">{project.name || "Untitled project"}</td>
              <td className="py-3 pr-4 text-[#374151]">{project.packageName || project.package || "Not linked"}</td>
              <td className="py-3 pr-4"><StatusBadge status={project.status || project.currentPhase || "Not Started"} /></td>
              <td className="py-3 pr-4 text-[#374151]">{Number(project.progress) || 0}%</td>
              <td className="py-3 pr-4 text-[#374151]">{project.dueDate || project.expectedEndDate || "Not set"}</td>
              <td className="py-3 pr-4 text-[#374151]">{project.projectManager || project.manager || "Unassigned"}</td>
              <td className="py-3 text-right font-semibold text-[#111827]">{formatINR(Number(project.budget || project.value || 0))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WorkspaceToggle({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-[#e5e7eb] bg-white p-1">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`rounded-md px-3 py-1.5 text-xs font-bold ${value === option ? "bg-[#884c2d] text-white" : "text-[#6b7280] hover:bg-[#f9fafb]"}`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function ProjectsWorkspace({ projects, allProjects, companyId, view, onView, onOpen, onCreate, statusFilter, packageFilter, managerFilter, timelineFilter, onStatusFilter, onPackageFilter, onManagerFilter, onTimelineFilter, packages, managers }) {
  return (
    <Section title="Projects" action={<Button size="sm" onClick={onCreate}><Plus size={14} /> Project</Button>}>
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid gap-2 sm:grid-cols-4">
          <select value={statusFilter} onChange={(event) => onStatusFilter(event.target.value)} className="rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm">
            {["All", ...PROJECT_STATUS].map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={packageFilter} onChange={(event) => onPackageFilter(event.target.value)} className="rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm">
            {packages.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={managerFilter} onChange={(event) => onManagerFilter(event.target.value)} className="rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm">
            {managers.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={timelineFilter} onChange={(event) => onTimelineFilter(event.target.value)} className="rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm">
            {["All", "Due Soon", "Overdue"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <WorkspaceToggle options={PROJECT_VIEWS} value={view} onChange={onView} />
      </div>
      {!allProjects.length ? <EmptyState icon={FolderKanban} title="No projects yet." action={<Button onClick={onCreate}><Plus size={14} /> New Project</Button>} /> : null}
      {allProjects.length && !projects.length ? <EmptyState icon={Filter} title="No projects match these filters." /> : null}
      {projects.length && view === "Table" ? <ProjectsTable projects={projects} companyId={companyId} onOpen={onOpen} /> : null}
      {projects.length && view === "Board" ? <ProjectBoard projects={projects} companyId={companyId} onOpen={onOpen} /> : null}
      {projects.length && view === "Timeline" ? <ProjectTimeline projects={projects} /> : null}
      {projects.length && view === "Gantt" ? <ProjectGanttMini projects={projects} /> : null}
    </Section>
  );
}

function ProjectBoard({ projects, companyId, onOpen }) {
  const stages = PROJECT_STATUS.filter((stage) => projects.some((project) => (project.status || project.currentPhase) === stage));
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {(stages.length ? stages : ["Unassigned"]).map((stage) => (
        <div key={stage} className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#6b7280]">{stage}</p>
          <div className="space-y-2">
            {projects.filter((project) => (project.status || project.currentPhase || "Unassigned") === stage).map((project) => (
              <button key={project.id || project._id} onClick={() => onOpen(`/admin/companies/${companyId}/projects/${project.id || project._id}`)} className="w-full rounded-lg border border-[#e5e7eb] bg-white p-3 text-left">
                <p className="font-semibold text-[#111827]">{project.name}</p>
                <p className="text-xs text-[#6b7280]">{project.progress || 0}% / {project.packageName || "No package"}</p>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectTimeline({ projects }) {
  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <div key={project.id || project._id} className="flex gap-3 rounded-xl border border-[#e5e7eb] bg-white p-4">
          <div className="mt-1 h-3 w-3 rounded-full bg-[#884c2d]" />
          <div>
            <p className="font-semibold text-[#111827]">{project.name}</p>
            <p className="text-sm text-[#6b7280]">{project.startDate || "No start"} to {project.dueDate || project.expectedEndDate || "No due date"} / {project.status || project.currentPhase || "Not started"}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectGanttMini({ projects }) {
  return <TaskGantt tasks={projects.map((project) => ({ ...project, title: project.name, dueDate: project.dueDate || project.expectedEndDate }))} projects={projects} />;
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

function ContactsTable({ contacts, onEdit, onDelete, onView, onPrimary }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-[#f3f4f6] text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
            <th className="py-3 pr-4">Contact</th>
            <th className="py-3 pr-4">Email</th>
            <th className="py-3 pr-4">Phone</th>
            <th className="py-3 pr-4">WhatsApp</th>
            <th className="py-3 pr-4">LinkedIn</th>
            <th className="py-3 pr-4">Status</th>
            <th className="py-3 text-right">Actions</th>
          </tr>
        </thead>
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
              <td className="py-3 pr-4 text-[#374151]"><span className="inline-flex items-center gap-1"><Phone size={12} /> {contact.phone || "No phone"}</span></td>
              <td className="py-3 pr-4 text-[#374151]">{contact.whatsapp || "No WhatsApp"}</td>
              <td className="py-3 pr-4 text-[#374151]">{contact.linkedin ? <a className="text-[#884c2d] hover:underline" href={contact.linkedin} target="_blank" rel="noreferrer">Open</a> : "No LinkedIn"}</td>
              <td className="py-3 pr-4"><StatusBadge status={contact.status || "Active"} /></td>
              <td className="py-3 text-right">
                <div className="inline-flex items-center gap-2">
                  <button onClick={() => onView(contact)} className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#884c2d]"><Eye size={14} /></button>
                  <button onClick={() => onEdit(contact)} className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#884c2d]"><Edit2 size={14} /></button>
                  <button onClick={() => onPrimary(contact)} className="rounded-lg p-2 text-[#6b7280] hover:bg-emerald-50 hover:text-emerald-700"><CheckCircle2 size={14} /></button>
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
        <thead>
          <tr className="border-b border-[#f3f4f6] text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
            <th className="py-3 pr-4">Invoice ID</th>
            <th className="py-3 pr-4">Amount</th>
            <th className="py-3 pr-4">Date</th>
            <th className="py-3 pr-4">Due Date</th>
            <th className="py-3 pr-4">Status</th>
            <th className="py-3 pr-4">Payment</th>
            <th className="py-3 pr-4">Transaction ID</th>
            <th className="py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f3f4f6]">
          {invoices.map((invoice) => (
            <tr key={invoice.id || invoice._id}>
              <td className="py-3 pr-4 font-mono text-xs text-[#6b7280]">{invoice.invoiceId || invoice.id || invoice._id}</td>
              <td className="py-3 pr-4 font-semibold text-[#111827]">{formatINR(parseMoney(invoice.total || invoice.amount))}</td>
              <td className="py-3 pr-4 text-[#374151]">{invoice.date || invoice.createdAt || "No date"}</td>
              <td className="py-3 pr-4 text-[#374151]">{invoice.dueDate || "No due date"}</td>
              <td className="py-3 pr-4"><StatusBadge status={invoice.status || "Pending"} /></td>
              <td className="py-3 pr-4"><StatusBadge status={invoice.paymentStatus || invoice.status || "Pending"} /></td>
              <td className="py-3 pr-4 font-mono text-xs text-[#6b7280]">{invoice.transactionId || invoice.paymentId || invoice.razorpayPaymentId || "Not linked"}</td>
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

function DocumentsTab({ documents, projects }) {
  const categories = ["Contracts", "Invoices", "Proposals", "Design Files", "Source Code", "Deliverables"];
  const projectDocs = projects.flatMap((project) => (project.documents || []).map((doc) => ({ ...doc, projectName: project.name })));
  const allDocs = [...documents, ...projectDocs];
  return (
    <Section title="Documents" action={<Button variant="secondary" onClick={() => window.dispatchEvent(new CustomEvent("cs-open-upload"))}><Plus size={14} /> Upload Document</Button>}>
      <div className="grid gap-4 md:grid-cols-3">
        {categories.map((category) => {
          const docs = allDocs.filter((doc) => String(doc.category || doc.folder || doc.fileType || "").toLowerCase().includes(category.toLowerCase().split(" ")[0]));
          return (
            <div key={category} className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-white text-[#884c2d]"><FolderOpen size={17} /></div>
                <div>
                  <p className="font-bold text-[#111827]">{category}</p>
                  <p className="text-xs text-[#6b7280]">{docs.length} files</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {docs.slice(0, 3).map((doc) => (
                  <div key={doc.id || doc._id || doc.fileName || doc.name} className="rounded-lg bg-white px-3 py-2 text-xs text-[#374151]">
                    {doc.fileName || doc.name || "Untitled document"}
                  </div>
                ))}
                {!docs.length && <p className="text-xs text-[#9ca3af]">No files yet.</p>}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function TasksWorkspace({ tasks, projects, view, onView }) {
  if (!tasks.length) return <EmptyState icon={StickyNote} title="No tasks linked." />;
  const statuses = ["Backlog", "To Do", "In Progress", "Review", "Completed", "Blocked"];
  return (
    <Section title="Tasks" action={<WorkspaceToggle options={TASK_VIEWS} value={view} onChange={onView} />}>
      {view === "List" && <TasksTable tasks={tasks} projects={projects} />}
      {view === "Board" && (
        <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {statuses.map((status) => (
            <div key={status} className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#6b7280]">{status}</p>
              <div className="space-y-2">
                {tasks.filter((task) => (task.status || "Backlog") === status).map((task) => (
                  <div key={task.id || task._id} className="rounded-lg border border-[#e5e7eb] bg-white p-3">
                    <p className="text-sm font-semibold text-[#111827]">{task.title || task.taskName || "Untitled task"}</p>
                    <p className="text-xs text-[#6b7280]">{task.priority || "Medium"} / {task.assignedTo || "Unassigned"}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {view === "Calendar" && <CalendarTaskView tasks={tasks} />}
      {view === "Gantt" && <TaskGantt tasks={tasks} projects={projects} />}
    </Section>
  );
}

function TasksTable({ tasks, projects }) {
  const projectNames = Object.fromEntries(projects.map((project) => [String(project.id || project._id), project.name]));
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-[#f3f4f6] text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
            <th className="py-3 pr-4">Task</th>
            <th className="py-3 pr-4">Assigned To</th>
            <th className="py-3 pr-4">Priority</th>
            <th className="py-3 pr-4">Status</th>
            <th className="py-3 pr-4">Due Date</th>
            <th className="py-3 pr-4">Project</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f3f4f6]">
          {tasks.map((task) => (
            <tr key={task.id || task._id}>
              <td className="py-3 pr-4 font-semibold text-[#111827]">{task.title || task.taskName || "Untitled task"}</td>
              <td className="py-3 pr-4 text-[#374151]">{task.assignedTo || task.assigned || "Unassigned"}</td>
              <td className="py-3 pr-4"><StatusBadge status={task.priority || "Medium"} /></td>
              <td className="py-3 pr-4"><StatusBadge status={task.status || "Backlog"} /></td>
              <td className="py-3 pr-4 text-[#374151]">{task.dueDate || task.deadline || "No due date"}</td>
              <td className="py-3 pr-4 text-[#374151]">{projectNames[String(task.projectId || task.project)] || task.projectName || "No project"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CalendarTaskView({ tasks }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {tasks.map((task) => (
        <div key={task.id || task._id} className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#9ca3af]">{task.dueDate || task.deadline || "No date"}</p>
          <p className="mt-2 font-semibold text-[#111827]">{task.title || task.taskName || "Untitled task"}</p>
          <p className="text-sm text-[#6b7280]">{task.status || "Backlog"}</p>
        </div>
      ))}
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
