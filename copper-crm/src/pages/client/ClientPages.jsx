import { useState } from "react";
import {
  CalendarDays, CheckCircle2, Clock3, CreditCard, Download, FileText,
  Headphones, KeyRound, Mail, Phone,
  Plus, Search, Share2, UserRound
} from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import { Button, SectionCard } from "../../components/ui";

const project = {
  id: "PRJ-1042",
  name: "Zara Retail App",
  company: "Zara India Pvt Ltd",
  client: "Rohit Zore",
  status: "In Progress",
  timelineStatus: "On Time",
  paymentStatus: "Completed",
  start: "12 Jun 2026",
  expected: "30 Jun 2026",
  actual: "-",
  package: "Growth Studio",
  notes: "Design handoff complete. Development sprint is active.",
};

const timeline = [
  ["Requirement gathering", "Completed", "12 Jun 2026"],
  ["Design approval", "Completed", "15 Jun 2026"],
  ["Development sprint", "In Progress", "18 Jun 2026"],
  ["Client review", "Pending", "24 Jun 2026"],
  ["Launch handover", "Pending", "30 Jun 2026"],
];

const invoices = [
  { id: "INV-2041", package: "Growth Studio", amount: "Rs 58,999", status: "Paid", date: "12 Jun 2026" },
  { id: "INV-2042", package: "Add-on Support", amount: "Rs 8,999", status: "Pending", date: "18 Jun 2026" },
];

const documents = [
  { name: "Project Proposal", type: "Proposal", scope: "Client Shared", uploaded: "12 Jun 2026" },
  { name: "Brand Assets", type: "Assets", scope: "Internal Docs", uploaded: "14 Jun 2026" },
  { name: "Invoice INV-2041", type: "Invoice", scope: "Client Shared", uploaded: "12 Jun 2026" },
];

function Page({ title, subtitle, children, action }) {
  return (
    <div className="p-5 xl:p-6">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">Client portal</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function SearchFilter({ value, onChange, placeholder }) {
  return (
    <div className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
      <Search size={14} className="text-gray-400" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" />
    </div>
  );
}

export function ClientTimelinePage() {
  return (
    <Page title="Project Timeline" subtitle="Track the current project stages, dates, payment state, notes, and history.">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead>
                <tr className="bg-gray-50/80">
                  {["Project ID", "Company + Client", "Status", "Timeline", "Payment", "Start", "Expected", "Actual", "Package", "Notes"].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-100">
                  {[project.id, `${project.company} / ${project.client}`, project.status, project.timelineStatus, project.paymentStatus, project.start, project.expected, project.actual, project.package, project.notes].map((item) => (
                    <td key={item} className="px-4 py-4 text-xs font-semibold text-gray-600">{item}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </SectionCard>
        <SectionCard>
          <div className="p-5">
            <h3 className="text-sm font-bold text-gray-950">Stage timeline</h3>
            <div className="mt-5 space-y-4">
              {timeline.map(([label, status, date]) => (
                <div key={label} className="flex gap-3">
                  <div className={`mt-1 h-3 w-3 rounded-full ${status === "Completed" ? "bg-emerald-500" : status === "In Progress" ? "bg-blue-500" : "bg-gray-200"}`} />
                  <div>
                    <p className="text-xs font-bold text-gray-800">{label}</p>
                    <p className="text-[11px] font-semibold text-gray-400">{status} - {date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>
    </Page>
  );
}

export function ClientBillingPage() {
  return (
    <Page title="Billing & History" subtitle="View payments, invoices, refunds, and package purchase history." action={<Button><Download size={14} /> Download Statement</Button>}>
      <SectionCard>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="bg-gray-50/80">
                {["Invoice", "Package", "Amount", "Status", "Date", "Action"].map((header) => (
                  <th key={header} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-gray-100">
                  <td className="px-5 py-4 font-mono text-xs font-bold text-gray-700">{invoice.id}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-700">{invoice.package}</td>
                  <td className="px-5 py-4 text-sm font-bold text-gray-950">{invoice.amount}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-2 py-1 text-[11px] font-bold ${invoice.status === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{invoice.status}</span></td>
                  <td className="px-5 py-4 text-xs font-semibold text-gray-500">{invoice.date}</td>
                  <td className="px-5 py-4"><button className="text-xs font-bold text-[#2563EB] hover:underline">View invoice</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </Page>
  );
}

export function ClientDocumentsPage() {
  const [query, setQuery] = useState("");
  const filtered = documents.filter((doc) => `${doc.name} ${doc.type} ${doc.scope}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <Page title="Documents" subtitle="Project-wise documents separated into internal and client shared files." action={<Button><Plus size={14} /> Request Document</Button>}>
      <SectionCard>
        <div className="border-b border-gray-100 p-4"><SearchFilter value={query} onChange={setQuery} placeholder="Search documents, type, scope" /></div>
        <div className="grid gap-4 p-4 md:grid-cols-3">
          {filtered.map((doc) => (
            <div key={doc.name} className="rounded-xl border border-gray-200 bg-white p-4">
              <FileText size={22} className="text-[#2563EB]" />
              <p className="mt-4 text-sm font-bold text-gray-950">{doc.name}</p>
              <p className="mt-1 text-xs text-gray-500">{doc.type} - {doc.scope}</p>
              <p className="mt-4 text-[11px] font-semibold text-gray-400">Uploaded {doc.uploaded}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </Page>
  );
}

export function ClientSettingsPage() {
  const auth = useAuth();
  return (
    <Page title="Settings" subtitle="Update profile, password recovery, referral details, and meeting requests.">
      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <SectionCard className="p-4">
          {[
            ["Update user profile", UserRound],
            ["Forgot password", KeyRound],
            ["Referral programme", Share2],
            ["Book a meeting", CalendarDays],
          ].map(([label, Icon]) => (
            <button key={label} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-[#2563EB]">
              <Icon size={16} />
              {label}
            </button>
          ))}
        </SectionCard>
        <SectionCard>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <label className="block"><span className="text-xs font-bold text-gray-600">Full name</span><input defaultValue={auth.user?.name || ""} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" /></label>
            <label className="block"><span className="text-xs font-bold text-gray-600">Email</span><input defaultValue={auth.user?.email || ""} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" /></label>
            <label className="block"><span className="text-xs font-bold text-gray-600">Phone</span><input defaultValue={auth.user?.phone || ""} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" /></label>
            <label className="block"><span className="text-xs font-bold text-gray-600">Company</span><input defaultValue={auth.user?.company || ""} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" /></label>
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-100 p-4">
            <Button variant="secondary"><Headphones size={14} /> Contact Support</Button>
            <Button><CheckCircle2 size={14} /> Save Profile</Button>
          </div>
        </SectionCard>
      </div>
    </Page>
  );
}

export function ClientSupportPage() {
  return (
    <Page title="Support" subtitle="Book a meeting or send a support request to the delivery team." action={<Button><CalendarDays size={14} /> Book a Meeting</Button>}>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Email support", "support@datacircles.in", Mail],
          ["Phone support", "+91 98765 43210", Phone],
          ["Meeting window", "Mon-Fri, 10 AM - 6 PM", Clock3],
        ].map(([title, value, Icon]) => (
          <SectionCard key={title} className="p-5">
            <Icon size={20} className="text-[#2563EB]" />
            <p className="mt-4 text-sm font-bold text-gray-950">{title}</p>
            <p className="mt-1 text-xs font-semibold text-gray-500">{value}</p>
          </SectionCard>
        ))}
      </div>
    </Page>
  );
}

export function ClientPurchasesPage() {
  return (
    <Page title="My Purchases" subtitle="Purchased package details and onboarding state.">
      <SectionCard className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-[#2563EB]"><CreditCard size={20} /></div>
            <div>
              <p className="text-sm font-bold text-gray-950">Growth Studio</p>
              <p className="text-xs text-gray-500">Purchased 12 Jun 2026 - Portal active</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Active</span>
        </div>
      </SectionCard>
    </Page>
  );
}
