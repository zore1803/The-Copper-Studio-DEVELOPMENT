import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownRight, ArrowUpRight, BarChart2, BriefcaseBusiness,
  IndianRupee, TrendingUp,
  Clock3, CheckCircle2,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useCrmRecords } from "../hooks/useCrmRecords";

function parseCurrency(v) {
  return Number(String(v).replace(/[^\d.-]/g, "")) || 0;
}
function formatINR(v) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v || 0);
}
function formatCompact(v) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", notation: "compact", maximumFractionDigits: 1 }).format(v || 0);
}
function invoiceStatus(invoice) {
  const status = invoice.status || invoice.paymentStatus || "Pending";
  if (/paid|success/i.test(status)) return "Paid";
  if (/fail|cancel/i.test(status)) return "Failed";
  if (/overdue/i.test(status)) return "Overdue";
  return "Pending";
}
function invoiceAmount(invoice) {
  return parseCurrency(invoice.total ?? invoice.amount ?? invoice.finalAmount ?? invoice.value);
}
function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function pctChange(curr, prev) {
  if (prev > 0) return Math.round(((curr - prev) / prev) * 100);
  return curr > 0 ? 100 : 0;
}
function recordDate(record, now) {
  const raw = record.date || record.createdAt || record.paidAt;
  const parsed = raw ? new Date(raw) : now;
  return Number.isNaN(parsed.getTime()) ? now : parsed;
}
function isProjectPaid(project) {
  return String(project.paymentStatus || "").toLowerCase() === "paid";
}
function projectAsRevenueRecord(project) {
  return {
    amount: project.finalAmount ?? project.budget,
    date: project.paidAt || project.startDate || project.createdAt,
    status: "Paid",
    package: project.packageName || project.package,
  };
}

function DashboardTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-xs shadow-lg shadow-gray-200/60">
      {label && <p className="mb-1 font-bold text-[#6b7280]">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2 font-semibold text-[#111827]">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: entry.color }} />
          {entry.name}: {formatINR(entry.value)}
        </p>
      ))}
    </div>
  );
}

const TONE_STYLES = {
  brown: { tint: "bg-[#fff1ec]", text: "text-[#C55418]", bar: "bg-[#C55418]" },
  slate: { tint: "bg-[#eef2ff]", text: "text-[#4338ca]", bar: "bg-[#4338ca]" },
  emerald: { tint: "bg-emerald-50", text: "text-emerald-600", bar: "bg-emerald-500" },
  amber: { tint: "bg-amber-50", text: "text-amber-600", bar: "bg-amber-500" },
};

function KpiCard({ label, value, change, up, icon: Icon, tone = "brown" }) {
  const styles = TONE_STYLES[tone] || TONE_STYLES.brown;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-2xl font-bold text-[#111827]">{value}</p>
        </div>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${styles.tint}`}>
          <Icon size={19} className={styles.text} />
        </div>
      </div>
      {change != null && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
            {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {change}%
          </span>
          <span className="text-[11px] text-[#9ca3af]">vs last week</span>
        </div>
      )}
      <div className={`absolute inset-x-0 bottom-0 h-1 scale-x-0 ${styles.bar} transition-transform duration-300 group-hover:scale-x-100`} />
    </div>
  );
}

function SalesRevenueChart({ data }) {
  const totalVal = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="px-6 py-4 border-b border-[#f3f4f6] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#111827]">Sales Revenue</h3>
          <p className="text-xs text-[#9ca3af] mt-0.5">Trailing {data.length} month{data.length === 1 ? "" : "s"}</p>
        </div>
        <span className="rounded-full bg-[#fff1ec] px-3 py-1 text-xs font-bold text-[#C55418]">{formatCompact(totalVal)}</span>
      </div>
      <div className="h-72 px-2 py-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesRevenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C55418" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#C55418" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={formatCompact} width={64} />
            <Tooltip content={<DashboardTooltip />} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#C55418" strokeWidth={2.5} fill="url(#salesRevenueFill)" activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
function InvoicesCard({ records }) {
  const now = useMemo(() => new Date(), []);
  const paid = records.filter(r => r.status === "Paid");
  const totalRevenue = paid.reduce((sum, r) => sum + parseCurrency(r.amount), 0);
  const pctCleared = Math.round((paid.length / Math.max(records.length, 1)) * 100);
  const byPkg = records.reduce((acc, r) => {
    acc[r.package] = (acc[r.package] || 0) + parseCurrency(r.amount);
    return acc;
  }, {});
  const topPackages = Object.entries(byPkg).slice(0, 2);
  const maxPkg = Math.max(...Object.values(byPkg), 1);

  const trend = useMemo(() => {
    const months = {};
    for (const record of records) {
      const date = recordDate(record, now);
      const sortKey = date.getFullYear() * 12 + date.getMonth();
      const monthLabel = date.toLocaleDateString("en-IN", { month: "short" });
      if (!months[sortKey]) months[sortKey] = { month: monthLabel, revenue: 0, sortKey };
      months[sortKey].revenue += parseCurrency(record.amount);
    }
    return Object.values(months).sort((a, b) => a.sortKey - b.sortKey).slice(-7);
  }, [records, now]);

  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <p className="text-xs text-[#6b7280] font-medium mb-1">Total Revenue from Projects</p>
      <p className="text-xl font-bold text-[#111827]">{formatINR(totalRevenue)}</p>
      <p className="text-xs text-[#6b7280] mt-0.5">{pctCleared}% projects paid</p>
      <div className="mt-4 space-y-2">
        {topPackages.map(([pkg, amt]) => (
          <div key={pkg}>
            <div className="flex justify-between text-xs text-[#6b7280] mb-1">
              <span className="truncate max-w-[120px]">{pkg}</span>
              <span className="font-semibold text-[#111827]">{formatCompact(amt)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#f3f4f6] overflow-hidden">
              <div className="h-full rounded-full bg-[#C55418]" style={{ width: `${Math.round((amt / maxPkg) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 h-[90px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="invoicesTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C55418" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#C55418" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip content={<DashboardTooltip />} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#C55418" strokeWidth={1.75} fill="url(#invoicesTrendFill)" activeDot={{ r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-[#6b7280] mt-2">Revenue Trend</p>
    </div>
  );
}

function EarningsCard({ records }) {
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const [quarter, setQuarter] = useState("Q2");
  const fallbackDate = useMemo(() => new Date(), []);
  const qIndex = quarters.indexOf(quarter);
  const monthRows = useMemo(() => records.reduce((acc, record) => {
    const rawDate = record.date || record.createdAt || record.paidAt;
    const parsedDate = rawDate ? new Date(rawDate) : fallbackDate;
    const date = Number.isNaN(parsedDate.getTime()) ? fallbackDate : parsedDate;
    const monthIndex = date.getMonth();
    const month = date.toLocaleDateString("en-IN", { month: "short" });
    acc[monthIndex] = acc[monthIndex] || { month, revenue: 0 };
    acc[monthIndex].revenue += parseCurrency(record.amount ?? record.total ?? record.value);
    return acc;
  }, {}), [records, fallbackDate]);
  const revenue = Object.entries(monthRows)
    .filter(([monthIndex]) => Math.floor(Number(monthIndex) / 3) === qIndex)
    .map(([, row]) => row);
  const totalRevenue = revenue.reduce((sum, m) => sum + m.revenue, 0);
  const profit = Math.round(totalRevenue * 0.35);
  const prevRevenue = Object.entries(monthRows)
    .filter(([monthIndex]) => Math.floor(Number(monthIndex) / 3) === qIndex - 1)
    .reduce((s, [, row]) => s + row.revenue, 0);
  const growth = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;
  const maxR = Math.max(...revenue.map(m => m.revenue), 1);

  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <p className="text-sm font-bold text-[#111827] mb-1">{quarter} Earnings</p>
      <p className="text-xl font-bold text-[#111827]">{formatCompact(totalRevenue)}</p>
      <p className="text-xs text-[#6b7280]">{Math.abs(growth)}% {growth >= 0 ? "↑" : "↓"} from last quarter</p>
      {growth > 0 && <p className="text-xs font-semibold text-emerald-600 mt-1">Outperforming previous quarter</p>}
      <div className="mt-4 flex items-center gap-1">
        {quarters.map(q => (
          <button
            key={q}
            onClick={() => setQuarter(q)}
            className={`flex-1 py-1 text-xs font-semibold rounded-lg border transition-colors ${
              q === quarter ? "bg-[#C55418] text-white border-[#C55418]" : "border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb]"
            }`}
          >
            {q}
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-[#6b7280]">
        <div>
          <p>Revenue</p>
          <p className="font-bold text-[#111827] text-sm">{formatCompact(totalRevenue)}</p>
        </div>
        <div>
          <p>Profit (est.)</p>
          <p className="font-bold text-[#111827] text-sm">{formatCompact(profit)}</p>
        </div>
      </div>
      <div className="mt-4 flex items-end gap-1 h-12">
        {revenue.map((m, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-[#C55418]/80"
              style={{ height: `${Math.round((m.revenue / maxR) * 40)}px` }}
            />
            <span className="text-[9px] text-[#9ca3af]">{m.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CrmTab({ companies, contacts }) {
  const navigate = useNavigate();
  const recentCompanies = companies.slice(0, 8);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-xl font-bold text-[#111827]">{companies.length}</p>
          <p className="text-xs font-semibold text-[#6b7280] mt-1">Companies</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-xl font-bold text-[#111827]">{contacts.length}</p>
          <p className="text-xs font-semibold text-[#6b7280] mt-1">Contacts</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f3f4f6] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#111827]">Recent Companies</h3>
          <button onClick={() => navigate("/admin/companies")} className="text-xs font-semibold text-[#C55418] hover:underline">View all →</button>
        </div>
        {recentCompanies.length === 0 ? (
          <p className="p-5 text-sm text-[#9ca3af]">No companies added yet.</p>
        ) : (
          <table className="min-w-full text-xs">
            <thead className="bg-[#fff1ec] border-b border-[#f3e5e0]">
              <tr>
                {["Name", "Industry", "Status"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-[#525866]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentCompanies.map((company) => (
                <tr
                  key={company.id || company._id}
                  onClick={() => navigate(`/admin/companies/${company.id || company._id}`)}
                  className="border-b border-[#f9fafb] hover:bg-[#fafafa] cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3 font-semibold text-[#111827]">{company.name}</td>
                  <td className="px-5 py-3 text-[#374151]">{company.industry || "—"}</td>
                  <td className="px-5 py-3 text-[#6b7280]">{company.status || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function InvoicesTab({ invoices }) {
  const summary = {
    total: invoices.reduce((sum, invoice) => sum + invoiceAmount(invoice), 0),
    paid: invoices.filter((invoice) => invoiceStatus(invoice) === "Paid").reduce((sum, invoice) => sum + invoiceAmount(invoice), 0),
    pending: invoices.filter((invoice) => invoiceStatus(invoice) === "Pending").reduce((sum, invoice) => sum + invoiceAmount(invoice), 0),
    failed: invoices.filter((invoice) => ["Failed", "Overdue"].includes(invoiceStatus(invoice))).reduce((sum, invoice) => sum + invoiceAmount(invoice), 0),
  };
  const statusColor = {
    Paid: "bg-emerald-50 text-emerald-700",
    Pending: "bg-amber-50 text-amber-700",
    Failed: "bg-red-50 text-red-600",
    Overdue: "bg-red-50 text-red-600",
  };
  const recentInvoices = invoices.slice(0, 12);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total Invoiced", value: formatINR(summary.total), iconBg: "bg-[#C55418]", icon: IndianRupee },
          { label: "Collected", value: formatINR(summary.paid), iconBg: "bg-emerald-600", icon: CheckCircle2 },
          { label: "Pending", value: formatINR(summary.pending), iconBg: "bg-amber-500", icon: Clock3 },
          { label: "Failed / Overdue", value: formatINR(summary.failed), iconBg: "bg-red-500", icon: ArrowDownRight },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-[#e5e7eb] p-5 flex items-start justify-between shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div>
              <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">{k.label}</p>
              <p className="text-lg font-bold text-[#111827]">{k.value}</p>
            </div>
            <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${k.iconBg}`}>
              <k.icon size={17} className="text-white" />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f3f4f6]">
          <h3 className="text-sm font-bold text-[#111827]">Recent Invoices</h3>
        </div>
        {recentInvoices.length ? (
          <table className="min-w-full">
            <thead className="bg-[#fff1ec] border-b border-[#f3e5e0]">
              <tr>
                {["Invoice", "Customer", "Package", "Amount", "Status", "Date"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-[#525866]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((invoice) => {
                const status = invoiceStatus(invoice);
                return (
                  <tr key={invoice._id || invoice.id || invoice.invoiceNumber} className="border-b border-[#f9fafb] hover:bg-[#fafafa] transition-colors">
                    <td className="px-5 py-3 text-xs font-mono text-[#6b7280]">{invoice.invoiceNumber || invoice.invoiceId || invoice.id || invoice._id}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-[#111827]">{invoice.company || invoice.client || invoice.customerEmail || "Not linked"}</td>
                    <td className="px-5 py-3 text-sm text-[#374151]">{invoice.package || invoice.project || "Not added"}</td>
                    <td className="px-5 py-3 text-sm font-bold text-[#111827]">{formatINR(invoiceAmount(invoice))}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusColor[status] || "bg-gray-100 text-gray-600"}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-[#374151]">{formatDate(invoice.issueDate || invoice.date || invoice.paidAt || invoice.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="p-5 text-sm text-[#9ca3af]">No invoices generated yet.</p>
        )}
      </div>
    </div>
  );
}

const TABS = ["Overview", "CRM", "Invoices"];

export default function Dashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("Overview");
  const now = useMemo(() => new Date(), []);
  const { records: projects } = useCrmRecords("projects");
  const { records: companies } = useCrmRecords("companies");
  const { records: contacts } = useCrmRecords("contacts");
  const { records: invoices } = useCrmRecords("invoices");

  const revenueRecords = useMemo(
    () => projects.filter(isProjectPaid).map(projectAsRevenueRecord),
    [projects]
  );

  const metrics = useMemo(() => {
    const paidRecords = revenueRecords.filter(r => r.status === "Paid");
    const totalRevenue = paidRecords.reduce((sum, r) => sum + parseCurrency(r.amount), 0);
    const activeProjects = projects.filter(p => p.clientStatus !== "completed" && p.progress < 100);
    const timeline = activeProjects.map(p => {
      const fallbackDue = new Date(now.getTime() + 86400000 * 30);
      const rawDue = p.dueDate || p.expectedEndDate;
      const parsedDue = rawDue ? new Date(rawDue) : fallbackDue;
      const due = Number.isNaN(parsedDue.getTime()) ? fallbackDue : parsedDue;
      return { ...p, daysLeft: Math.ceil((due - now) / 86400000) };
    });

    const weekMs = 7 * 86400000;
    const thisWeekStart = now.getTime() - weekMs;
    const lastWeekStart = now.getTime() - weekMs * 2;
    const isPaid = (r) => r.status === "Paid";
    const inRange = (record, start, end) => {
      const time = recordDate(record, now).getTime();
      return time >= start && time < end;
    };
    const thisWeekProjects = projects.filter((p) => inRange(p, thisWeekStart, now.getTime()));
    const lastWeekProjects = projects.filter((p) => inRange(p, lastWeekStart, thisWeekStart));
    const thisWeekRevenue = revenueRecords.filter((r) => inRange(r, thisWeekStart, now.getTime()));
    const lastWeekRevenue = revenueRecords.filter((r) => inRange(r, lastWeekStart, thisWeekStart));
    const revenueOf = (list) => list.filter(isPaid).reduce((sum, r) => sum + parseCurrency(r.amount), 0);
    const revenueChange = pctChange(revenueOf(thisWeekRevenue), revenueOf(lastWeekRevenue));
    const projectsChange = pctChange(thisWeekProjects.length, lastWeekProjects.length);

    return {
      totalRevenue,
      totalRevenueGenerated: Math.round(totalRevenue * 0.62),
      activeProjects: activeProjects.length,
      paidProjects: paidRecords.length,
      totalProjects: projects.length,
      revenueChange,
      projectsChange,
      priorityProjects: [...timeline].sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 4),
    };
  }, [projects, revenueRecords, now]);

  const chartData = useMemo(() => {
    const months = revenueRecords.reduce((acc, record) => {
      const rawDate = record.date || record.createdAt || record.paidAt;
      const parsedDate = rawDate ? new Date(rawDate) : now;
      const date = Number.isNaN(parsedDate.getTime()) ? now : parsedDate;
      const key = date.toLocaleDateString("en-IN", { month: "short" });
      acc[key] = acc[key] || { month: key, revenue: 0 };
      acc[key].revenue += parseCurrency(record.amount ?? record.total ?? record.value);
      return acc;
    }, {});
    const rows = Object.values(months);
    return rows.length ? rows.slice(-12) : [{ month: "No data", revenue: 0 }];
  }, [revenueRecords, now]);

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white border-b border-[#e5e7eb] px-6">
        <div className="flex items-center gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                tab === t ? "border-[#C55418] text-[#C55418]" : "border-transparent text-[#6b7280] hover:text-[#374151]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 space-y-5">
        {tab === "CRM" ? (
          <>
            <div>
              <h2 className="text-lg font-bold text-[#111827]">CRM Overview</h2>
              <p className="text-sm text-[#6b7280]">Lead pipeline, stage breakdown, and recent activity</p>
            </div>
            <CrmTab companies={companies} contacts={contacts} />
          </>
        ) : tab === "Invoices" ? (
          <>
            <div>
              <h2 className="text-lg font-bold text-[#111827]">Revenue & Invoices</h2>
              <p className="text-sm text-[#6b7280]">Generated invoices, payment status, and collected revenue</p>
            </div>
            <InvoicesTab invoices={invoices} />
          </>
        ) : (
          <>
            <div>
              <h2 className="text-lg font-bold text-[#111827]">Overview</h2>
              <p className="text-sm text-[#6b7280]">Visual summary of key metrics and project health</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <KpiCard label="Total Income" value={formatCompact(metrics.totalRevenue)} change={Math.abs(metrics.revenueChange)} up={metrics.revenueChange >= 0} icon={IndianRupee} tone="brown" />
              <KpiCard label="Revenue Generated" value={formatCompact(metrics.totalRevenueGenerated)} change={Math.abs(metrics.revenueChange)} up={metrics.revenueChange >= 0} icon={BarChart2} tone="slate" />
              <KpiCard label="Active Projects" value={metrics.activeProjects} icon={TrendingUp} tone="emerald" />
              <KpiCard label="Total Projects" value={metrics.totalProjects} change={Math.abs(metrics.projectsChange)} up={metrics.projectsChange >= 0} icon={BriefcaseBusiness} tone="amber" />
            </div>
            <SalesRevenueChart data={chartData} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <InvoicesCard records={revenueRecords} />
              <EarningsCard records={revenueRecords} />
            </div>
            <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#f3f4f6] flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#111827]">Priority Projects</h3>
                <button onClick={() => navigate("/admin/projects")} className="text-xs font-semibold text-[#C55418] hover:underline">View all →</button>
              </div>
              {metrics.priorityProjects.length === 0 ? (
                <p className="p-5 text-sm text-[#9ca3af]">No active projects.</p>
              ) : (
                <table className="min-w-full">
                  <thead className="bg-[#fff1ec] border-b border-[#f3e5e0]">
                    <tr>
                      {["Project", "Client", "Progress", "Due", "Status"].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-medium text-[#525866]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.priorityProjects.map((project) => {
                      const isAtRisk = project.daysLeft <= 3 && (project.progress || 0) < 80;
                      return (
                        <tr
                          key={project.id}
                          onClick={() => navigate(`/admin/companies/${project.companyId}/projects/${project.id}`)}
                          className="border-b border-[#f9fafb] hover:bg-[#fafafa] cursor-pointer transition-colors"
                        >
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-[#111827]">{project.name}</p>
                            <p className="text-xs text-[#9ca3af] mt-0.5">{project.currentPhase || project.status}</p>
                          </td>
                          <td className="px-5 py-4 text-sm text-[#374151]">{project.client}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="h-1.5 w-24 rounded-full bg-[#f3f4f6] overflow-hidden">
                                <div className="h-full rounded-full bg-[#C55418]" style={{ width: `${project.progress || 0}%` }} />
                              </div>
                              <span className="text-xs font-semibold text-[#374151]">{project.progress || 0}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-[#374151]">
                            {project.daysLeft <= 0 ? "Due now" : `${project.daysLeft}d`}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              isAtRisk ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                            }`}>
                              {isAtRisk ? "At Risk" : "On Track"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
