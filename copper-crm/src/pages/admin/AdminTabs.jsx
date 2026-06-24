import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SidePanel from "../../components/SidePanel";
import {
  CalendarDays, Clock3, Copy, FileDown,
  Minus, PackageCheck, Plus, ReceiptText, Send,
  Tag, Users, WalletCards, Table2, Info, ChevronLeft, ChevronRight, Search, Banknote, AlertTriangle, Repeat, Trophy
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Pie, PieChart as RePieChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { Button } from "../../components/ui";
import { useToast } from "../../components/useToast";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { isEmail, isPhone, isFutureDate, isGstin, required as isRequired, isPositiveNumber } from "../../lib/validators";

function Card({ children, className = "" }) {
  return <section className={`rounded-xl border border-gray-200 bg-white shadow-sm shadow-gray-100/60 ${className}`}>{children}</section>;
}

function PageShell({ title, subtitle, action, children }) {
  return (
    <div className="p-5 xl:p-6">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">Admin</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder = "", type = "text", error = "", required = false, hint = "", inputMode, maxLength }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-gray-600">
        {label}{required && <span className="text-red-500"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={`mt-1.5 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-4 ${
          error
            ? "border-red-300 focus:border-red-400 focus:ring-red-50"
            : "border-gray-200 focus:border-[#cda88f] focus:ring-[#fff1ec]"
        }`}
      />
      {error
        ? <span className="mt-1 block text-[11px] font-semibold text-red-500">{error}</span>
        : hint
          ? <span className="mt-1 block text-[11px] text-gray-400">{hint}</span>
          : null}
    </label>
  );
}

function DateTimeField({ label, value, onChange }) {
  const [date = "", time = ""] = String(value || "").split("T");
  const update = (nextDate, nextTime) => onChange(`${nextDate || date}T${nextTime || time || "23:59"}`);

  return (
    <div className="block">
      <span className="text-xs font-bold text-gray-600">{label}</span>
      <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50">
          <CalendarDays size={15} className="shrink-0 text-gray-400" />
          <input
            type="date"
            value={date}
            onChange={(event) => update(event.target.value, time)}
            className="w-full bg-transparent outline-none"
          />
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50">
          <Clock3 size={15} className="shrink-0 text-gray-400" />
          <input
            type="time"
            step="900"
            value={time || "23:59"}
            onChange={(event) => update(date, event.target.value)}
            className="w-full bg-transparent outline-none"
          />
        </label>
      </div>
    </div>
  );
}

function toDateTimeLocal(date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
  const zoned = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return zoned.toISOString().slice(0, 16);
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true
  });
}

function safeFileName(value) {
  return String(value || "proposal").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function moneyValue(value) {
  return Number(String(value ?? "").replace(/[^\d.-]/g, "")) || 0;
}

function formatMoney(value) {
  return `Rs ${Math.round(value || 0).toLocaleString("en-IN")}`;
}

function formatMoneyCompact(value) {
  const amount = Math.round(value || 0);
  if (Math.abs(amount) >= 100000) return `Rs ${(amount / 100000).toFixed(1)}L`;
  if (Math.abs(amount) >= 1000) return `Rs ${(amount / 1000).toFixed(1)}k`;
  return `Rs ${amount}`;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg shadow-gray-200/60">
      {label && <p className="mb-1 font-bold text-gray-500">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2 font-semibold text-gray-800">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: entry.color || entry.payload?.color }} />
          {entry.name}: {typeof entry.value === "number" && entry.name === "Revenue" ? formatMoney(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

const ANALYTICS = {
  copper: "#884c2d",
  copperLight: "#c98a63",
  green: "#10b981",
  amber: "#f59e0b",
  grid: "#f0e6e1",
};

function isPaidStatus(status) {
  return ["paid", "completed", "success", "received"].includes(String(status || "").toLowerCase());
}

function isDoneStatus(status) {
  return ["completed", "delivered"].includes(String(status || "").toLowerCase());
}

function EarningsCard({ records, filterType, filterYear, filterMonth, filterBiMonth, filterQuarter }) {
  const currentYear = new Date().getFullYear();
  const [localYear, setLocalYear] = useState(null);
  
  let year = localYear !== null ? localYear : (filterType === "All Time" ? currentYear : filterYear);
  
  const [localQuarter, setLocalQuarter] = useState(null);
  
  let defaultQIndex = 3; // Default to Q4
  if (filterType === "Quarterly") defaultQIndex = filterQuarter;
  else if (filterType === "Monthly") defaultQIndex = Math.floor(filterMonth / 3);
  else if (filterType === "Bi-Monthly") defaultQIndex = Math.floor((filterBiMonth * 2) / 3);
  
  let qIndex = localQuarter !== null ? localQuarter : defaultQIndex;
  
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const quarter = quarters[qIndex];
  
  const fallbackDate = useMemo(() => new Date(), []);

  const yearRecords = useMemo(() => {
    return records.filter(record => {
      const stamp = record.paidAt || record.date || record.generatedAt || record.createdAt;
      const d = stamp ? new Date(stamp) : fallbackDate;
      const parsed = Number.isNaN(d.getTime()) ? fallbackDate : d;
      return parsed.getFullYear() === year;
    });
  }, [records, year, fallbackDate]);

  const monthRows = useMemo(() => {
    const acc = {};
    for(let i=0; i<12; i++) {
        const tempD = new Date(year, i, 1);
        acc[i] = { month: tempD.toLocaleDateString("en-IN", { month: "short" }), revenue: 0 };
    }
    yearRecords.forEach((record) => {
      const rawDate = record.paidAt || record.date || record.generatedAt || record.createdAt;
      const parsedDate = rawDate ? new Date(rawDate) : fallbackDate;
      const date = Number.isNaN(parsedDate.getTime()) ? fallbackDate : parsedDate;
      const monthIndex = date.getMonth();
      acc[monthIndex].revenue += moneyValue(record.amount ?? record.total ?? record.value ?? record.package?.total);
    });
    return acc;
  }, [yearRecords, year, fallbackDate]);

  const revenue = Object.entries(monthRows)
    .filter(([monthIndex]) => Math.floor(Number(monthIndex) / 3) === qIndex)
    .map(([, row]) => row);
  const totalRevenue = revenue.reduce((sum, m) => sum + m.revenue, 0);
  const profit = Math.round(totalRevenue * 0.35);

  const prevRevenue = Object.entries(monthRows)
    .filter(([monthIndex]) => Math.floor(Number(monthIndex) / 3) === qIndex - 1)
    .reduce((s, [, row]) => s + row.revenue, 0);
  const growth = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : (totalRevenue > 0 ? 100 : 0);
  const maxR = Math.max(...revenue.map(m => m.revenue), 1);

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <select 
          value={qIndex}
          onChange={(e) => setLocalQuarter(Number(e.target.value))}
          className="text-sm font-bold text-gray-950 bg-transparent outline-none cursor-pointer hover:bg-gray-50 rounded"
        >
          <option value={0}>Q1 Earnings</option>
          <option value={1}>Q2 Earnings</option>
          <option value={2}>Q3 Earnings</option>
          <option value={3}>Q4 Earnings</option>
        </select>
        <select 
          value={year}
          onChange={(e) => setLocalYear(Number(e.target.value))}
          className="h-8 rounded-lg border border-gray-200 bg-gray-50 px-2 flex items-center text-xs font-bold text-gray-600 outline-none cursor-pointer hover:bg-gray-100"
        >
          {[currentYear - 3, currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      <div className="p-5">
        <p className="text-xl font-bold text-gray-950">{formatMoneyCompact(totalRevenue)}</p>
        <p className="text-xs text-gray-500">{Math.abs(growth)}% {growth >= 0 ? "↑" : "↓"} from last quarter</p>
        {growth > 0 && <p className="text-xs font-semibold text-[#10b981] mt-1">Outperforming previous quarter</p>}
        
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-500 border-t border-gray-100 pt-4">
          <div>
            <p>Revenue</p>
            <p className="font-bold text-gray-950 text-sm">{formatMoneyCompact(totalRevenue)}</p>
          </div>
          <div>
            <p>Profit (est.)</p>
            <p className="font-bold text-gray-950 text-sm">{formatMoneyCompact(profit)}</p>
          </div>
        </div>
        <div className="mt-4 flex items-end gap-1 h-12">
          {revenue.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-[#884c2d]/80 transition-all duration-300"
                style={{ height: `${Math.max(Math.round((m.revenue / maxR) * 40), m.revenue > 0 ? 2 : 0)}px` }}
              />
              <span className="text-[9px] text-gray-400">{m.month}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function ChartDrillDownPanel({ data, onClose, navigate }) {
  if (!data) return null;
  const { date, orders = [], payments = [], projects = [], users = [] } = data;
  const moneyValue = (val) => {
    if (val === null || val === undefined) return 0;
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  };

  const safeString = (val, fallback = "") => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  return (
    <SidePanel title={`Analytics Detail`} subtitle={`Records for ${safeString(date)}`} onClose={onClose} width="max-w-2xl">
      <div className="space-y-6">
        {orders.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Orders ({orders.length})</h3>
            <div className="flex flex-col gap-2">
              {orders.map((o, i) => (
                <div key={o._id || o.id || i} onClick={() => navigate(`/admin/companies/${o.companyId || o.customer?.companyId || o.client || ''}`)} className="cursor-pointer p-3 border border-gray-200 rounded-lg hover:border-[#cda88f] hover:shadow-sm bg-white transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-gray-800">{safeString(o.customer?.customerName || o.client || o.companyName || "Unknown Client")}</p>
                      <p className="text-xs text-gray-500">{safeString(o.customer?.customerEmail || o.contactName || o.email)}</p>
                      <p className="text-xs text-[#884c2d] mt-1 font-medium">Package: {safeString(o.package?.name || o.packageId || o.projectType || "Custom")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">Rs {moneyValue(o.amount ?? o.package?.total ?? o.total).toLocaleString("en-IN")}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-bold uppercase tracking-wider ${safeString(o.status) === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{safeString(o.status)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {payments.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Payments ({payments.length})</h3>
            <div className="flex flex-col gap-2">
              {payments.map((p, i) => (
                <div key={p._id || p.id || i} onClick={() => navigate('/admin/payments')} className="cursor-pointer p-3 border border-gray-200 rounded-lg hover:border-[#cda88f] hover:shadow-sm bg-white transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-gray-800">{safeString(p.companyName || p.clientName || p.client || "Unknown Client")}</p>
                      <p className="text-xs text-gray-500">ID: {safeString(p._id || p.id)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">Rs {moneyValue(p.amount ?? p.value).toLocaleString("en-IN")}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-bold uppercase tracking-wider ${safeString(p.status) === "paid" || safeString(p.status) === "success" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{safeString(p.status)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {users.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Users Created ({users.length})</h3>
            <div className="flex flex-col gap-2">
              {users.map((u, i) => (
                <div key={u._id || u.id || i} onClick={() => navigate(`/admin/companies/${u._id || u.id}`)} className="cursor-pointer p-3 border border-gray-200 rounded-lg hover:border-[#cda88f] hover:shadow-sm bg-white transition-all">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-gray-800">{safeString(u.name || u.company || "Unknown")}</p>
                      <p className="text-xs text-gray-500">{safeString(u.email)}</p>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">CLIENT</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {projects.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Projects Created ({projects.length})</h3>
            <div className="flex flex-col gap-2">
              {projects.map((p, i) => (
                <div key={p._id || p.id || i} onClick={() => navigate(`/admin/companies/${p.companyId || p.client}/projects/${p._id || p.id}`)} className="cursor-pointer p-3 border border-gray-200 rounded-lg hover:border-[#cda88f] hover:shadow-sm bg-white transition-all">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-gray-800">{safeString(p.name || p.projectName || "Unknown Project")}</p>
                      <p className="text-xs text-gray-500">{safeString(p.companyName || p.clientName || "Unknown Client")}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded uppercase">{safeString(p.status || p.clientStatus || "active")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {orders.length === 0 && payments.length === 0 && users.length === 0 && projects.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            No detailed records found for this period.
          </div>
        )}
      </div>
    </SidePanel>
  );
}

function KpiDrillDownPanel({ kpi, data, onClose }) {
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  if (!kpi) return null;

  let content;

  if (kpi === "Pending Dues") {
    const pendingOrders = (data.filteredOrders || []).filter(o => !isPaidStatus(o.status));
    const pendingPayments = (data.filteredPayments || []).filter(p => !isPaidStatus(p.status));
    
    if (pendingOrders.length === 0 && pendingPayments.length === 0) {
      content = <div className="text-center py-10 text-gray-500">No pending dues for this period.</div>;
    } else {
      content = (
        <div className="flex flex-col gap-2">
          {pendingOrders.map((o, i) => (
            <div key={`o-${o._id || i}`} className="p-3 border border-gray-200 rounded-lg bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-gray-800">{String(o.customer?.customerCompany || o.company || "Unknown Company")}</p>
                  <p className="text-xs text-gray-500">{String(o.customer?.customerName || o.client || "Unknown Contact")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">Rs {moneyValue(o.amount ?? o.package?.total ?? o.total).toLocaleString("en-IN")}</p>
                  <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700">{String(o.status)}</span>
                </div>
              </div>
            </div>
          ))}
          {pendingPayments.map((p, i) => (
            <div key={`p-${p._id || i}`} className="p-3 border border-gray-200 rounded-lg bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-gray-800">{String(p.companyName || p.client || "Unknown Company")}</p>
                  <p className="text-xs text-gray-500">{String(p.clientName || "Unknown Contact")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">Rs {moneyValue(p.amount ?? p.value).toLocaleString("en-IN")}</p>
                  <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700">{String(p.status)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
  } else if (kpi === "Avg Completion Time") {
    const completedList = data.completedProjectsList || [];
    if (completedList.length === 0) {
      content = <div className="text-center py-10 text-gray-500">No completed projects found.</div>;
    } else {
      content = (
        <div className="flex flex-col gap-2">
          {completedList.map((p, i) => {
            const start = new Date(p.startDate || p.createdAt || now);
            const end = new Date(p.actualEndDate || p.expectedEndDate || p.updatedAt || now);
            const diffDays = Math.max(Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)), 0);
            return (
              <div key={`cp-${p._id || i}`} className="p-3 border border-gray-200 rounded-lg bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{String(p.name || p.projectName || "Unknown Project")}</p>
                    <p className="text-xs text-gray-500">{String(p.companyName || p.clientName || "Unknown Company")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{diffDays} Days</p>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-gray-400 flex justify-between">
                  <span>Start: {start.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                  <span>End: {end.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                </div>
              </div>
            );
          })}
        </div>
      );
    }
  } else if (kpi === "On-Time Delivery %") {
    const completedList = data.completedProjectsList || [];
    const onTimeProjects = [];
    const delayedProjects = [];
    completedList.forEach(p => {
      const end = new Date(p.updatedAt || p.date || now).getTime();
      const expected = new Date(p.expectedCompletion || p.dueDate || p.updatedAt || now).getTime();
      if (end <= expected) onTimeProjects.push(p);
      else delayedProjects.push(p);
    });

    content = (
      <div className="flex flex-col gap-5">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-green-600 mb-2">Delivered On Time ({onTimeProjects.length})</h4>
          <div className="flex flex-col gap-2">
            {onTimeProjects.length === 0 ? <p className="text-xs text-gray-400">None</p> : onTimeProjects.map((p, i) => (
              <div key={`on-${p._id || i}`} className="p-2 border border-green-100 bg-green-50 rounded-lg text-sm font-medium text-gray-800">
                {String(p.name || p.projectName || "Unknown Project")}
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-red-600 mb-2">Delayed ({delayedProjects.length})</h4>
          <div className="flex flex-col gap-2">
            {delayedProjects.length === 0 ? <p className="text-xs text-gray-400">None</p> : delayedProjects.map((p, i) => (
              <div key={`dl-${p._id || i}`} className="p-2 border border-red-100 bg-red-50 rounded-lg text-sm font-medium text-gray-800">
                {String(p.name || p.projectName || "Unknown Project")}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  } else {
    content = <div className="text-center py-10 text-gray-500">Drill down not available for this metric.</div>;
  }

  return (
    <SidePanel title={`${kpi} Drill Down`} onClose={onClose}>
      <div className="p-5 bg-gray-50 min-h-full">
        {content}
      </div>
    </SidePanel>
  );
}
export function AnalyticsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [selectedChartDate, setSelectedChartDate] = useState(null);
  const [filterType, setFilterType] = useState("All Time");
  const [metricFilter, setMetricFilter] = useState("All");
  const [selectedPackage, setSelectedPackage] = useState(null);
  
  // Table states
  const [projectPage, setProjectPage] = useState(1);
  const [projectSearch, setProjectSearch] = useState("");
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentSearch, setPaymentSearch] = useState("");

  const [now] = useState(() => Date.now());
  const currentD = new Date(now);
  const [filterYear, setFilterYear] = useState(currentD.getFullYear());
  const [filterMonth, setFilterMonth] = useState(currentD.getMonth());
  const [filterBiMonth, setFilterBiMonth] = useState(Math.floor(currentD.getMonth() / 2));
  const [filterQuarter, setFilterQuarter] = useState(Math.floor(currentD.getMonth() / 3));
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const { records: orders } = useCrmRecords("orders");
  const { records: payments } = useCrmRecords("payments");
  const { records: projects } = useCrmRecords("projects");
  const { records: companies } = useCrmRecords("companies");
  const { records: contacts } = useCrmRecords("contacts");
  const { records: tasks } = useCrmRecords("tasks");

  const [selectedKpiDrillDown, setSelectedKpiDrillDown] = useState(null);

  const data = useMemo(() => {
    let startDate = 0;
    let endDate = Infinity;

    if (filterType === "Monthly") {
      startDate = new Date(filterYear, filterMonth, 1).getTime();
      endDate = new Date(filterYear, filterMonth + 1, 0, 23, 59, 59, 999).getTime();
    } else if (filterType === "Bi-Monthly") {
      startDate = new Date(filterYear, filterBiMonth * 2, 1).getTime();
      endDate = new Date(filterYear, filterBiMonth * 2 + 2, 0, 23, 59, 59, 999).getTime();
    } else if (filterType === "Quarterly") {
      startDate = new Date(filterYear, filterQuarter * 3, 1).getTime();
      endDate = new Date(filterYear, filterQuarter * 3 + 3, 0, 23, 59, 59, 999).getTime();
    } else if (filterType === "Annually") {
      startDate = new Date(filterYear, 0, 1).getTime();
      endDate = new Date(filterYear, 11, 31, 23, 59, 59, 999).getTime();
    } else if (filterType === "Custom Range") {
      startDate = customStartDate ? new Date(customStartDate).setHours(0, 0, 0, 0) : 0;
      endDate = customEndDate ? new Date(customEndDate).setHours(23, 59, 59, 999) : Infinity;
    }

    const isWithinRange = (item, isCreated = false) => {
      const stamp = isCreated ? (item.createdAt || item.date) : (item.paidAt || item.date || item.generatedAt || item.createdAt);
      if (!stamp) return true;
      const t = new Date(stamp).getTime();
      return t >= startDate && t <= endDate;
    };

    const filteredOrders = orders.filter(i => isWithinRange(i, false));
    const filteredPayments = payments.filter(i => isWithinRange(i, false));
    const filteredProjects = projects.filter(i => isWithinRange(i, true));
    const filteredCompanies = companies.filter(i => isWithinRange(i, true));
    const filteredContacts = contacts.filter(i => isWithinRange(i, true));

    const paidOrders = filteredOrders.filter((order) => isPaidStatus(order.payment?.status || order.status));
    const paidPayments = filteredPayments.filter((payment) => isPaidStatus(payment.status));
    
    // KPI: Pending Dues (Only calculate from unpaid orders, avoid double counting payments)
    const pendingOrdersAmt = filteredOrders.filter(o => !isPaidStatus(o.payment?.status || o.status)).reduce((sum, o) => sum + moneyValue(o.amount ?? o.package?.total ?? o.total), 0);
    
    // Also include manually created projects that have a pending payment status and are NOT linked to an invoice or order (to prevent double counting)
    const pendingProjectsAmt = filteredProjects
      .filter(p => !p.linkedInvoiceId && !p.orderId && (p.paymentStatus === "Pending" || p.paymentStatus === "Partial" || p.paymentStatus === "Overdue"))
      .reduce((sum, p) => sum + moneyValue(p.finalAmount ?? p.budget ?? p.packageValue ?? 0), 0);

    const pendingDues = pendingOrdersAmt + pendingProjectsAmt;
    const pendingPaymentsCount = filteredOrders.filter(o => !isPaidStatus(o.payment?.status || o.status)).length + filteredProjects.filter(p => !p.linkedInvoiceId && !p.orderId && (p.paymentStatus === "Pending" || p.paymentStatus === "Partial" || p.paymentStatus === "Overdue")).length;

    // Revenue from manually created projects that are marked as paid and NOT linked to an invoice or order
    const paidProjectsAmt = filteredProjects
      .filter(p => !p.linkedInvoiceId && !p.orderId && isPaidStatus(p.paymentStatus))
      .reduce((sum, p) => sum + moneyValue(p.finalAmount ?? p.budget ?? p.packageValue ?? 0), 0);

    // KPI: Revenue (Calculate from paid payments and paid independent projects, avoid double counting orders)
    const revenue = paidPayments.reduce((sum, item) => sum + moneyValue(item.amount ?? item.value ?? item.package?.total ?? item.total), 0) + paidProjectsAmt;
    const paymentRate = Math.round((paidOrders.length / Math.max(filteredOrders.length, 1)) * 100);
    
    // KPI: Average Project Value
    const avgProjectValue = Math.round(revenue / Math.max(filteredProjects.length, 1));
    
    // KPI: Average Revenue Per Client
    const avgRevenuePerClient = Math.round(revenue / Math.max(filteredCompanies.length, 1));

    // KPI: Client Repeat Rate
    const projectCountsByClient = {};
    filteredProjects.forEach(p => {
      const clientId = p.companyId || p.companyName || p.client || "Unknown";
      projectCountsByClient[clientId] = (projectCountsByClient[clientId] || 0) + 1;
    });
    const repeatClients = Object.values(projectCountsByClient).filter(count => count > 1).length;
    const clientRepeatRate = filteredCompanies.length > 0 ? Math.round((repeatClients / filteredCompanies.length) * 100) : 0;

    // KPI: Most Valuable Client
    const revenueByClient = {};
    paidPayments.forEach(p => {
      const clientName = p.company || p.companyName || p.client || "Unknown";
      const amt = moneyValue(p.amount ?? p.value ?? p.package?.total ?? p.total);
      revenueByClient[clientName] = (revenueByClient[clientName] || 0) + amt;
    });
    let valuableClientName = "None";
    let valuableClientRevenue = 0;
    Object.entries(revenueByClient).forEach(([name, rev]) => {
      if (rev > valuableClientRevenue) {
        valuableClientRevenue = rev;
        valuableClientName = name;
      }
    });
    const valuableClientText = valuableClientRevenue > 0 ? `${valuableClientName} (${formatMoney(valuableClientRevenue)})` : "None";

    // KPI: Current Bottleneck
    const delayedTasksByStatus = {};
    tasks.forEach(task => {
      const isDone = task.status === "Completed" || task.status === "Done" || task.progress === 100;
      if (!isDone && task.deadline) {
        const deadlineTime = new Date(task.deadline).getTime();
        if (Number.isFinite(deadlineTime) && deadlineTime < now) {
          const s = task.status || "To Do";
          delayedTasksByStatus[s] = (delayedTasksByStatus[s] || 0) + 1;
        }
      }
    });
    let bottleneckStage = "None";
    let maxDelayed = 0;
    Object.entries(delayedTasksByStatus).forEach(([status, count]) => {
      if (count > maxDelayed) {
        maxDelayed = count;
        bottleneckStage = status;
      }
    });
    const bottleneckText = maxDelayed > 0 ? `${bottleneckStage} (${maxDelayed})` : "None";
    
    const completedProjectsList = filteredProjects.filter((project) => isDoneStatus(project.status || project.clientStatus));
    const completedProjects = completedProjectsList.length;
    
    const delayedProjectsList = filteredProjects.filter((project) => {
      const dueRaw = project.dueDate || project.expectedCompletion || project.expectedEndDate;
      const due = dueRaw ? new Date(dueRaw).getTime() : NaN;
      return Number.isFinite(due) && due < now && !isDoneStatus(project.status || project.clientStatus);
    });
    const delayedProjects = delayedProjectsList.length;
    
    const onTrack = Math.max(filteredProjects.length - completedProjects - delayedProjects, 0);

    // KPI: Avg Project Completion Time
    const totalCompletionDays = completedProjectsList.reduce((sum, p) => {
      const start = new Date(p.startDate || p.createdAt || now).getTime();
      const end = new Date(p.actualEndDate || p.expectedEndDate || p.updatedAt || now).getTime();
      const diffDays = Math.max((end - start) / (1000 * 60 * 60 * 24), 0);
      return sum + diffDays;
    }, 0);
    const avgCompletionTime = completedProjects > 0 ? Math.round(totalCompletionDays / completedProjects) : 0;

    // KPI: On-Time Delivery %
    const onTimeProjects = completedProjectsList.filter(p => {
      const end = new Date(p.actualEndDate || p.expectedEndDate || p.updatedAt || now).getTime();
      const start = new Date(p.startDate || p.createdAt || now).getTime();
      const expectedDateStr = p.expectedEndDate || p.expectedCompletion || p.dueDate;
      const expected = expectedDateStr ? new Date(expectedDateStr).getTime() : start + 45 * 24 * 60 * 60 * 1000;
      return end <= expected;
    }).length;
    const onTimeDeliveryPercent = completedProjects > 0 ? Math.round((onTimeProjects / completedProjects) * 100) : 0;

    // KPI: Total Contacts & Clients
    const contactsPerClient = filteredCompanies.length > 0 ? (filteredContacts.length / filteredCompanies.length).toFixed(1) : 0;

    // Priority Projects List
    const priorityProjectsList = filteredProjects.map(p => {
      const isCompleted = isDoneStatus(p.status || p.clientStatus);
      const start = new Date(p.createdAt || p.date || now).getTime();
      const expectedDateStr = p.expectedCompletion || p.dueDate || p.expectedEndDate;
      const expected = expectedDateStr ? new Date(expectedDateStr).getTime() : start + 45 * 24 * 60 * 60 * 1000;
      const diffDays = Math.ceil((expected - now) / (1000 * 60 * 60 * 24));
      
      let priorityLevel = "Low";
      let priorityScore = 5;
      let progress;
      
      if (isCompleted) {
        priorityLevel = "Completed";
        priorityScore = 6;
        progress = 100;
      } else {
        const totalDuration = expected - start;
        progress = totalDuration > 0 ? Math.min(Math.max(Math.round(((now - start) / totalDuration) * 100), 0), 99) : 0;
        
        if (diffDays < 0) {
          priorityLevel = "High";
          priorityScore = 1; // Overdue
        } else if (diffDays <= 7) {
          priorityLevel = "Highest";
          priorityScore = 2; // Due within 7 days
        } else if (diffDays <= 14 || progress >= 75) {
          priorityLevel = "Medium";
          priorityScore = 3;
        } else if (diffDays <= 30) {
          priorityLevel = "Low";
          priorityScore = 4;
        }
      }
      
      return { ...p, priorityLevel, priorityScore, progress, daysRemaining: diffDays, expected, start };
    }).sort((a, b) => {
      if (a.priorityScore !== b.priorityScore) return a.priorityScore - b.priorityScore;
      return a.expected - b.expected;
    });

    // Recent Payments List
    const recentPaymentsList = filteredPayments.map(p => ({
      id: p._id || p.id,
      date: new Date(p.date || p.createdAt || now).getTime(),
      companyName: p.companyName || p.client || "Unknown",
      contactName: p.clientName || "-",
      email: p.email || "-",
      package: p.package?.name || p.packageName || "-",
      amount: moneyValue(p.amount ?? p.value),
      status: p.status || "pending",
      orderId: p.orderId || p.paymentId || "-",
      type: "payment",
      raw: p
    })).sort((a, b) => b.date - a.date);

    const statusData = [
      { name: "On track", value: onTrack, color: ANALYTICS.green },
      { name: "Delayed", value: delayedProjects, color: ANALYTICS.amber },
      { name: "Completed", value: completedProjects, color: ANALYTICS.copper },
    ].filter((item) => item.value > 0);
    const statusTotal = statusData.reduce((sum, item) => sum + item.value, 0) || 1;

    const packageRevenue = Object.values(filteredOrders.reduce((acc, order) => {
      const name = order.package?.name || order.packageName || order.projectType || "Unassigned";
      acc[name] = acc[name] || { name, revenue: 0, count: 0 };
      acc[name].revenue += moneyValue(order.amount ?? order.value ?? order.package?.total ?? order.total);
      acc[name].count += 1;
      return acc;
    }, {})).sort((a, b) => b.revenue - a.revenue);

    const formatKey = (created) => created.toISOString().slice(0, 10);
    const formatDay = (created) => created.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

    const paidIndependentProjects = filteredProjects.filter(p => !p.linkedInvoiceId && !p.orderId && isPaidStatus(p.paymentStatus));

    const revenueGraph = Object.values([...paidOrders, ...paidPayments, ...paidIndependentProjects].reduce((acc, item) => {
      const stamp = item.paidAt || item.date || item.generatedAt || item.createdAt;
      const created = stamp ? new Date(stamp) : new Date(now);
      const key = formatKey(created);
      acc[key] = acc[key] || { key, day: formatDay(created), value: 0 };
      acc[key].value += moneyValue(item.amount ?? item.value ?? item.finalAmount ?? item.budget ?? item.packageValue ?? item.package?.total ?? item.total);
      return acc;
    }, {})).sort((a, b) => a.key.localeCompare(b.key));

    const usersGraph = Object.values(filteredCompanies.reduce((acc, item) => {
      const stamp = item.createdAt || item.date;
      const created = stamp ? new Date(stamp) : new Date(now);
      const key = formatKey(created);
      acc[key] = acc[key] || { key, day: formatDay(created), value: 0 };
      acc[key].value += 1;
      return acc;
    }, {})).sort((a, b) => a.key.localeCompare(b.key));

    const projectsGraph = Object.values(filteredProjects.reduce((acc, item) => {
      const stamp = item.createdAt || item.date;
      const created = stamp ? new Date(stamp) : new Date(now);
      const key = formatKey(created);
      acc[key] = acc[key] || { key, day: formatDay(created), value: 0 };
      acc[key].value += 1;
      return acc;
    }, {})).sort((a, b) => a.key.localeCompare(b.key));

    let finalChartData;
    if (metricFilter === "All") {
      const mergedMap = {};
      const addData = (arr, keyName) => {
        arr.forEach(item => {
          mergedMap[item.key] = mergedMap[item.key] || { key: item.key, day: item.day, revenue: 0, users: 0, projects: 0 };
          mergedMap[item.key][keyName] = item.value;
        });
      };
      addData(revenueGraph, "revenue");
      addData(usersGraph, "users");
      addData(projectsGraph, "projects");
      finalChartData = Object.values(mergedMap).sort((a, b) => a.key.localeCompare(b.key));
      if (finalChartData.length === 0) finalChartData = [{ day: "No data", revenue: 0, users: 0, projects: 0 }];
    } else {
      const activeChartData = metricFilter === "Revenue" ? revenueGraph : metricFilter === "Users" ? usersGraph : projectsGraph;
      finalChartData = activeChartData.length > 0 ? activeChartData : [{ day: "No data", value: 0 }];
    }

    const allActivities = [
      ...orders.map(o => ({
        id: `ord-${o._id || Math.random()}`,
        type: "order",
        title: o.package?.name || o.packageName || "Package purchased",
        date: new Date(o.createdAt || o.date || now).getTime(),
        desc: `Order by ${o.customer?.customerName || 'Client'} (${o.customer?.customerCompany || 'Company'})`
      })),
      ...payments.map(p => ({
        id: `pay-${p._id || Math.random()}`,
        type: "payment",
        title: "Payment received",
        date: new Date(p.paidAt || p.date || p.generatedAt || p.createdAt || now).getTime(),
        desc: `${formatMoney(p.amount || 0)} from ${p.client || 'Client'} (${p.company || 'Company'})`
      })),
      ...projects.map(p => ({
        id: `proj-${p._id || Math.random()}`,
        type: "project",
        title: isDoneStatus(p.status || p.clientStatus) ? "Project completed" : "Project started",
        date: new Date(p.createdAt || p.date || now).getTime(),
        desc: p.projectName || p.name || 'Website Design'
      })),
      ...companies.map(c => ({
        id: `comp-${c._id || Math.random()}`,
        type: "company",
        title: "New client registered",
        date: new Date(c.createdAt || c.date || now).getTime(),
        desc: c.name || c.company || 'Client'
      }))
    ].sort((a, b) => b.date - a.date).slice(0, 10);

    const formatKeySafe = (created) => created ? created.toISOString().slice(0, 10) : null;
    let drillDownData = null;
    if (selectedChartDate) {
      const matchDate = (stamp) => {
        if (!stamp) return false;
        const d = new Date(stamp);
        return formatKeySafe(d) === selectedChartDate;
      };
      
      const ddOrders = filteredOrders.filter(o => matchDate(o.createdAt || o.date));
      const ddPayments = filteredPayments.filter(p => matchDate(p.paidAt || p.date || p.generatedAt || p.createdAt));
      const ddProjects = filteredProjects.filter(p => matchDate(p.createdAt || p.date));
      const ddUsers = filteredCompanies.filter(c => matchDate(c.createdAt || c.date));
      
      let displayDate = selectedChartDate;
      try {
        displayDate = new Date(selectedChartDate).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      } catch { /* ignore */ }
      
      drillDownData = {
        date: displayDate,
        orders: ddOrders,
        payments: ddPayments,
        projects: ddProjects,
        users: ddUsers
      };
    }

    return { 
      revenue, paymentRate, avgProjectValue, avgRevenuePerClient, bottleneckText, completedProjects, delayedProjects, onTrack, 
      statusData, statusTotal, packageRevenue, pendingPaymentsCount, finalChartData, allActivities,
      filteredOrders,
      filteredPayments,
      filteredCompanies,
      filteredProjects,
      filteredContacts,
      filteredCompaniesLength: filteredCompanies.length,
      filteredProjectsLength: filteredProjects.length,
      pendingDues,
      filteredContactsLength: filteredContacts.length,
      avgCompletionTime,
      onTimeDeliveryPercent,
      contactsPerClient,
      completedProjectsList,
      delayedProjectsList,
      priorityProjectsList,
      recentPaymentsList,
      drillDownData,
      clientRepeatRate,
      valuableClientText
    };
  }, [orders, payments, projects, companies, contacts, tasks, now, metricFilter, filterType, filterYear, filterMonth, filterBiMonth, filterQuarter, customStartDate, customEndDate, selectedChartDate]);

  const topMetrics = [
    { label: "Total Revenue", value: formatMoney(data.revenue), icon: WalletCards, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", tooltip: "Total revenue from paid orders and payments." },
    { label: "Pending Dues", value: formatMoney(data.pendingDues), icon: ReceiptText, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", tooltip: "Sum of all pending and overdue payments." },
    { label: "Active Clients", value: data.filteredCompaniesLength, icon: Users, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", tooltip: "Total number of unique companies." },
    { label: "Total Projects", value: data.filteredProjectsLength, icon: PackageCheck, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", tooltip: "Total number of created projects." },
    { label: "Avg Project Value", value: formatMoney(data.avgProjectValue), icon: Tag, color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-100", tooltip: "Calculated as: Total Revenue ÷ Total Projects." },
    { label: "Avg Revenue / Client", value: formatMoney(data.avgRevenuePerClient), icon: Banknote, color: "text-fuchsia-600", bg: "bg-fuchsia-50", border: "border-fuchsia-100", tooltip: "Calculated as: Total Revenue ÷ Active Clients." },
    { label: "Total Contacts", value: data.filteredContactsLength, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100", tooltip: "Count of all contact persons.", subtext: `${data.contactsPerClient} Contacts per Client` },
    { label: "Avg Completion Time", value: `${data.avgCompletionTime} Days`, icon: Clock3, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100", tooltip: "Average days from start to completion for delivered projects." },
    { label: "On-Time Delivery %", value: `${data.onTimeDeliveryPercent}%`, icon: CalendarDays, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-100", tooltip: "(Projects Delivered On Time ÷ Total Completed Projects) × 100" },
    { label: "Client Repeat Rate", value: `${data.clientRepeatRate}%`, icon: Repeat, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", tooltip: "Percentage of active clients with more than one project." },
    { label: "Valuable Client", value: data.valuableClientText, icon: Trophy, color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-100", tooltip: "The client who has generated the highest total revenue." },
    { label: "Current Bottleneck", value: data.bottleneckText, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100", tooltip: "The project stage with the highest number of delayed tasks." }
  ];

  return (
    <>
    <PageShell
      title="Analytics"
      subtitle="Revenue, projects, payments, product performance, and delivery health."
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">

          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="h-8 rounded-lg bg-transparent px-2 text-xs font-bold text-gray-600 outline-none hover:bg-gray-50 focus:bg-gray-50">
              {["Monthly", "Bi-Monthly", "Quarterly", "Annually", "Custom Range", "All Time"].map((item) => <option key={item}>{item}</option>)}
            </select>
            
            {filterType !== "All Time" && filterType !== "Custom Range" && (
              <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className="h-8 rounded-lg bg-transparent px-2 text-xs font-bold text-gray-600 outline-none border-l border-gray-200 hover:bg-gray-50 focus:bg-gray-50">
                {[currentD.getFullYear() - 3, currentD.getFullYear() - 2, currentD.getFullYear() - 1, currentD.getFullYear(), currentD.getFullYear() + 1].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            )}

            {filterType === "Monthly" && (
              <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))} className="h-8 rounded-lg bg-transparent px-2 text-xs font-bold text-gray-600 outline-none border-l border-gray-200 hover:bg-gray-50 focus:bg-gray-50">
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            )}

            {filterType === "Bi-Monthly" && (
              <select value={filterBiMonth} onChange={(e) => setFilterBiMonth(Number(e.target.value))} className="h-8 rounded-lg bg-transparent px-2 text-xs font-bold text-gray-600 outline-none border-l border-gray-200 hover:bg-gray-50 focus:bg-gray-50">
                {["Jan-Feb", "Mar-Apr", "May-Jun", "Jul-Aug", "Sep-Oct", "Nov-Dec"].map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            )}

            {filterType === "Quarterly" && (
              <select value={filterQuarter} onChange={(e) => setFilterQuarter(Number(e.target.value))} className="h-8 rounded-lg bg-transparent px-2 text-xs font-bold text-gray-600 outline-none border-l border-gray-200 hover:bg-gray-50 focus:bg-gray-50">
                {["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"].map((q, i) => <option key={i} value={i}>{q}</option>)}
              </select>
            )}

            {filterType === "Custom Range" && (
              <div className="flex items-center gap-1 border-l border-gray-200 px-2">
                <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="h-8 rounded-lg bg-transparent px-1 text-xs font-bold text-gray-600 outline-none hover:bg-gray-50" />
                <span className="text-gray-400 text-xs">to</span>
                <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="h-8 rounded-lg bg-transparent px-1 text-xs font-bold text-gray-600 outline-none hover:bg-gray-50" />
              </div>
            )}
          </div>
        </div>
      }
    >
      <div className="grid gap-5 2xl:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          <div className="relative group">
            <button 
              onClick={() => { document.getElementById('kpi-scroll-container').scrollBy({ left: -300, behavior: 'smooth' }) }} 
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white border border-gray-200 rounded-full p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 hidden md:block"
            >
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            
            <div id="kpi-scroll-container" className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {topMetrics.map((item) => (
                <Card 
                  key={item.label} 
                  onClick={() => setSelectedKpiDrillDown(item.label)}
                  className={`p-4 border-l-4 ${item.border} flex-shrink-0 w-[85vw] sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)] snap-start cursor-pointer hover:shadow-md transition-all relative group/card`}
                >
                  <div className="flex justify-between items-start">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.bg} ${item.color}`}>
                      <item.icon size={17} />
                    </div>
                    {item.tooltip && (
                      <div className="relative">
                        <Info size={14} className="text-gray-300 hover:text-gray-500 transition-colors" />
                        <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] leading-tight rounded shadow-lg opacity-0 pointer-events-none group-hover/card:opacity-100 transition-opacity z-20">
                          {item.tooltip}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-2xl font-bold text-gray-950">{item.value}</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{item.label}</p>
                  {item.subtext && <p className="text-[10px] text-gray-500 mt-1 font-medium">{item.subtext}</p>}
                </Card>
              ))}
            </div>

            <button 
              onClick={() => { document.getElementById('kpi-scroll-container').scrollBy({ left: 300, behavior: 'smooth' }) }} 
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white border border-gray-200 rounded-full p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 hidden md:block"
            >
              <ChevronRight size={18} className="text-gray-600" />
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 px-5 py-4 gap-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-950">{metricFilter} over time</h3>
                  <p className="text-xs text-gray-400">{filterType}</p>
                </div>
                <div className="flex gap-2">
                  {["All", "Revenue", "Users", "Projects"].map(m => (
                    <button key={m} onClick={() => setMetricFilter(m)} className={`px-2 py-1 text-[11px] font-bold rounded transition-colors ${metricFilter === m ? 'bg-[#884c2d] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-80 p-4 relative">
                <ResponsiveContainer width="100%" height="100%" className="animate-in fade-in duration-500">
                  <AreaChart data={data.finalChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} onClick={(e) => {
                    if (e && e.activePayload && e.activePayload.length > 0) {
                      const clickedKey = e.activePayload[0].payload.key;
                      if (clickedKey) {
                        showToast({ title: "Chart Clicked", message: "Key: " + clickedKey });
                        setSelectedChartDate(clickedKey);
                      }
                    } else if (e && e.activeLabel) {
                      showToast({ title: "Chart Clicked", message: "Label: " + e.activeLabel });
                      const matchedItem = data.finalChartData.find(item => item.day === e.activeLabel);
                      if (matchedItem) setSelectedChartDate(matchedItem.key);
                    } else {
                      showToast({ title: "Chart Clicked", message: "No data point registered." });
                    }
                  }}>
                    <defs>
                      <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ANALYTICS.copper} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={ANALYTICS.copper} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke={ANALYTICS.grid} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} minTickGap={24} />
                    {metricFilter === "All" ? (
                      <>
                        <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={24} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={formatMoneyCompact} width={64} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke={ANALYTICS.copper} strokeWidth={2.5} fill="url(#chartFill)" activeDot={{ r: 4 }} />
                        <Area yAxisId="left" type="monotone" dataKey="users" name="Users" stroke="#3b82f6" strokeWidth={2.5} fill="none" activeDot={{ r: 4 }} />
                        <Area yAxisId="left" type="monotone" dataKey="projects" name="Projects" stroke="#8b5cf6" strokeWidth={2.5} fill="none" activeDot={{ r: 4 }} />
                      </>
                    ) : (
                      <>
                        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={metricFilter === "Revenue" ? formatMoneyCompact : (v) => v} width={64} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="value" name={metricFilter} stroke={ANALYTICS.copper} strokeWidth={2.5} fill="url(#chartFill)" activeDot={{ r: 4 }} />
                      </>
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <div className="border-b border-gray-100 px-5 py-4">
                <h3 className="text-sm font-bold text-gray-950">Project status</h3>
              </div>
              <div className="h-56 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={data.statusData.length ? data.statusData : [{ name: "No data", value: 1, color: "#e5e7eb" }]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={84}
                      paddingAngle={4}
                      stroke="#ffffff"
                      strokeWidth={2}
                      labelLine={false}
                    >
                      {(data.statusData.length ? data.statusData : [{ name: "No data", color: "#e5e7eb" }]).map((item) => <Cell key={item.name} fill={item.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 px-4 pb-4">
                {(data.statusData.length ? data.statusData : [{ name: "No data", value: 0, color: "#e5e7eb" }]).map((item) => (
                  <div key={item.name} className="rounded-xl bg-gray-50 p-3">
                    <span className="block h-2 w-2 rounded-full" style={{ background: item.color }} />
                    <p className="mt-2 text-[10px] font-bold text-gray-700">{item.name}</p>
                    <p className="text-sm font-bold text-gray-950">{item.value}<span className="ml-1 text-[11px] font-semibold text-gray-400">({Math.round((item.value / data.statusTotal) * 100)}%)</span></p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div>
                <h3 className="text-sm font-bold text-gray-950">Top products by revenue</h3>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.packageRevenue.length ? data.packageRevenue : [{ name: "No orders", revenue: 0 }]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={ANALYTICS.copper} stopOpacity={1} />
                          <stop offset="100%" stopColor={ANALYTICS.copperLight} stopOpacity={0.9} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke={ANALYTICS.grid} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={formatMoneyCompact} width={56} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: ANALYTICS.copper, opacity: 0.06 }} />
                      <Bar dataKey="revenue" name="Revenue" fill="url(#barFill)" radius={[8, 8, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-950">Orders per package</h3>
                <div className="mt-4 space-y-3">
                  {(data.packageRevenue.length ? data.packageRevenue : [{ name: "No packages yet", revenue: 0, count: 0 }]).map((item) => (
                    <div 
                      key={item.name} 
                      className={`rounded-xl border bg-gray-50 p-3 transition-all ${item.count > 0 ? "cursor-pointer hover:border-[#cda88f] hover:shadow-sm" : "border-gray-200"}`}
                      onClick={() => item.count > 0 && setSelectedPackage(item.name)}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-900">{item.name}</p>
                        <p className={`text-xs font-bold ${item.count > 0 ? "text-[#884c2d] underline decoration-[#884c2d]/30 underline-offset-2" : "text-gray-400"}`}>
                          {item.count} {item.count === 1 ? "order" : "orders"}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{formatMoney(item.revenue)} revenue</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <PriorityProjectsTable 
            projects={data.priorityProjectsList} 
            page={projectPage} 
            setPage={setProjectPage} 
            search={projectSearch} 
            setSearch={setProjectSearch} 
            navigate={navigate} 
          />
          <RecentPaymentsTable 
            payments={data.recentPaymentsList} 
            page={paymentPage} 
            setPage={setPaymentPage} 
            search={paymentSearch} 
            setSearch={setPaymentSearch} 
            navigate={navigate} 
          />
        </div>

        <div className="flex flex-col gap-5">
          <EarningsCard 
            records={[
              ...data.filteredPayments.filter(p => isPaidStatus(p.status)),
              ...data.filteredProjects.filter(p => !p.linkedInvoiceId && !p.orderId && isPaidStatus(p.paymentStatus)).map(p => ({
                ...p,
                date: p.createdAt || p.date,
                amount: moneyValue(p.finalAmount ?? p.budget ?? p.packageValue ?? 0)
              }))
            ]}
            filterType={filterType}
            filterYear={filterYear}
            filterMonth={filterMonth}
            filterBiMonth={filterBiMonth}
            filterQuarter={filterQuarter}
          />
          
          <Card>
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="text-sm font-bold text-gray-950">Recent Activity</h3>
            </div>
            <div className="p-5">
              {data.allActivities.length > 0 ? (
                <div className="relative border-l border-gray-200 ml-3 space-y-6">
                  {data.allActivities.map((activity) => (
                    <div key={activity.id} className="relative pl-5">
                      <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full border-2 border-white bg-[#cda88f]" />
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {new Date(activity.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.desc}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedPackage} Orders</h3>
                <p className="mt-1 text-xs text-gray-500">Detailed list of clients who purchased this package</p>
              </div>
              <button 
                onClick={() => setSelectedPackage(null)} 
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 bg-gray-50/50">
              <div className="space-y-3">
                {data.filteredOrders
                  .filter(o => (o.package?.name || o.packageName || o.projectType || "Unassigned") === selectedPackage)
                  .sort((a, b) => new Date(b.createdAt || b.date || now) - new Date(a.createdAt || a.date || now))
                  .map((o, i) => (
                  <div key={o._id || i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{o.customer?.customerName || o.client || 'Unknown Client'}</p>
                      <p className="mt-1 text-xs font-medium text-gray-500">{o.customer?.customerCompany || o.company || 'Unknown Company'}</p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-sm font-bold text-emerald-600">{formatMoney(o.amount ?? o.value ?? o.package?.total ?? o.total)}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {new Date(o.createdAt || o.date || now).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
    {selectedChartDate && data.drillDownData && (
      <ChartDrillDownPanel data={data.drillDownData} onClose={() => setSelectedChartDate(null)} navigate={navigate} />
    )}
    {selectedKpiDrillDown && (
      <KpiDrillDownPanel kpi={selectedKpiDrillDown} data={data} onClose={() => setSelectedKpiDrillDown(null)} navigate={navigate} />
    )}
    </>
  );
}

function PriorityProjectsTable({ projects, page, setPage, search, setSearch, navigate }) {
  const itemsPerPage = 5;
  
  const filtered = projects.filter(p => 
    (p.projectName || p.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.company || p.clientCompany || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.client || "").toLowerCase().includes(search.toLowerCase())
  );
  
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const displayed = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const getBadgeColor = (level) => {
    switch (level) {
      case "High": return "bg-red-100 text-red-700 border-red-200";
      case "Highest": return "bg-orange-100 text-orange-700 border-orange-200";
      case "Medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Low": return "bg-green-100 text-green-700 border-green-200";
      case "Completed": return "bg-gray-100 text-gray-700 border-gray-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = (level) => {
    switch (level) {
      case "High": return "Overdue";
      case "Highest": return "Due Soon";
      case "Medium": return "In Progress";
      case "Low": return "On Track";
      case "Completed": return "Completed";
      default: return level;
    }
  };

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 px-5 py-4 gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-950">Priority Projects</h3>
          <p className="text-xs text-gray-500 mt-1">Projects requiring attention based on deadlines</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#884c2d]/20 focus:border-[#884c2d] w-full sm:w-64 transition-all"
            />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
            <tr>
              <th className="px-5 py-3 font-semibold">Project Name</th>
              <th className="px-5 py-3 font-semibold">Company / Contact</th>
              <th className="px-5 py-3 font-semibold">Package</th>
              <th className="px-5 py-3 font-semibold">Timeline</th>
              <th className="px-5 py-3 font-semibold">Progress</th>
              <th className="px-5 py-3 font-semibold">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {displayed.length > 0 ? displayed.map(p => (
              <tr 
                key={p._id || p.id} 
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/admin/companies/${p.companyId || 'company'}/projects/${p._id || p.id}`)}
              >
                <td className="px-5 py-4">
                  <p className="font-bold text-gray-900">{String(p.projectName || p.name || 'Unknown Project')}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{String(p.status || p.clientStatus || 'Pending')}</p>
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium text-gray-900">{String(p.company || p.clientCompany || '-')}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{String(p.client || p.contactName || '-')}</p>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-800">
                    {String(p.package?.name || p.packageName || p.projectType || 'Custom')}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-[11px] text-gray-500">
                      <span className="font-medium text-gray-900">Start:</span> {new Date(p.start).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      <span className="font-medium text-gray-900">Due:</span> {new Date(p.expected).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    {p.priorityLevel !== "Completed" && (
                      <p className={`text-[10px] font-bold ${p.daysRemaining < 0 ? "text-red-600" : "text-[#884c2d]"}`}>
                        {p.daysRemaining < 0 ? `${Math.abs(p.daysRemaining)} days late` : `${p.daysRemaining} days left`}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-full max-w-[100px] bg-gray-200 rounded-full h-1.5">
                      <div className="bg-[#884c2d] h-1.5 rounded-full" style={{ width: `${p.progress}%` }}></div>
                    </div>
                    <span className="text-xs font-bold text-gray-700">{p.progress}%</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getBadgeColor(p.priorityLevel)}`}>
                    {getStatusLabel(p.priorityLevel)}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="px-5 py-8 text-center text-sm text-gray-500">
                  No priority projects found for the selected period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          <p className="text-xs text-gray-500">Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filtered.length)} of {filtered.length} entries</p>
          <div className="flex gap-1">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

function RecentPaymentsTable({ payments, page, setPage, search, setSearch, navigate }) {
  const itemsPerPage = 5;
  
  const filtered = payments.filter(p => 
    (p.companyName || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.contactName || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.orderId || "").toLowerCase().includes(search.toLowerCase())
  );
  
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const displayed = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const getStatusColor = (status) => {
    const s = (status || "").toLowerCase();
    if (s.includes("paid") || s.includes("success")) return "bg-green-100 text-green-700 border-green-200";
    if (s.includes("pending")) return "bg-orange-100 text-orange-700 border-orange-200";
    if (s.includes("overdue") || s.includes("late")) return "bg-red-100 text-red-700 border-red-200";
    if (s.includes("fail") || s.includes("decline")) return "bg-red-50 text-red-900 border-red-200";
    if (s.includes("refund")) return "bg-gray-100 text-gray-700 border-gray-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 px-5 py-4 gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-950">Recent Payments</h3>
          <p className="text-xs text-gray-500 mt-1">Latest transactions and order payments</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Search payments..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#884c2d]/20 focus:border-[#884c2d] w-full sm:w-64 transition-all"
            />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
            <tr>
              <th className="px-5 py-3 font-semibold">Date</th>
              <th className="px-5 py-3 font-semibold">Company / Contact</th>
              <th className="px-5 py-3 font-semibold">Package / Order ID</th>
              <th className="px-5 py-3 font-semibold text-right">Amount</th>
              <th className="px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {displayed.length > 0 ? displayed.map(p => (
              <tr 
                key={`${p.type}-${p.id}`} 
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate('/admin/payments')}
              >
                <td className="px-5 py-4">
                  <p className="font-medium text-gray-900">
                    {new Date(p.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="text-[10px] uppercase text-gray-400 mt-0.5">
                    {new Date(p.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <p className="font-bold text-gray-900">{String(p.companyName || 'Unknown')}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-gray-500">{String(p.contactName || '-')}</span>
                    {p.email !== "-" && <span className="text-xs text-gray-400">({String(p.email)})</span>}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium text-gray-900">{String(p.package || '-')}</p>
                  <p className="text-xs font-mono text-gray-500 mt-0.5">{String(p.orderId || '-')}</p>
                </td>
                <td className="px-5 py-4 text-right">
                  <p className="font-bold text-gray-900">{formatMoney(p.amount)}</p>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border uppercase tracking-wider ${getStatusColor(p.status)}`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="px-5 py-8 text-center text-sm text-gray-500">
                  No payments found for the selected period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          <p className="text-xs text-gray-500">Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filtered.length)} of {filtered.length} entries</p>
          <div className="flex gap-1">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

function validateProposal(p) {
  const errors = {};
  if (!isRequired(p.client)) errors.client = "Client name is required.";
  if (!isRequired(p.company)) errors.company = "Company is required.";
  if (!isRequired(p.service)) errors.service = "Service is required.";
  if (!isPositiveNumber(p.value)) errors.value = "Enter a valid project value.";
  if (p.gstin && !isGstin(p.gstin)) errors.gstin = "Enter a valid 15-character GSTIN.";
  if (!isRequired(p.timeline)) errors.timeline = "Timeline is required.";
  return errors;
}

function buildProposalSections(proposal) {
  return [
    {
      title: "About The Copper Studio",
      body: "A focused implementation workspace for designing, deploying, and supporting professional client-facing digital systems with a clear onboarding and delivery process."
    },
    {
      title: "Scope and Deliverables",
      body: `${proposal.service || "This engagement"} includes planning, design coordination, implementation, review cycles, and handover documentation aligned to the selected package.`
    },
    {
      title: "Pricing and Commercials",
      body: `Estimated project value is Rs ${Number(proposal.value || 0).toLocaleString("en-IN")}. Taxes, final package inclusions, and payment milestones can be confirmed during checkout or invoice generation.`
    },
    {
      title: "Process and Timeline",
      body: `The expected completion timeline is ${proposal.timeline || "to be confirmed"}. Work moves through discovery, setup, build, review, launch, and support.`
    }
  ];
}

export function ProposalGeneratorPage() {
  const { showToast } = useToast();
  const [proposal, setProposal] = useState({
    client: "",
    company: "",
    gstin: "",
    service: "",
    value: "",
    timeline: "21 days",
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [proposalNo] = useState(() => `DCS-${Date.now().toString().slice(-6)}`);
  const [proposalDate] = useState(() => new Date());

  const setField = (key) => (value) => {
    setProposal((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
  };

  const proposalValue = Number(proposal.value || 0);
  const sections = useMemo(() => buildProposalSections(proposal), [proposal]);
  const proposalDetails = useMemo(() => ([
    ["Company", proposal.company || "-"],
    ["GSTIN", proposal.gstin || "-"],
    ["Service", proposal.service || "-"],
    ["Project value", `Rs ${proposalValue.toLocaleString("en-IN")}`],
    ["Estimated timeline", proposal.timeline || "-"]
  ]), [proposal, proposalValue]);

  const proposalText = useMemo(() => (
    `PDF Contents\n\nPage 1 - Intro / Cover Page\nClient: ${proposal.client}\nCompany: ${proposal.company}\nGSTIN: ${proposal.gstin}\n\nPage 2 - About The Copper Studio\nPage 3 - Pricing of various packages\nPage 4 - Detailed comparison\nPage 5 - Process / timeline details\nTimeline: ${proposal.timeline}\nService: ${proposal.service}\nValue: Rs ${proposalValue.toLocaleString("en-IN")}\n\nPage 6 - Contact us / outro page`
  ), [proposal, proposalValue]);

  async function copyText(text, title) {
    await navigator.clipboard.writeText(text);
    showToast({ title, message: "Copied to clipboard." });
  }

  function sendProposal() {
    const nextErrors = validateProposal(proposal);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      showToast({ title: "Check the form", message: "Please fix the highlighted fields." });
      return;
    }
    copyText(proposalText, "Proposal copied");
  }

  function adjustZoom(step) {
    setZoom((prev) => Math.min(150, Math.max(50, prev + step)));
  }

  async function createProposalPdf() {
    const nextErrors = validateProposal(proposal);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      showToast({ title: "Check the form", message: "Please fix the highlighted fields." });
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 48;
    let y = 190;

    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 150, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("The Copper Studio", margin, 58);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("The Copper Studio Proposal", margin, 82);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text(proposal.service || "Project Proposal", margin, 122);
    doc.setFontSize(10);
    doc.text(`Proposal ${proposalNo}`, pageWidth - 168, 58);
    doc.text(formatDateTime(proposalDate), pageWidth - 168, 78);

    doc.setTextColor(17, 24, 39);
    doc.setFontSize(18);
    doc.text(`Prepared for ${proposal.client}`, margin, y);
    y += 30;

    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 118, 10, 10);
    proposalDetails.forEach(([label, detail], index) => {
      const rowY = y + 24 + index * 19;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(label.toUpperCase(), margin + 20, rowY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(17, 24, 39);
      doc.text(String(detail || "-"), margin + 150, rowY);
    });
    y += 158;

    sections.forEach((section) => {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 86, 8, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(17, 24, 39);
      doc.text(section.title, margin + 18, y + 24);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      doc.text(doc.splitTextToSize(section.body, pageWidth - margin * 2 - 36), margin + 18, y + 45);
      y += 104;
    });

    doc.setDrawColor(37, 99, 235);
    doc.line(margin, 780, pageWidth - margin, 780);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(37, 99, 235);
    doc.text("The Copper Studio", margin, 802);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text("Contact us for package confirmation, onboarding, and next steps.", margin, 818);

    doc.save(`${safeFileName(proposal.company)}-${safeFileName(proposal.service)}.pdf`);
    showToast({ title: "Proposal PDF created", message: "Professional proposal downloaded successfully." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell
      title="Proposal Generator"
      subtitle="Create a ready-to-send, branded proposal draft."
      action={<Button onClick={sendProposal}><Send size={14} /> Send Proposal</Button>}
    >
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="text-sm font-bold text-gray-950">Proposal details</h3>
            <p className="text-xs text-gray-400">Fields marked * are required.</p>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Client" required value={proposal.client} onChange={setField("client")} error={errors.client} />
            <Field label="Company" required value={proposal.company} onChange={setField("company")} error={errors.company} />
            <Field label="GSTIN" value={proposal.gstin} onChange={setField("gstin")} error={errors.gstin} hint="Optional, 15 characters." maxLength={15} />
            <Field label="Service" required value={proposal.service} onChange={setField("service")} error={errors.service} placeholder="e.g. Website Design" />
            <Field label="Value" required type="number" inputMode="decimal" value={proposal.value} onChange={setField("value")} error={errors.value} placeholder="50000" />
            <Field label="Timeline" required value={proposal.timeline} onChange={setField("timeline")} error={errors.timeline} />
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
            <Button variant="secondary" onClick={() => copyText(proposalText, "Proposal copied")}><Copy size={14} /> Copy text</Button>
            <Button onClick={createProposalPdf} disabled={busy}>
              <FileDown size={14} /> {busy ? "Generating…" : "Save PDF"}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h3 className="text-sm font-bold text-gray-950">Live preview</h3>
              <p className="text-xs text-gray-400">Updates as you type. Matches the exported PDF.</p>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1">
              <button
                type="button"
                onClick={() => adjustZoom(-10)}
                className="grid h-6 w-6 place-items-center rounded-md text-gray-500 hover:bg-gray-100"
                aria-label="Zoom out"
              >
                <Minus size={13} />
              </button>
              <span className="w-10 text-center text-[11px] font-semibold text-gray-600">{zoom}%</span>
              <button
                type="button"
                onClick={() => adjustZoom(10)}
                className="grid h-6 w-6 place-items-center rounded-md text-gray-500 hover:bg-gray-100"
                aria-label="Zoom in"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
          <div className="max-h-[640px] overflow-auto bg-gray-100 p-6">
            <div
              className="mx-auto origin-top bg-white shadow-lg"
              style={{ width: 480, transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
            >
              <div className="bg-[#2563eb] px-7 py-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-bold">The Copper Studio</p>
                    <p className="mt-1 text-[11px] text-blue-100">The Copper Studio Proposal</p>
                  </div>
                  <div className="text-right text-[10px] text-blue-100">
                    <p>Proposal {proposalNo}</p>
                    <p className="mt-1">{formatDateTime(proposalDate)}</p>
                  </div>
                </div>
                <p className="mt-5 text-xl font-bold leading-tight">{proposal.service || "Project Proposal"}</p>
              </div>

              <div className="px-7 py-6">
                <p className="text-base font-bold text-gray-900">Prepared for {proposal.client || "—"}</p>

                <div className="mt-4 rounded-xl border border-gray-200 p-4">
                  <dl className="space-y-2">
                    {proposalDetails.map(([label, detail]) => (
                      <div key={label} className="flex items-baseline justify-between gap-3 text-[11px]">
                        <dt className="font-bold uppercase tracking-wide text-gray-500">{label}</dt>
                        <dd className="truncate text-right font-medium text-gray-900">{detail}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="mt-4 space-y-3">
                  {sections.map((section) => (
                    <div key={section.title} className="rounded-lg bg-gray-50 p-4">
                      <p className="text-[12px] font-bold text-gray-900">{section.title}</p>
                      <p className="mt-1.5 text-[11px] leading-5 text-gray-600">{section.body}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 border-t-2 border-[#2563eb] pt-3">
                  <p className="text-[11px] font-bold text-[#2563eb]">The Copper Studio</p>
                  <p className="mt-0.5 text-[10px] text-gray-500">Contact us for package confirmation, onboarding, and next steps.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

const COUPON_DEFAULTS = {
  prefix: "COP-STU",
  discount: "",
  packageName: "",
  validity: toDateTimeLocal(),
  amountType: "percentage",
  clientName: "",
  companyName: "",
  email: "",
  phone: "",
};

function validateCoupon(coupon) {
  const errors = {};
  const prefix = String(coupon.prefix || "").trim();
  if (!prefix) errors.prefix = "Prefix is required.";
  else if (!/^[A-Za-z0-9-]{2,10}$/.test(prefix)) errors.prefix = "2–10 letters, numbers or hyphens.";

  const amount = Number(coupon.discount);
  if (String(coupon.discount).trim() === "" || Number.isNaN(amount)) errors.discount = "Enter a discount amount.";
  else if (amount <= 0) errors.discount = "Must be greater than 0.";
  else if (coupon.amountType === "percentage" && amount > 100) errors.discount = "Percentage can't exceed 100.";

  if (!String(coupon.packageName || "").trim()) errors.packageName = "Package is required.";
  if (!isFutureDate(coupon.validity)) errors.validity = "Validity must be a future date.";
  if (coupon.email && !isEmail(coupon.email)) errors.email = "Enter a valid email.";
  if (coupon.phone && !isPhone(coupon.phone)) errors.phone = "Enter a valid 10-digit mobile.";
  return errors;
}

export function ServicesPage() {
  const { showToast } = useToast();
  const { records: savedCoupons, save: saveCoupon } = useCrmRecords("coupons");
  const [coupon, setCoupon] = useState(COUPON_DEFAULTS);
  const [errors, setErrors] = useState({});
  const [creating, setCreating] = useState(false);

  const setField = (key) => (value) => {
    setCoupon((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
  };

  const previewCode = `${(coupon.prefix || "COP").slice(0, 6).toUpperCase()}-XXX-XXXX`;
  const discountLabel = coupon.amountType === "percentage" ? `${coupon.discount || 0}%` : `Rs ${coupon.discount || 0}`;

  async function copyText(text, title) {
    await navigator.clipboard.writeText(text);
    showToast({ title, message: "Copied to clipboard." });
  }

  function nineDigitCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 9 }, (_, index) => {
      const char = alphabet[Math.floor(Math.random() * alphabet.length)];
      return index === 3 || index === 6 ? `-${char}` : char;
    }).join("");
  }

  async function createCoupon() {
    if (creating) return; // guard against double-submit
    const nextErrors = validateCoupon(coupon);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      showToast({ title: "Check the form", message: "Please fix the highlighted fields." });
      return;
    }

    setCreating(true);
    try {
      const code = `${coupon.prefix.slice(0, 6).toUpperCase()}-${nineDigitCode()}`;
      const validUntil = coupon.validity ? new Date(coupon.validity).toISOString() : null;
      const created = await saveCoupon({
        code,
        generatedAt: new Date().toLocaleString("en-IN"),
        validity: formatDateTime(validUntil),
        validUntil,
        amountType: coupon.amountType,
        amount: coupon.amountType === "percentage" ? `${coupon.discount}%` : `Rs ${coupon.discount}`,
        status: "Not used",
        clientName: coupon.clientName.trim(),
        companyName: coupon.companyName.trim(),
        email: coupon.email.trim(),
        phone: coupon.phone.trim(),
        packageName: coupon.packageName.trim(),
      });
      showToast({ title: "Coupon created", message: `${created?.code || code} stored successfully.` });
      // Reset the entry fields but keep the prefix + a fresh validity default.
      setCoupon((prev) => ({
        ...COUPON_DEFAULTS,
        prefix: prev.prefix,
        amountType: prev.amountType,
        validity: toDateTimeLocal(),
      }));
      setErrors({});
    } catch (error) {
      showToast({ title: "Could not create coupon", message: error.message || "Please try again." });
    } finally {
      setCreating(false);
    }
  }

  return (
    <PageShell title="Coupon Code Generator" subtitle="Generate package-specific, time-bound discount codes.">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.8fr)]">
        <Card>
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="text-sm font-bold text-gray-950">Coupon details</h3>
            <p className="text-xs text-gray-400">Fields marked * are required.</p>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Prefix" required value={coupon.prefix} onChange={setField("prefix")} error={errors.prefix} hint="Shown at the start of the code." maxLength={10} />
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Field label="Discount" required type="number" inputMode="decimal" value={coupon.discount} onChange={setField("discount")} error={errors.discount} placeholder={coupon.amountType === "percentage" ? "10" : "500"} />
              <label className="block">
                <span className="text-xs font-bold text-gray-600">Type</span>
                <select value={coupon.amountType} onChange={(event) => setField("amountType")(event.target.value)} className="mt-1.5 h-[38px] w-full rounded-xl border border-gray-200 px-2 text-sm outline-none focus:border-[#cda88f] focus:ring-4 focus:ring-[#fff1ec]">
                  <option value="percentage">%</option>
                  <option value="fixed">Rs</option>
                </select>
              </label>
            </div>
            <Field label="Package" required value={coupon.packageName} onChange={setField("packageName")} error={errors.packageName} placeholder="e.g. Growth Studio" />
            <div className="sm:col-span-1">
              <DateTimeField label="Valid until" value={coupon.validity} onChange={setField("validity")} />
              {errors.validity && <span className="mt-1 block text-[11px] font-semibold text-red-500">{errors.validity}</span>}
            </div>
            <Field label="Client name" value={coupon.clientName} onChange={setField("clientName")} placeholder="Optional" />
            <Field label="Company name" value={coupon.companyName} onChange={setField("companyName")} placeholder="Optional" />
            <Field label="Email ID" type="email" value={coupon.email} onChange={setField("email")} error={errors.email} placeholder="Optional" />
            <Field label="Phone no." type="tel" inputMode="numeric" value={coupon.phone} onChange={setField("phone")} error={errors.phone} placeholder="Optional" maxLength={10} />
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
            <Button variant="secondary" onClick={() => copyText(previewCode, "Prefix copied")}><Copy size={14} /> Copy prefix</Button>
            <Button onClick={createCoupon} disabled={creating}>
              <Plus size={14} /> {creating ? "Creating…" : "Create Coupon"}
            </Button>
          </div>
        </Card>

        <div className="space-y-5">
          <div className="rounded-2xl border border-dashed border-[#e2c4b4] bg-[#fff1ec] p-5 text-center">
            <Tag size={22} className="mx-auto text-[#884c2d]" />
            <p className="mt-3 font-mono text-xl font-bold text-gray-950">{previewCode}</p>
            <p className="mt-1 text-xs font-semibold text-gray-500">{discountLabel} off on {coupon.packageName || "selected package"}</p>
            <p className="mt-1 text-[11px] font-semibold text-[#884c2d]">Valid till {formatDateTime(coupon.validity)}</p>
            <p className="mt-2 text-[10px] text-gray-400">A unique code is generated on create.</p>
          </div>

          <Card>
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-sm font-bold text-gray-950">Recent coupons</h3>
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto p-3">
              {savedCoupons.length ? savedCoupons.slice(0, 8).map((item) => (
                <div key={item._id || item.code} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-gray-700">{item.code}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{item.status}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500">{item.generatedAt} · Valid till {item.validity || formatDateTime(item.validUntil)}</p>
                  <p className="text-[11px] text-gray-500">{item.clientName || "No client"} / {item.companyName || "No company"}</p>
                </div>
              )) : (
                <p className="px-2 py-6 text-center text-xs text-gray-400">No coupons created yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

const tableColumns = {
  companies: ["name", "gstin", "industry", "contact", "status"],
  leads: ["name", "company", "email", "phone", "stage"],
  contacts: ["name", "company", "email", "phone", "designation"],
  deals: ["name", "account", "owner", "value", "stage"],
  tasks: ["title", "project", "status", "priority", "deadline"],
  coupons: ["code", "validity", "amount", "status", "companyName"],
};

function DataTablePreview({ type, title }) {
  const emptyFallback = useMemo(() => [], []);
  const { records, loading } = useCrmRecords(type, emptyFallback);
  const columns = tableColumns[type];
  return (
    <Card>
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Table2 size={16} className="text-[#2563EB]" />
          <h3 className="text-sm font-bold text-gray-950">{title}</h3>
        </div>
        <span className="rounded-full bg-gray-50 px-2 py-1 text-[11px] font-bold text-gray-500">{loading ? "Loading" : `${records.length} rows`}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px]">
          <thead>
            <tr className="bg-gray-50/80">
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(records.length ? records : [{}]).slice(0, 6).map((row, index) => (
              <tr key={row._id || index} className="border-t border-gray-100">
                {columns.map((column) => (
                  <td key={column} className="max-w-40 truncate px-4 py-3 text-xs font-semibold text-gray-600">{row[column] || "-"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function DatabaseTablesPage() {
  return (
    <PageShell title="Database Tables" subtitle="Separate MongoDB collections for companies, leads, contacts, deals, tasks, and coupons." action={null}>
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-3">
          {Object.keys(tableColumns).map((type) => (
            <Card key={type} className="p-4">
              <Table2 size={18} className="text-[#2563EB]" />
              <p className="mt-3 text-lg font-bold capitalize text-gray-950">{type}</p>
              <p className="text-xs font-semibold text-gray-500">Dedicated collection</p>
            </Card>
          ))}
        </div>
        <DataTablePreview type="companies" title="Companies table" />
        <DataTablePreview type="leads" title="Leads table" />
        <DataTablePreview type="contacts" title="Contacts table" />
        <DataTablePreview type="deals" title="Deals table" />
        <DataTablePreview type="tasks" title="Tasks table" />
        <DataTablePreview type="coupons" title="Coupons table" />
      </div>
    </PageShell>
  );
}
