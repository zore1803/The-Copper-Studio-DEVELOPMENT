import { useMemo, useState } from "react";
import {
  Activity, Archive, BarChart2, CalendarClock, Copy, Mail, MessageCircle,
  Plus, Search, Send, Settings2
} from "lucide-react";
import { Button } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";

const EMAIL_CATEGORIES = [
  "Welcome", "Consultation Booked", "Proposal Sent", "Proposal Reminder",
  "Coupon Issued", "Payment Success", "Invoice Generated", "Project Started",
  "Project Update", "Testing Started", "Project Delivered", "Support Follow-up",
];

const WHATSAPP_CATEGORIES = [
  "OTP", "Proposal Sent", "Coupon Shared", "Payment Received", "Invoice Generated",
  "Project Started", "Milestone Completed", "Project Delivered", "Reminder",
];

const VARIABLES = [
  "client_name", "company_name", "proposal_id", "invoice_id",
  "coupon_code", "project_name", "project_status", "payment_amount",
];

function KpiCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff1ec] text-[#884c2d]">
          <Icon size={16} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">{label}</p>
          <p className="mt-0.5 text-lg font-bold text-[#111827]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, text, action }) {
  return (
    <div className="rounded-xl border border-dashed border-[#d8c2b9] bg-white p-10 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[#fff1ec] text-[#884c2d]">
        <MessageCircle size={20} />
      </div>
      <p className="text-sm font-semibold text-[#111827]">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-[#6b7280]">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function TemplateList({ type, records, categories }) {
  const [query, setQuery] = useState("");
  const filtered = records.filter((record) =>
    `${record.name || ""} ${record.category || ""} ${record.subject || ""}`.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
      <aside className="rounded-xl border border-[#e5e7eb] bg-white p-4">
        <p className="text-sm font-bold text-[#111827]">Categories</p>
        <div className="mt-3 space-y-1">
          {categories.map((category) => (
            <div key={category} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-[#374151] hover:bg-[#fafafa]">
              <span>{category}</span>
              <span className="text-xs text-[#9ca3af]">{records.filter((r) => r.category === category).length}</span>
            </div>
          ))}
        </div>
      </aside>

      <section className="rounded-xl border border-[#e5e7eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#f3f4f6] px-4 py-3">
          <div className="flex h-9 items-center gap-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3">
            <Search size={14} className="text-[#9ca3af]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${type} templates`} className="w-60 bg-transparent text-sm outline-none" />
          </div>
          <Button><Plus size={14} /> New Template</Button>
        </div>
        {filtered.length ? (
          <div className="divide-y divide-[#f3f4f6]">
            {filtered.map((template) => (
              <div key={template._id || template.id || template.name} className="p-4 hover:bg-[#fafafa]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-[#111827]">{template.name || "Untitled template"}</p>
                    <p className="mt-1 text-xs text-[#6b7280]">{template.category || "No category"} · {template.status || "Draft"}</p>
                    {template.subject && <p className="mt-2 text-sm text-[#374151]">{template.subject}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb]"><Copy size={13} /></button>
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb]"><Archive size={13} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={`No ${type} templates yet.`}
            text="Create templates with variables so proposal, coupon, payment, invoice, and project updates can be automated."
            action={<Button><Plus size={14} /> Create Template</Button>}
          />
        )}
      </section>

      <aside className="rounded-xl border border-[#e5e7eb] bg-white p-4">
        <p className="text-sm font-bold text-[#111827]">Variables</p>
        <p className="mt-1 text-xs text-[#6b7280]">Use these in templates for dynamic client communication.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {VARIABLES.map((variable) => (
            <span key={variable} className="rounded-lg bg-[#f3f4f6] px-2 py-1 font-mono text-xs text-[#374151]">{`{{${variable}}}`}</span>
          ))}
        </div>
        <div className="mt-5 rounded-xl bg-[#fff8f6] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#884c2d]">Preview Pattern</p>
          <p className="mt-2 text-sm text-[#374151]">Hello {"{{client_name}}"}, your {"{{proposal_id}}"} is ready for review.</p>
        </div>
      </aside>
    </div>
  );
}

function LogsView({ logs }) {
  const [query, setQuery] = useState("");
  const filtered = logs.filter((log) =>
    `${log.subject || ""} ${log.company || ""} ${log.type || ""} ${log.channel || ""}`.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-white">
      <div className="flex items-center justify-between border-b border-[#f3f4f6] px-4 py-3">
        <div>
          <p className="text-sm font-bold text-[#111827]">Communication Timeline</p>
          <p className="text-xs text-[#6b7280]">Central audit trail for emails, WhatsApp, replies, opens, clicks, and calls.</p>
        </div>
        <div className="flex h-9 items-center gap-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3">
          <Search size={14} className="text-[#9ca3af]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter logs" className="w-52 bg-transparent text-sm outline-none" />
        </div>
      </div>
      {filtered.length ? (
        <div className="divide-y divide-[#f3f4f6]">
          {filtered.map((log) => (
            <div key={log._id || log.id} className="grid gap-4 px-4 py-4 md:grid-cols-[140px_minmax(0,1fr)_140px]">
              <span className="text-xs font-semibold text-[#9ca3af]">{log.sentAt || log.createdAt || "No date"}</span>
              <div>
                <p className="text-sm font-bold text-[#111827]">{log.subject || log.type || "Communication event"}</p>
                <p className="mt-1 text-sm text-[#6b7280]">{log.content || `${log.channel || "Channel"} · ${log.status || "Status pending"}`}</p>
              </div>
              <span className="h-fit rounded-full bg-[#f3f4f6] px-2 py-1 text-center text-xs font-semibold text-[#374151]">{log.channel || "Log"}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No communication logs yet." text="Sent emails, WhatsApp events, client replies, opens, clicks, and calls will appear here." />
      )}
    </section>
  );
}

export default function CommunicationCenter({ mode = "email" }) {
  const { records: emailTemplates } = useCrmRecords("emailTemplates");
  const { records: whatsappTemplates } = useCrmRecords("whatsappTemplates");
  const { records: logs } = useCrmRecords("communicationLogs");
  const { records: scheduled } = useCrmRecords("scheduledMessages");
  const { records: campaigns } = useCrmRecords("campaigns");

  const stats = useMemo(() => ({
    emailsSent: logs.filter((l) => l.channel === "email").length,
    whatsappSent: logs.filter((l) => l.channel === "whatsapp").length,
    replies: logs.filter((l) => l.type === "Client Reply").length,
    conversions: logs.filter((l) => l.type === "Conversion").length,
  }), [logs]);

  const page = {
    email: { title: "Email Templates", subtitle: "Reusable email templates for proposals, payments, invoices, project updates, and support.", icon: Mail },
    whatsapp: { title: "WhatsApp Templates", subtitle: "Quick customer communication with Meta-ready template states and variables.", icon: MessageCircle },
    logs: { title: "Communication Logs", subtitle: "Complete communication audit trail across company, contact, lead, deal, and project.", icon: Activity },
    scheduled: { title: "Scheduled Messages", subtitle: "Automated proposal reminders, payment reminders, and project update schedules.", icon: CalendarClock },
    campaigns: { title: "Campaigns", subtitle: "Future growth campaigns for offers, service launches, and coupon campaigns.", icon: BarChart2 },
  }[mode];

  const PageIcon = page.icon;

  return (
    <div className="min-h-full bg-[#f5f6fa] p-6">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9ca3af]">Client Communication Center</p>
          <div className="mt-1 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fff1ec] text-[#884c2d]">
              <PageIcon size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#111827]">{page.title}</h1>
              <p className="mt-1 max-w-3xl text-sm text-[#6b7280]">{page.subtitle}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary"><Settings2 size={14} /> Variables</Button>
          <Button><Send size={14} /> Send Test</Button>
        </div>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <KpiCard label="Emails Sent" value={stats.emailsSent} icon={Mail} />
        <KpiCard label="Email Open Rate" value="0%" icon={BarChart2} />
        <KpiCard label="WhatsApp Sent" value={stats.whatsappSent} icon={MessageCircle} />
        <KpiCard label="WhatsApp Read Rate" value="0%" icon={BarChart2} />
        <KpiCard label="Replies" value={stats.replies} icon={Activity} />
        <KpiCard label="Conversions" value={stats.conversions} icon={Send} />
      </div>

      {mode === "email" && <TemplateList type="email" records={emailTemplates} categories={EMAIL_CATEGORIES} />}
      {mode === "whatsapp" && <TemplateList type="WhatsApp" records={whatsappTemplates} categories={WHATSAPP_CATEGORIES} />}
      {mode === "logs" && <LogsView logs={logs} />}
      {mode === "scheduled" && (
        scheduled.length ? <LogsView logs={scheduled} /> : <EmptyState title="No scheduled messages yet." text="Create workflows like proposal reminder after 3 days, payment reminder after 5 days, or weekly project updates." action={<Button><Plus size={14} /> New Schedule</Button>} />
      )}
      {mode === "campaigns" && (
        campaigns.length ? <LogsView logs={campaigns} /> : <EmptyState title="No campaigns yet." text="Campaigns will track emails sent, open rate, click rate, replies, and conversions for future growth offers." action={<Button><Plus size={14} /> New Campaign</Button>} />
      )}
    </div>
  );
}
