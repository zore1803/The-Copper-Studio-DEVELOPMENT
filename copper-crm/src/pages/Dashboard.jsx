import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CircleAlert,
  Clock3,
  Download,
  IndianRupee,
  TrendingUp,
  UserPlus
} from "lucide-react";
import {
  companies,
  orders,
  projects,
  recentLeads,
  revenueData,
  salesData
} from "../data/mockData";
import { Badge, Button, Card } from "../components/ui";

const rangeOptions = ["Last 30 Days", "This Quarter", "Year to Date"];

function parseCurrency(value) {
  return Number(String(value).replace(/[^\d.-]/g, "")) || 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatCompactCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

function KPIStat({ icon: Icon, label, value, hint, progress, tone = "copper" }) {
  const iconTone = {
    copper: "bg-[#f3dfd7] text-[#884c2d]",
    teal: "bg-[#d7efeb] text-[#026769]",
    gold: "bg-[#f9e8cb] text-[#9a641d]",
    rose: "bg-[#f8dcdb] text-[#aa3d33]",
  };

  const barTone = {
    copper: "bg-[#884c2d]",
    teal: "bg-[#026769]",
    gold: "bg-[#9a641d]",
    rose: "bg-[#aa3d33]",
  };

  return (
    <Card className="p-5 shadow-[0_14px_35px_rgba(79,39,16,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b6f63]">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-[#211a17]">{value}</p>
          <p className="mt-1 text-xs font-medium text-[#6c6355]">{hint}</p>
        </div>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${iconTone[tone]}`}>
          <Icon size={18} strokeWidth={2} />
        </div>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#efe4df]">
        <div className={`h-full rounded-full ${barTone[tone]}`} style={{ width: `${progress}%` }} />
      </div>
    </Card>
  );
}

function ChartCard({ title, subtitle, revenueSeries, orderSeries }) {
  const maxValue = Math.max(...revenueSeries.map((item) => item.revenue), ...orderSeries.map((item) => item.deals * 18000));

  const revenuePoints = revenueSeries.map((item, index) => {
    const x = (index / Math.max(revenueSeries.length - 1, 1)) * 100;
    const y = 100 - (item.revenue / maxValue) * 82;
    return `${x},${y}`;
  }).join(" ");

  const orderPoints = orderSeries.map((item, index) => {
    const x = (index / Math.max(orderSeries.length - 1, 1)) * 100;
    const y = 100 - ((item.deals * 18000) / maxValue) * 82;
    return `${x},${y}`;
  }).join(" ");

  const areaPath = `${revenuePoints} 100,100 0,100`;

  return (
    <Card className="col-span-12 lg:col-span-8 p-6 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#211a17]">{title}</h3>
          <p className="mt-1 text-sm text-[#6c6355]">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-[#6c6355]">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#884c2d]" />
            Revenue
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#026769]" />
            Orders
          </span>
        </div>
      </div>

      <div className="rounded-[20px] border border-[#ead8d1] bg-[#fffdfc] p-4">
        <div className="h-[290px]">
          <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
            <defs>
              <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#884c2d" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#884c2d" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {[20, 40, 60, 80].map((line) => (
              <line key={line} x1="0" y1={line} x2="100" y2={line} stroke="#f0e3de" strokeWidth="0.4" />
            ))}

            <polygon points={areaPath} fill="url(#revenueFill)" />
            <polyline points={revenuePoints} fill="none" stroke="#884c2d" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
            <polyline points={orderPoints} fill="none" stroke="#026769" strokeWidth="1.5" strokeDasharray="2 2" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </div>

        <div
          className="mt-3 grid gap-2 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-[#8b7d73]"
          style={{ gridTemplateColumns: `repeat(${revenueSeries.length}, minmax(0, 1fr))` }}
        >
          {revenueSeries.map((item) => (
            <span key={item.month}>{item.month}</span>
          ))}
        </div>
      </div>
    </Card>
  );
}

function HealthCard({ onTimeCount, delayedCount, riskCount, onTimeRate }) {
  return (
    <Card className="col-span-12 lg:col-span-4 p-6 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
      <h3 className="text-lg font-semibold text-[#211a17]">Project Health</h3>
      <p className="mt-1 text-sm text-[#6c6355]">Current delivery quality across the active pipeline.</p>

      <div className="mt-8 flex justify-center">
        <div
          className="relative grid h-48 w-48 place-items-center rounded-full"
          style={{
            background: `conic-gradient(#026769 0 ${onTimeRate}%, #e2a46f ${onTimeRate}% ${Math.min(onTimeRate + 18, 96)}%, #d66d63 ${Math.min(onTimeRate + 18, 96)}% 100%)`,
          }}
        >
          <div className="grid h-32 w-32 place-items-center rounded-full bg-[#fff8f6] text-center">
            <p className="text-3xl font-semibold text-[#211a17]">{onTimeRate}%</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b6f63]">On Time</p>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {[
          { label: "On schedule", value: onTimeCount, dot: "bg-[#026769]" },
          { label: "Delayed", value: delayedCount, dot: "bg-[#e2a46f]" },
          { label: "At risk", value: riskCount, dot: "bg-[#d66d63]" },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-2xl border border-[#ead8d1] bg-[#fffdfc] px-4 py-3">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[#4b433d]">
              <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
              {item.label}
            </span>
            <span className="text-sm font-semibold text-[#211a17]">{item.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function statusPill(daysLeft, progress) {
  if (daysLeft <= 3 && progress < 85) return { label: "Needs attention", classes: "bg-[#fff1de] text-[#93591a]" };
  if (progress < 25) return { label: "Early stage", classes: "bg-[#ede7ff] text-[#5d45b3]" };
  return { label: "On track", classes: "bg-[#e5f5ef] text-[#026769]" };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [range, setRange] = useState(rangeOptions[0]);

  const metrics = useMemo(() => {
    const paidOrders = orders.filter((order) => order.status === "Paid");
    const totalRevenue = paidOrders.reduce((sum, order) => sum + parseCurrency(order.amount), 0);
    const activeProjects = projects.filter((project) => project.status !== "Completed");
    const newClients = recentLeads.length;
    const collectionRate = Math.round((paidOrders.length / orders.length) * 100);
    const avgProjectValue = Math.round(totalRevenue / Math.max(activeProjects.length, 1));

    const today = new Date();
    const timeline = activeProjects.map((project) => {
      const dueDate = new Date(project.dueDate);
      const diff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      return { ...project, daysLeft: diff };
    });

    const onTimeCount = timeline.filter((project) => project.daysLeft > 3 || project.progress >= 80).length;
    const delayedCount = timeline.filter((project) => project.daysLeft <= 3 && project.progress < 80).length;
    const riskCount = timeline.filter((project) => project.progress < 20).length;
    const avgCompletionDays = Math.round(
      timeline.reduce((sum, project) => sum + Math.max(project.daysLeft, 0), 0) / Math.max(timeline.length, 1)
    );
    const onTimeRate = Math.round((onTimeCount / Math.max(timeline.length, 1)) * 100);

    const priorityProjects = [...timeline]
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 4);

    const packageTotals = orders.reduce((acc, order) => {
      const amount = parseCurrency(order.amount);
      acc[order.package] = (acc[order.package] || 0) + amount;
      return acc;
    }, {});

    const packageEntries = Object.entries(packageTotals)
      .map(([name, value]) => ({
        name,
        value,
        share: Math.round((value / Math.max(totalRevenue, 1)) * 100),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    return {
      totalRevenue,
      activeProjects: activeProjects.length,
      newClients,
      collectionRate,
      avgProjectValue,
      avgCompletionDays,
      onTimeCount,
      delayedCount,
      riskCount,
      onTimeRate,
      priorityProjects,
      packageEntries,
    };
  }, []);

  const visibleRevenue = range === "Last 30 Days" ? revenueData.slice(-6) : salesData.map((item) => (
    revenueData.find((month) => month.month === item.month)
  )).filter(Boolean);
  const visibleOrders = salesData;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b6f63]">Executive command center</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#211a17]">Agency Overview</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c6355]">
            A cleaner snapshot of revenue, delivery pace, active projects, and service performance across The Copper Studio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 items-center gap-3 rounded-2xl border border-[#d8c2b9] bg-[#fff8f6] px-4">
            <CalendarDays size={16} className="text-[#884c2d]" />
            <select
              value={range}
              onChange={(event) => setRange(event.target.value)}
              className="bg-transparent text-sm font-semibold text-[#211a17] outline-none"
            >
              {rangeOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <Button variant="primary" size="lg" onClick={() => window.print()}>
            <Download size={15} />
            Export PDF
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KPIStat
          icon={IndianRupee}
          label="Total Revenue"
          value={formatCompactCurrency(metrics.totalRevenue)}
          hint="Paid order inflow"
          progress={76}
        />
        <KPIStat
          icon={BriefcaseBusiness}
          label="Active Projects"
          value={metrics.activeProjects}
          hint={`${projects.length} total in pipeline`}
          progress={68}
          tone="teal"
        />
        <KPIStat
          icon={UserPlus}
          label="New Clients"
          value={metrics.newClients}
          hint={`${companies.filter((company) => company.status === "Prospect").length} prospects warming up`}
          progress={48}
          tone="gold"
        />
        <KPIStat
          icon={TrendingUp}
          label="Collection Rate"
          value={`${metrics.collectionRate}%`}
          hint="Checkout to payment conversion"
          progress={metrics.collectionRate}
          tone="teal"
        />
        <KPIStat
          icon={Activity}
          label="Avg Project Value"
          value={formatCompactCurrency(metrics.avgProjectValue)}
          hint="Across live deliveries"
          progress={62}
        />
        <KPIStat
          icon={Clock3}
          label="Avg Completion"
          value={`${metrics.avgCompletionDays} days`}
          hint="Remaining turnaround window"
          progress={57}
          tone="rose"
        />
      </section>

      <section className="grid grid-cols-12 gap-6">
        <ChartCard
          title="Revenue vs Orders"
          subtitle="Monthly billing momentum compared with order volume."
          revenueSeries={visibleRevenue}
          orderSeries={visibleOrders}
        />
        <HealthCard
          onTimeCount={metrics.onTimeCount}
          delayedCount={metrics.delayedCount}
          riskCount={metrics.riskCount}
          onTimeRate={metrics.onTimeRate}
        />

        <Card className="col-span-12 lg:col-span-8 overflow-hidden shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
          <div className="flex flex-col gap-3 border-b border-[#ead8d1] px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#211a17]">Priority Projects</h3>
              <p className="mt-1 text-sm text-[#6c6355]">Projects requiring the closest supervision this week.</p>
            </div>
            <Button variant="ghost" className="justify-center text-[#884c2d]" onClick={() => navigate("/admin/projects")}>
              View all projects
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#f1e2dd]">
              <thead className="bg-[#fff3ef]">
                <tr className="text-left text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b6f63]">
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Progress</th>
                  <th className="px-6 py-4">Due</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5e8e4] bg-[#fff8f6]">
                {metrics.priorityProjects.map((project) => {
                  const pill = statusPill(project.daysLeft, project.progress);
                  return (
                    <tr
                      key={project.id}
                      onClick={() => navigate(`/admin/companies/${project.companyId}/projects/${project.id}`)}
                      className="cursor-pointer transition-colors hover:bg-[#fff3ef]"
                    >
                      <td className="px-6 py-5">
                        <p className="text-sm font-semibold text-[#211a17]">{project.name}</p>
                        <p className="mt-1 text-xs text-[#6c6355]">{project.status}</p>
                      </td>
                      <td className="px-6 py-5 text-sm text-[#4b433d]">{project.client}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-[#ede0db]">
                            <div className="h-full rounded-full bg-[#884c2d]" style={{ width: `${project.progress}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-[#211a17]">{project.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-[#4b433d]">
                        {project.daysLeft <= 0 ? "Due now" : `${project.daysLeft} days`}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${pill.classes}`}>
                          {pill.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-4 p-6 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[#211a17]">Package Distribution</h3>
              <p className="mt-1 text-sm text-[#6c6355]">Revenue share by service tier.</p>
            </div>
            <Badge color="blue">Live mix</Badge>
          </div>

          <div className="mt-8 space-y-6">
            {metrics.packageEntries.map((entry, index) => (
              <div key={entry.name}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-[#211a17]">{entry.name}</span>
                  <span className="font-semibold text-[#4b433d]">{formatCurrency(entry.value)}</span>
                </div>
                <div className="relative h-10 overflow-hidden rounded-2xl bg-[#f2e5df]">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-2xl ${
                      index === 0 ? "bg-[#884c2d]" : index === 1 ? "bg-[#a56645]" : "bg-[#026769]"
                    }`}
                    style={{ width: `${Math.max(entry.share, 18)}%`, opacity: index === 2 ? 0.9 : 1 }}
                  />
                  <div className="relative flex h-full items-center px-4 text-xs font-bold text-white">
                    {entry.share}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-[#ead8d1] bg-[#fffdfc] px-4 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b6f63]">Best performer</p>
            <p className="mt-2 text-sm font-semibold text-[#211a17]">{metrics.packageEntries[0]?.name || "Growth Studio"}</p>
            <p className="mt-1 text-xs text-[#6c6355]">Leading the month with the strongest contribution to realized revenue.</p>
          </div>
        </Card>
      </section>

      <section className="relative overflow-hidden rounded-[28px] border border-[#d8c2b9] bg-[#211a17]">
        <img
          src="/copper-studio-logo.jpeg"
          alt="The Copper Studio brand background"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(21,11,8,0.92)_0%,rgba(21,11,8,0.68)_44%,rgba(21,11,8,0.18)_100%)]" />
        <div className="relative flex min-h-[240px] flex-col justify-center gap-4 px-8 py-10 md:px-12">
          <Badge color="orange">Studio insight</Badge>
          <h3 className="max-w-2xl text-3xl font-semibold tracking-tight text-white">
            Your order flow is healthy, but two projects need tighter follow-through before week close.
          </h3>
          <p className="max-w-2xl text-sm leading-6 text-white/74">
            Payment collection is stable and package demand is centered around Growth Studio. The next best move is a focused review of urgent deliverables and any client waiting on approvals.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button variant="secondary" size="lg" className="border-white/20 bg-white text-[#211a17] hover:bg-[#fff1ec]">
              Review resource plan
            </Button>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white transition-opacity hover:opacity-85"
            >
              Open delivery tracker
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="p-6 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#211a17]">Pipeline Signals</h3>
              <p className="mt-1 text-sm text-[#6c6355]">Fresh client movement coming in from the sales side.</p>
            </div>
            <Badge color="purple">CRM live</Badge>
          </div>
          <div className="mt-6 grid gap-3">
            {recentLeads.map((lead) => (
              <div key={`${lead.email}-${lead.date}`} className="flex items-start justify-between gap-4 rounded-2xl border border-[#ead8d1] bg-[#fffdfc] px-4 py-4">
                <div>
                  <p className="text-sm font-semibold text-[#211a17]">{lead.name}</p>
                  <p className="mt-1 text-xs text-[#6c6355]">{lead.company} • {lead.email}</p>
                </div>
                <div className="text-right">
                  <Badge color="gray">{lead.stage}</Badge>
                  <p className="mt-2 text-[11px] font-medium text-[#7b6f63]">{lead.date}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#211a17]">Attention Queue</h3>
              <p className="mt-1 text-sm text-[#6c6355]">The small things that can turn into blockers fast.</p>
            </div>
            <CircleAlert size={18} className="text-[#aa3d33]" />
          </div>

          <div className="mt-6 space-y-3">
            {metrics.priorityProjects.slice(0, 3).map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/admin/companies/${project.companyId}/projects/${project.id}`)}
                className="cursor-pointer rounded-2xl border border-[#ead8d1] bg-[#fffdfc] px-4 py-4 transition-colors hover:bg-[#fff3ef]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#211a17]">{project.name}</p>
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#93591a]">
                    {project.daysLeft <= 0 ? "Due now" : `${project.daysLeft}d left`}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-[#6c6355]">
                  Client: {project.client}. Progress is at {project.progress}% and this delivery still needs follow-up to stay aligned with the committed timeline.
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
