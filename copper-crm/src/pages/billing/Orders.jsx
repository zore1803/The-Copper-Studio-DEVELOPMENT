import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  Download,
  Filter,
  IndianRupee,
  ReceiptText,
  RefreshCcw,
  Search,
  ShieldCheck
} from "lucide-react";
import { Badge, Button, Card } from "../../components/ui";
import { invoices, orders } from "../../data/mockData";

const tabs = ["All Orders", "Paid", "Pending", "Failed"];

function parseCurrency(value) {
  return Number(String(value).replace(/[^\d.-]/g, "")) || 0;
}

function MetricCard({ icon: Icon, title, value, hint, tone = "copper" }) {
  const tones = {
    copper: "bg-[#f3dfd7] text-[#884c2d]",
    green: "bg-[#dff4eb] text-[#026769]",
    amber: "bg-[#f8ead0] text-[#99621b]",
    rose: "bg-[#f6dddc] text-[#a23b33]",
  };

  return (
    <Card className="p-5 shadow-[0_14px_35px_rgba(79,39,16,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b6f63]">{title}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-[#211a17]">{value}</p>
          <p className="mt-1 text-xs text-[#6c6355]">{hint}</p>
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-full ${tones[tone]}`}>
          <Icon size={18} strokeWidth={2} />
        </div>
      </div>
    </Card>
  );
}

function statusTone(status) {
  if (status === "Paid") return "green";
  if (status === "Pending") return "orange";
  return "red";
}

export default function Orders() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState(location.state?.query || "");
  const [activeTab, setActiveTab] = useState("All Orders");

  const metrics = useMemo(() => {
    const totalRevenue = orders
      .filter((order) => order.status === "Paid")
      .reduce((sum, order) => sum + parseCurrency(order.amount), 0);
    const paid = orders.filter((order) => order.status === "Paid").length;
    const pendingValue = orders
      .filter((order) => order.status === "Pending")
      .reduce((sum, order) => sum + parseCurrency(order.amount), 0);
    const refundCount = invoices.filter((invoice) => invoice.status === "Overdue").length;

    return {
      totalRevenue,
      paid,
      pendingValue,
      refundCount,
    };
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const matchesTab = activeTab === "All Orders" || order.status === activeTab;
      const haystack = `${order.id} ${order.customer} ${order.package} ${order.invoice}`.toLowerCase();
      return matchesTab && haystack.includes(query.toLowerCase());
    });
  }, [activeTab, query]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b6f63]">Finance workspace</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#211a17]">Orders & Payments</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c6355]">
            Track checkout activity, order collection, invoice handoff, and payment health from one clean finance dashboard.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 items-center gap-3 rounded-2xl border border-[#d8c2b9] bg-[#fff8f6] px-4">
            <CalendarDays size={16} className="text-[#884c2d]" />
            <span className="text-sm font-semibold text-[#211a17]">Last 30 days</span>
          </div>
          <Button variant="secondary" size="lg">
            <Filter size={15} />
            Filters
          </Button>
          <Button size="lg">
            <Download size={15} />
            Export CSV
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={IndianRupee}
          title="Total Revenue"
          value={new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(metrics.totalRevenue)}
          hint="Paid collections this cycle"
        />
        <MetricCard
          icon={ShieldCheck}
          title="Successful"
          value={metrics.paid}
          hint="Orders captured successfully"
          tone="green"
        />
        <MetricCard
          icon={CircleDollarSign}
          title="Pending"
          value={new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(metrics.pendingValue)}
          hint="Awaiting payment confirmation"
          tone="amber"
        />
        <MetricCard
          icon={RefreshCcw}
          title="Attention"
          value={metrics.refundCount}
          hint="Invoices or payment issues to review"
          tone="rose"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
          <div className="border-b border-[#ead8d1] bg-[#fff3ef] px-6 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-5">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`border-b-2 pb-1 text-sm font-semibold transition-colors ${
                      activeTab === tab
                        ? "border-[#884c2d] text-[#884c2d]"
                        : "border-transparent text-[#6c6355] hover:text-[#211a17]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-[#d8c2b9] bg-[#fff8f6] px-3 py-2.5">
                <Search size={15} className="text-[#7b6f63]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search orders, clients, package, invoice..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#a8948b]"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[#fffaf8]">
                <tr className="text-left text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b6f63]">
                  {["Order ID", "Client", "Package", "Amount", "Invoice", "Status", "Date", "Action"].map((heading) => (
                    <th key={heading} className="px-6 py-4">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1e2dd] bg-[#fff8f6]">
                {filtered.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-[#fff3ef]">
                    <td className="px-6 py-4 text-xs font-mono font-semibold text-[#884c2d]">{order.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#f0dfd7] text-xs font-bold text-[#884c2d]">
                          {order.customer.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#211a17]">{order.customer}</p>
                          <p className="text-xs text-[#6c6355]">Checkout linked to {order.invoice}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4b433d]">{order.package}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#211a17]">{order.amount}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#f5e6e1] px-2.5 py-1 text-[11px] font-bold text-[#6c6355]">
                        <ReceiptText size={12} />
                        {order.invoice}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge color={statusTone(order.status)}>{order.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6c6355]">{order.date}</td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => navigate("/admin/invoices", { state: { query: order.invoice } })}
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-[#884c2d] transition-colors hover:bg-[#f3dfd7]"
                      >
                        View Invoice
                        <ArrowUpRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#211a17]">Payment Health</h3>
                <p className="mt-1 text-sm text-[#6c6355]">Quick revenue posture for the live order flow.</p>
              </div>
              <CreditCard size={18} className="text-[#884c2d]" />
            </div>

            <div className="mt-6 space-y-4">
              {[
                ["Collection rate", `${Math.round((orders.filter((order) => order.status === "Paid").length / orders.length) * 100)}%`],
                ["Failed attempts", `${orders.filter((order) => order.status === "Failed").length}`],
                ["GST invoices", `${invoices.length}`],
                ["Average order value", new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(metrics.totalRevenue / Math.max(orders.length, 1))],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-2xl border border-[#ead8d1] bg-[#fffdfc] px-4 py-3">
                  <span className="text-sm text-[#6c6355]">{label}</span>
                  <span className="text-sm font-semibold text-[#211a17]">{value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
            <h3 className="text-lg font-semibold text-[#211a17]">Recent Billing Notes</h3>
            <div className="mt-5 space-y-3">
              {[
                "Payment success email and portal invite should trigger right after paid checkout.",
                "Pending orders need follow-up if they remain unpaid for more than 24 hours.",
                "Failed payments should surface a retry path before manual intervention.",
              ].map((note) => (
                <div key={note} className="rounded-2xl border border-[#ead8d1] bg-[#fffdfc] px-4 py-4 text-sm leading-6 text-[#4b433d]">
                  {note}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
