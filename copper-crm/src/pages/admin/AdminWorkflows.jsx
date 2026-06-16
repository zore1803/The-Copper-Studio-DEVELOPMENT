import { useState } from "react";
import {
  BellRing, Building2, CheckCircle2, CreditCard, Edit3, FileText,
  Globe2, LockKeyhole, Mail, MoreHorizontal, Plus, Save,
  Search, Send, Settings as SettingsIcon, SlidersHorizontal,
  Trash2, TrendingUp, UploadCloud, UserPlus, Workflow
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

function SettingsField({ label, value, onChange, type = "text", placeholder }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7b6f63]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-[#d8c2b9] bg-[#fffdfc] px-4 py-3 text-sm text-[#211a17] outline-none transition-all focus:border-[#884c2d] focus:ring-4 focus:ring-[#f3dfd7]"
      />
    </label>
  );
}

function SettingsSelect({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7b6f63]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-[#d8c2b9] bg-[#fffdfc] px-4 py-3 text-sm text-[#211a17] outline-none transition-all focus:border-[#884c2d] focus:ring-4 focus:ring-[#f3dfd7]"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function SettingsToggle({ title, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-[#ead8d1] bg-[#fffdfc] px-4 py-4">
      <div>
        <p className="text-sm font-semibold text-[#211a17]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[#6c6355]">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition-colors ${checked ? "bg-[#884c2d]" : "bg-[#d8c2b9]"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${checked ? "left-6" : "left-1"}`}
        />
      </button>
    </div>
  );
}

export function SettingsPage() {
  const { showToast } = useToast();
  const sections = [
    { key: "profile", title: "Profile", description: "Agency admin details and primary identity.", icon: UserPlus },
    { key: "password", title: "Password", description: "Reset rules, OTP window, and secure access.", icon: LockKeyhole },
    { key: "company", title: "Company Information", description: "Legal business details for billing and display.", icon: Building2 },
    { key: "billing", title: "Billing Settings", description: "Gateway, invoice defaults, and invite triggers.", icon: CreditCard },
    { key: "email", title: "Email Settings", description: "Sender identity, SMTP values, and onboarding mail flow.", icon: Mail },
    { key: "notifications", title: "Notification Settings", description: "Workspace alerts, reminders, and operational notices.", icon: BellRing },
  ];

  const [activeSection, setActiveSection] = useState("profile");
  const [profile, setProfile] = useState({
    fullName: "Rohit Kumar",
    email: "rohit@datacircles.in",
    title: "Super Admin",
    timezone: "Asia/Kolkata",
    publicUrl: "http://localhost:5173",
  });
  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    inviteExpiry: "48 hours",
    otpExpiry: "10 minutes",
  });
  const [company, setCompany] = useState({
    studioName: "The Copper Studio",
    legalName: "The Copper Studio Private Limited",
    gstin: "27ABCDE1234F1Z5",
    billingEmail: "accounts@datacircles.in",
    website: "https://thecopperstudio.com",
    billingAddress: "Mumbai, Maharashtra, India",
  });
  const [billing, setBilling] = useState({
    gateway: "Razorpay",
    apiBase: "http://localhost:5000",
    invoicePrefix: "INV",
    defaultRole: "user",
    autoInviteAfterPayment: true,
    allowCouponAtCheckout: true,
  });
  const [email, setEmail] = useState({
    senderName: "The Copper Studio",
    senderEmail: "hello@thecopperstudio.com",
    smtpHost: "smtp.gmail.com",
    smtpPort: "587",
    onboardingPath: "/client-secure-onboarding/access-setup",
  });
  const [notifications, setNotifications] = useState({
    paymentSuccess: true,
    failedPayments: true,
    portalInviteSent: true,
    overdueInvoices: true,
  });

  function saveSection(label) {
    showToast({
      title: `${label} updated`,
      message: "Your settings have been saved successfully.",
    });
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b6f63]">Workspace administration</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#211a17]">Account Settings</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c6355]">
            Manage admin identity, secure password flows, company billing details, mail delivery, and the post-payment onboarding pipeline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="lg">
            <Globe2 size={15} />
            Live workspace
          </Button>
          <Button size="lg" onClick={() => saveSection("Workspace")}>
            <Save size={15} />
            Save Changes
          </Button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[290px_minmax(0,1fr)]">
        <Card className="p-3 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
          {sections.map((section) => (
            <button
              key={section.key}
              type="button"
              onClick={() => setActiveSection(section.key)}
              className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left transition-colors ${
                activeSection === section.key ? "bg-[#fff1ec]" : "hover:bg-[#fff8f6]"
              }`}
            >
              <div className={`grid h-10 w-10 place-items-center rounded-2xl ${
                activeSection === section.key ? "bg-[#f3dfd7] text-[#884c2d]" : "bg-[#f5e6e1] text-[#6c6355]"
              }`}>
                <section.icon size={17} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#211a17]">{section.title}</p>
                <p className="mt-1 text-xs leading-5 text-[#6c6355]">{section.description}</p>
              </div>
            </button>
          ))}
        </Card>

        <Card className="p-6 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
          {activeSection === "profile" && (
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#211a17] text-white"><SettingsIcon size={18} /></div>
                <div>
                  <h3 className="text-lg font-semibold text-[#211a17]">Personal Profile</h3>
                  <p className="text-sm text-[#6c6355]">Update the primary super admin identity shown across the CRM.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsField label="Full Name" value={profile.fullName} onChange={(value) => setProfile((prev) => ({ ...prev, fullName: value }))} />
                <SettingsField label="Email Address" value={profile.email} onChange={(value) => setProfile((prev) => ({ ...prev, email: value }))} />
                <SettingsField label="Job Title" value={profile.title} onChange={(value) => setProfile((prev) => ({ ...prev, title: value }))} />
                <SettingsSelect label="Timezone" value={profile.timezone} onChange={(value) => setProfile((prev) => ({ ...prev, timezone: value }))} options={["Asia/Kolkata", "Europe/London", "America/New_York"]} />
                <div className="sm:col-span-2">
                  <SettingsField label="CRM Public URL" value={profile.publicUrl} onChange={(value) => setProfile((prev) => ({ ...prev, publicUrl: value }))} />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => saveSection("Profile")}><Save size={14} /> Save Profile</Button>
              </div>
            </div>
          )}

          {activeSection === "password" && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#211a17]">Password & Access</h3>
                <p className="mt-1 text-sm text-[#6c6355]">Control reset behavior, onboarding link life, and OTP validity.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsField label="Current Password" type="password" value={password.currentPassword} onChange={(value) => setPassword((prev) => ({ ...prev, currentPassword: value }))} />
                <SettingsField label="New Password" type="password" value={password.newPassword} onChange={(value) => setPassword((prev) => ({ ...prev, newPassword: value }))} />
                <SettingsField label="Confirm Password" type="password" value={password.confirmPassword} onChange={(value) => setPassword((prev) => ({ ...prev, confirmPassword: value }))} />
                <SettingsSelect label="Invite Link Expiry" value={password.inviteExpiry} onChange={(value) => setPassword((prev) => ({ ...prev, inviteExpiry: value }))} options={["24 hours", "48 hours", "72 hours"]} />
                <SettingsSelect label="OTP Expiry" value={password.otpExpiry} onChange={(value) => setPassword((prev) => ({ ...prev, otpExpiry: value }))} options={["5 minutes", "10 minutes", "15 minutes"]} />
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => saveSection("Password settings")}><Save size={14} /> Update Security</Button>
              </div>
            </div>
          )}

          {activeSection === "company" && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#211a17]">Company Information</h3>
                <p className="mt-1 text-sm text-[#6c6355]">Use these values for invoices, proposals, and client-facing mail content.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsField label="Studio Name" value={company.studioName} onChange={(value) => setCompany((prev) => ({ ...prev, studioName: value }))} />
                <SettingsField label="Legal Name" value={company.legalName} onChange={(value) => setCompany((prev) => ({ ...prev, legalName: value }))} />
                <SettingsField label="GSTIN" value={company.gstin} onChange={(value) => setCompany((prev) => ({ ...prev, gstin: value }))} />
                <SettingsField label="Billing Email" value={company.billingEmail} onChange={(value) => setCompany((prev) => ({ ...prev, billingEmail: value }))} />
                <SettingsField label="Website" value={company.website} onChange={(value) => setCompany((prev) => ({ ...prev, website: value }))} />
                <div className="sm:col-span-2">
                  <SettingsField label="Billing Address" value={company.billingAddress} onChange={(value) => setCompany((prev) => ({ ...prev, billingAddress: value }))} />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-[#d8c2b9] bg-[#fffdfc] px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f3dfd7] text-[#884c2d]"><UploadCloud size={18} /></div>
                  <div>
                    <p className="text-sm font-semibold text-[#211a17]">Logo Upload</p>
                    <p className="text-xs text-[#6c6355]">Update the brand logo used in the client portal and proposal PDF exports.</p>
                  </div>
                </div>
                <Button variant="secondary">Upload</Button>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => saveSection("Company information")}><Save size={14} /> Save Company</Button>
              </div>
            </div>
          )}

          {activeSection === "billing" && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#211a17]">Billing & Gateway Settings</h3>
                <p className="mt-1 text-sm text-[#6c6355]">Configure checkout behavior, invoice defaults, and automatic portal access after payment.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsSelect label="Payment Gateway" value={billing.gateway} onChange={(value) => setBilling((prev) => ({ ...prev, gateway: value }))} options={["Razorpay", "Stripe", "Manual"]} />
                <SettingsField label="API Base URL" value={billing.apiBase} onChange={(value) => setBilling((prev) => ({ ...prev, apiBase: value }))} />
                <SettingsField label="Invoice Prefix" value={billing.invoicePrefix} onChange={(value) => setBilling((prev) => ({ ...prev, invoicePrefix: value }))} />
                <SettingsSelect label="Default Role After Payment" value={billing.defaultRole} onChange={(value) => setBilling((prev) => ({ ...prev, defaultRole: value }))} options={["user", "superadmin"]} />
              </div>
              <div className="mt-6 space-y-3">
                <SettingsToggle
                  title="Auto-send portal invite after payment"
                  description="Once checkout is successful, send the secure password setup link to the client automatically."
                  checked={billing.autoInviteAfterPayment}
                  onChange={(value) => setBilling((prev) => ({ ...prev, autoInviteAfterPayment: value }))}
                />
                <SettingsToggle
                  title="Allow coupon codes during package checkout"
                  description="Keep coupon application visible as an optional field inside the pricing and checkout flow."
                  checked={billing.allowCouponAtCheckout}
                  onChange={(value) => setBilling((prev) => ({ ...prev, allowCouponAtCheckout: value }))}
                />
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => saveSection("Billing settings")}><Save size={14} /> Save Billing</Button>
              </div>
            </div>
          )}

          {activeSection === "email" && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#211a17]">Email Delivery Settings</h3>
                <p className="mt-1 text-sm text-[#6c6355]">Set the mail sender identity and the secure onboarding route used in invite messages.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsField label="Sender Name" value={email.senderName} onChange={(value) => setEmail((prev) => ({ ...prev, senderName: value }))} />
                <SettingsField label="Sender Email" value={email.senderEmail} onChange={(value) => setEmail((prev) => ({ ...prev, senderEmail: value }))} />
                <SettingsField label="SMTP Host" value={email.smtpHost} onChange={(value) => setEmail((prev) => ({ ...prev, smtpHost: value }))} />
                <SettingsField label="SMTP Port" value={email.smtpPort} onChange={(value) => setEmail((prev) => ({ ...prev, smtpPort: value }))} />
                <div className="sm:col-span-2">
                  <SettingsField label="Secure Onboarding Path" value={email.onboardingPath} onChange={(value) => setEmail((prev) => ({ ...prev, onboardingPath: value }))} />
                </div>
              </div>
              <div className="mt-6 rounded-2xl border border-[#ead8d1] bg-[#fffdfc] px-4 py-4">
                <p className="text-sm font-semibold text-[#211a17]">Current flow</p>
                <p className="mt-2 text-xs leading-6 text-[#6c6355]">
                  Paid checkout, then success confirmation, then secure invite mail, then unique password setup, then redirect to the shared login page.
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => saveSection("Email settings")}><Save size={14} /> Save Email</Button>
              </div>
            </div>
          )}

          {activeSection === "notifications" && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#211a17]">Notification Settings</h3>
                <p className="mt-1 text-sm text-[#6c6355]">Choose which operational events should surface inside the admin workspace.</p>
              </div>
              <div className="space-y-3">
                <SettingsToggle
                  title="Payment success alerts"
                  description="Show a confirmation toast and admin alert when a package payment is completed."
                  checked={notifications.paymentSuccess}
                  onChange={(value) => setNotifications((prev) => ({ ...prev, paymentSuccess: value }))}
                />
                <SettingsToggle
                  title="Failed payment alerts"
                  description="Flag payment failures so the team can follow up quickly."
                  checked={notifications.failedPayments}
                  onChange={(value) => setNotifications((prev) => ({ ...prev, failedPayments: value }))}
                />
                <SettingsToggle
                  title="Portal invite sent alerts"
                  description="Notify admins when the onboarding email has been dispatched successfully."
                  checked={notifications.portalInviteSent}
                  onChange={(value) => setNotifications((prev) => ({ ...prev, portalInviteSent: value }))}
                />
                <SettingsToggle
                  title="Overdue invoice alerts"
                  description="Surface aged or unpaid invoices in the finance workflow."
                  checked={notifications.overdueInvoices}
                  onChange={(value) => setNotifications((prev) => ({ ...prev, overdueInvoices: value }))}
                />
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => saveSection("Notification settings")}><Save size={14} /> Save Notifications</Button>
              </div>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
