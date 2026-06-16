import { useState } from "react";
import {
  CheckCircle2, Edit3, Eye, FileText,
  Mail, MessageSquare, MoreHorizontal, Plus, Save, Search, Send,
  Settings as SettingsIcon, ShieldCheck, SlidersHorizontal, Tag, Trash2,
  TrendingUp, UserPlus, Workflow
} from "lucide-react";
import { Button, StatusBadge, Avatar } from "../../components/ui";
import { invoices, leads, orders, projects } from "../../data/mockData";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import SidePanel from "../../components/SidePanel";

function PageShell({ title, subtitle, action, children }) {
  return (
    <div className="p-5 xl:p-6">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">SuperAdmin workflow</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Card({ children, className = "" }) {
  return <section className={`rounded-xl border border-gray-200 bg-white shadow-sm shadow-gray-100/60 ${className}`}>{children}</section>;
}

function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
      <Search size={14} className="text-gray-400" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" />
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-gray-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
      />
    </label>
  );
}

const dealSeed = Object.values(leads).flat().filter((lead) => ["Qualified", "Proposal Sent", "Negotiation", "Won"].includes(lead.stage || ""));
const dealsSeed = [
  { id: "D-101", name: "Retail app redesign", account: "Zara India", owner: "Meera Kapoor", value: "Rs 89,999", stage: "Negotiation", probability: 72, close: "20 Jun 2026" },
  { id: "D-102", name: "Enterprise dashboard", account: "LogiTrack", owner: "Vikram Nair", value: "Rs 1,19,999", stage: "Proposal Sent", probability: 55, close: "24 Jun 2026" },
  { id: "D-103", name: "SaaS dashboard UI", account: "CloudStack", owner: "Dev Malhotra", value: "Rs 89,999", stage: "Qualified", probability: 48, close: "28 Jun 2026" },
  { id: "D-104", name: "E-commerce platform", account: "ShopNow", owner: "Aditya Roy", value: "Rs 49,999", stage: "Won", probability: 100, close: "12 Jun 2026" },
  ...dealSeed.slice(0, 2).map((lead, index) => ({
    id: `D-20${index + 1}`,
    name: lead.service,
    account: lead.company,
    owner: lead.name,
    value: lead.value.replace("₹", "Rs "),
    stage: "Qualified",
    probability: 44 + index * 8,
    close: "30 Jun 2026"
  }))
];

export function DealsPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const { records: dealRecords, save: saveDeal } = useCrmRecords("deals", dealsSeed);
  const { showToast } = useToast();
  const deals = dealRecords.filter((deal) => `${deal.name} ${deal.account} ${deal.owner}`.toLowerCase().includes(query.toLowerCase()));

  async function persistDeal(deal) {
    try {
      const isNew = !deal._id;
      await saveDeal({
        ...deal,
        id: deal.id || `D-${Date.now().toString().slice(-6)}`,
        probability: Number(deal.probability) || 0
      });
      setSelected(null);
      showToast({
        title: isNew ? "Deal created" : "Deal updated",
        message: `${deal.name || "Deal"} saved successfully.`,
      });
    } catch (error) {
      showToast({ type: "error", title: "Could not save deal", message: error.message });
    }
  }

  return (
    <PageShell title="Deals" subtitle="Track active opportunities from qualification through payment." action={<Button onClick={() => setSelected({ name: "", account: "", owner: "", value: "", stage: "Qualified", probability: 50, close: "" })}><Plus size={14} /> New Deal</Button>}>
      <Card>
        <div className="grid gap-3 border-b border-gray-100 p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <SearchBar value={query} onChange={setQuery} placeholder="Search deals, clients, owners" />
          <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-600 hover:bg-gray-50">
            <SlidersHorizontal size={14} />
            Pipeline filters
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px]">
            <thead>
              <tr className="bg-gray-50/80">
                {["Deal", "Account", "Owner", "Value", "Stage", "Probability", "Close", ""].map((header) => (
                  <th key={header} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr key={deal.id} className="border-t border-gray-100 hover:bg-gray-50/70">
                  <td className="px-5 py-3">
                    <p className="text-sm font-bold text-gray-950">{deal.name}</p>
                    <p className="font-mono text-[11px] text-gray-400">{deal.id}</p>
                  </td>
                  <td className="px-5 py-3 text-sm font-semibold text-gray-700">{deal.account}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2"><Avatar name={deal.owner} size="sm" /><span className="text-xs font-bold text-gray-700">{deal.owner}</span></div>
                  </td>
                  <td className="px-5 py-3 text-sm font-bold text-gray-950">{deal.value}</td>
                  <td className="px-5 py-3"><StatusBadge status={deal.stage} /></td>
                  <td className="px-5 py-3">
                    <div className="h-1.5 w-24 rounded-full bg-gray-100"><div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${deal.probability}%` }} /></div>
                    <p className="mt-1 text-[10px] font-bold text-gray-400">{deal.probability}%</p>
                  </td>
                  <td className="px-5 py-3 text-xs font-semibold text-gray-500">{deal.close}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => setSelected(deal)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-[#2563EB] hover:bg-blue-50"><Edit3 size={12} /> Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {selected && <EditDealModal deal={selected} onClose={() => setSelected(null)} onSave={persistDeal} />}
    </PageShell>
  );
}

function EditDealModal({ deal, onClose, onSave }) {
  const [form, setForm] = useState(deal);
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  return (
    <SidePanel
      title={deal.id ? "Edit deal" : "Create deal"}
      subtitle="Update deal owner, value, stage, probability, and closing timeline."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}><Save size={14} /> Save deal</Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Deal name" value={form.name} onChange={set("name")} />
        <Field label="Account" value={form.account} onChange={set("account")} />
        <Field label="Owner" value={form.owner} onChange={set("owner")} />
        <Field label="Value" value={form.value} onChange={set("value")} />
        <Field label="Stage" value={form.stage} onChange={set("stage")} />
        <Field label="Probability" type="number" value={form.probability} onChange={set("probability")} />
        <Field label="Close date" value={form.close} onChange={set("close")} />
      </div>
    </SidePanel>
  );
}

const taskRows = projects.flatMap((project) => [
  { id: `${project.id}-brief`, title: "Confirm scope and deliverables", project: project.name, owner: project.team[0], due: project.dueDate, status: project.status, priority: project.priority === "urgent" ? "High" : "Medium" },
  { id: `${project.id}-review`, title: "Client review checkpoint", project: project.name, owner: project.team[1] || project.team[0], due: project.dueDate, status: "Review", priority: project.priority === "urgent" ? "High" : "Low" },
]);

export function TasksPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const filtered = taskRows.filter((task) => `${task.title} ${task.project} ${task.status}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <PageShell title="Tasks" subtitle="Manage project actions, owners, due dates, and completion state." action={<Button onClick={() => setSelected({ title: "", project: "", owner: "", due: "", status: "Backlog", priority: "Medium" })}><Plus size={14} /> New Task</Button>}>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <div className="border-b border-gray-100 p-4"><SearchBar value={query} onChange={setQuery} placeholder="Search tasks or projects" /></div>
          <div className="divide-y divide-gray-100">
            {filtered.map((task) => (
              <div key={task.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/70">
                <button onClick={() => setSelected(task)} className="grid h-8 w-8 place-items-center rounded-lg border border-gray-200 text-gray-400 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"><CheckCircle2 size={15} /></button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-950">{task.title}</p>
                  <p className="truncate text-xs text-gray-400">{task.project} - {task.status}</p>
                </div>
                <span className="rounded-full bg-gray-50 px-2 py-1 text-[11px] font-bold text-gray-500">{task.priority}</span>
                <span className="w-24 text-xs font-semibold text-gray-500">{task.due}</span>
                <button onClick={() => setSelected(task)} className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-[#2563EB]"><Edit3 size={14} /></button>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-bold text-gray-950">Task health</h3>
          <div className="mt-4 space-y-3">
            {["High priority", "Due this week", "In review", "Completed today"].map((item, index) => (
              <div key={item} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-3">
                <span className="text-xs font-bold text-gray-600">{item}</span>
                <span className="text-sm font-bold text-gray-950">{[6, 14, 5, 3][index]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {selected && <TaskEditModal task={selected} onClose={() => setSelected(null)} />}
    </PageShell>
  );
}

function TaskEditModal({ task, onClose }) {
  const [form, setForm] = useState(task);
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  return (
    <SidePanel
      title={task.id ? "Edit task" : "Create task"}
      subtitle="Update task owner, date, status, and priority."
      onClose={onClose}
      footer={
        <div className="flex justify-between">
          <button className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"><Trash2 size={14} /> Delete</button>
          <div className="flex gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={onClose}><Save size={14} /> Save task</Button></div>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Task title" value={form.title} onChange={set("title")} />
        <Field label="Project" value={form.project} onChange={set("project")} />
        <Field label="Owner" value={form.owner} onChange={set("owner")} />
        <Field label="Due date" value={form.due} onChange={set("due")} />
        <Field label="Status" value={form.status} onChange={set("status")} />
        <Field label="Priority" value={form.priority} onChange={set("priority")} />
      </div>
    </SidePanel>
  );
}

const emailTemplates = [
  { name: "Payment success and portal invite", subject: "Your CRM portal is ready", status: "Active", sent: 34, type: "Transactional" },
  { name: "Forgot password OTP", subject: "Your password reset OTP", status: "Active", sent: 18, type: "Security" },
  { name: "Invoice generated", subject: "Invoice {{invoice_id}} from DataCircles", status: "Active", sent: 42, type: "Billing" },
  { name: "Project milestone update", subject: "{{project_name}} milestone completed", status: "Draft", sent: 9, type: "Delivery" },
];

export function EmailTemplatesPage() {
  const [selected, setSelected] = useState(emailTemplates[0]);
  return (
    <PageShell title="Email Templates" subtitle="Edit transactional emails used by OTP, invoice, payment, and portal workflows." action={<Button onClick={() => setSelected({ name: "New template", subject: "", status: "Draft", sent: 0, type: "Custom" })}><Plus size={14} /> New Template</Button>}>
      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="divide-y divide-gray-100">
          {emailTemplates.map((template) => (
            <button key={template.name} onClick={() => setSelected(template)} className={`block w-full p-4 text-left hover:bg-gray-50 ${selected.name === template.name ? "bg-blue-50/60" : ""}`}>
              <div className="flex items-center justify-between"><p className="text-sm font-bold text-gray-950">{template.name}</p><Mail size={15} className="text-gray-300" /></div>
              <p className="mt-1 truncate text-xs text-gray-500">{template.subject}</p>
            </button>
          ))}
        </Card>
        <TemplateEditor template={selected} channel="email" />
      </div>
    </PageShell>
  );
}

const whatsappTemplates = [
  { name: "Payment received", subject: "Payment confirmed. Portal email has been sent.", status: "Active", sent: 25, type: "Billing" },
  { name: "Kickoff reminder", subject: "Your kickoff call is scheduled for {{date}}.", status: "Active", sent: 16, type: "Delivery" },
  { name: "Document required", subject: "Please share pending documents for {{project_name}}.", status: "Draft", sent: 8, type: "Support" },
];

export function WhatsAppPage() {
  const [selected, setSelected] = useState(whatsappTemplates[0]);
  return (
    <PageShell title="WhatsApp" subtitle="Manage approved message templates for client updates and support follow-ups." action={<Button onClick={() => setSelected({ name: "New WhatsApp template", subject: "", status: "Draft", sent: 0, type: "Custom" })}><Plus size={14} /> New Template</Button>}>
      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="divide-y divide-gray-100">
          {whatsappTemplates.map((template) => (
            <button key={template.name} onClick={() => setSelected(template)} className={`block w-full p-4 text-left hover:bg-gray-50 ${selected.name === template.name ? "bg-emerald-50/60" : ""}`}>
              <div className="flex items-center justify-between"><p className="text-sm font-bold text-gray-950">{template.name}</p><MessageSquare size={15} className="text-gray-300" /></div>
              <p className="mt-1 truncate text-xs text-gray-500">{template.subject}</p>
            </button>
          ))}
        </Card>
        <TemplateEditor template={selected} channel="whatsapp" />
      </div>
    </PageShell>
  );
}

function TemplateEditor({ template, channel }) {
  const [subject, setSubject] = useState(template.subject);
  return (
    <Card>
      <div className="flex items-center justify-between border-b border-gray-100 p-4">
        <div>
          <h3 className="text-sm font-bold text-gray-950">{template.name}</h3>
          <p className="text-xs text-gray-400">{template.type} - {template.sent} sends</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex h-9 items-center gap-2 rounded-xl border border-gray-200 px-3 text-xs font-bold text-gray-600 hover:bg-gray-50"><Eye size={14} /> Preview</button>
          <Button><Save size={14} /> Save</Button>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <Field label={channel === "email" ? "Subject" : "Message title"} value={subject} onChange={setSubject} />
        <label className="block">
          <span className="text-xs font-bold text-gray-600">Body</span>
          <textarea className="mt-1.5 min-h-56 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" defaultValue={`Hello {{customer_name}},\n\n${template.subject}\n\nRegards,\nDataCircles Team`} />
        </label>
        <div className="flex flex-wrap gap-2">
          {["{{customer_name}}", "{{project_name}}", "{{invoice_id}}", "{{portal_link}}", "{{otp}}"].map((tag) => (
            <button key={tag} className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-bold text-gray-500"><Tag size={11} /> {tag}</button>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function ReportsPage() {
  const totalInvoices = invoices.length;
  const paidOrders = orders.filter((order) => order.status === "Paid").length;
  return (
    <PageShell title="Reports" subtitle="Review revenue, conversion, delivery, and client onboarding metrics." action={<Button><FileText size={14} /> Export Report</Button>}>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Paid orders", paidOrders, TrendingUp],
          ["Invoices", totalInvoices, FileText],
          ["Active projects", projects.length, Workflow],
          ["Templates sent", 94, Send],
        ].map(([label, value, Icon]) => (
          <Card key={label} className="p-4">
            <Icon size={18} className="text-[#2563EB]" />
            <p className="mt-4 text-2xl font-bold text-gray-950">{value}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
          </Card>
        ))}
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <h3 className="text-sm font-bold text-gray-950">Conversion summary</h3>
          <div className="mt-5 space-y-4">
            {["Lead to qualified", "Proposal to payment", "Payment to portal login", "Project on-time delivery"].map((label, index) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-xs font-bold"><span className="text-gray-600">{label}</span><span className="text-gray-400">{[64, 48, 82, 71][index]}%</span></div>
                <div className="h-2 rounded-full bg-gray-100"><div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${[64, 48, 82, 71][index]}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-bold text-gray-950">Next report actions</h3>
          <div className="mt-4 space-y-3">
            {["Send weekly sales digest", "Export GST invoice register", "Review overdue project risks", "Audit failed payment attempts"].map((item) => (
              <button key={item} className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-3 text-left text-xs font-bold text-gray-600 hover:bg-white">
                {item}
                <MoreHorizontal size={14} className="text-gray-300" />
              </button>
            ))}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

export function SettingsPage() {
  const sections = [
    { title: "Authentication", description: "JWT session lifetime, role access, password reset OTP.", icon: ShieldCheck },
    { title: "Payment gateway", description: "Razorpay keys, invoice numbering, portal invite trigger.", icon: SlidersHorizontal },
    { title: "Email SMTP", description: "Gmail app password, sender identity, delivery status.", icon: Mail },
    { title: "Team roles", description: "SuperAdmin users, client portal users, disabled accounts.", icon: UserPlus },
  ];
  return (
    <PageShell title="Settings" subtitle="Configure core CRM, payment, authentication, and communication settings." action={<Button><Save size={14} /> Save Changes</Button>}>
      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="divide-y divide-gray-100">
          {sections.map((section) => (
            <button key={section.title} className="flex w-full items-start gap-3 p-4 text-left hover:bg-gray-50">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-[#2563EB]"><section.icon size={16} /></div>
              <div>
                <p className="text-sm font-bold text-gray-950">{section.title}</p>
                <p className="mt-1 text-xs leading-5 text-gray-500">{section.description}</p>
              </div>
            </button>
          ))}
        </Card>
        <Card className="p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gray-950 text-white"><SettingsIcon size={17} /></div>
            <div>
              <h3 className="text-sm font-bold text-gray-950">Workspace configuration</h3>
              <p className="text-xs text-gray-400">These values should map to your server environment.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="CRM public URL" value="http://localhost:5173" onChange={() => {}} />
            <Field label="API base URL" value="http://localhost:5000" onChange={() => {}} />
            <Field label="Invite link expiry" value="48 hours" onChange={() => {}} />
            <Field label="OTP expiry" value="10 minutes" onChange={() => {}} />
            <Field label="Default sender" value="DataCircles CRM" onChange={() => {}} />
            <Field label="Default role after payment" value="user" onChange={() => {}} />
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
