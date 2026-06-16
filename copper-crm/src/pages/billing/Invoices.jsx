import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  BadgeIndianRupee,
  CalendarDays,
  Download,
  FileSpreadsheet,
  Filter,
  ReceiptText,
  Search,
  ShieldCheck,
  WalletCards
} from "lucide-react";
import { Badge, Button, Card } from "../../components/ui";
import { invoices } from "../../data/mockData";

function parseCurrency(value) {
  return Number(String(value).replace(/[^\d.-]/g, "")) || 0;
}

function Metric({ icon: Icon, label, value, hint, tone = "copper" }) {
  const tones = {
    copper: "bg-[#f3dfd7] text-[#884c2d]",
    teal: "bg-[#dff4eb] text-[#026769]",
    amber: "bg-[#f8ead0] text-[#99621b]",
    rose: "bg-[#f6dddc] text-[#a23b33]",
  };

  return (
    <Card className="p-5 shadow-[0_14px_35px_rgba(79,39,16,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b6f63]">{label}</p>
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

export default function Invoices() {
  const location = useLocation();
  const [search, setSearch] = useState(location.state?.query || "");

  const filtered = useMemo(
    () => invoices.filter((invoice) =>
      `${invoice.id} ${invoice.client} ${invoice.status}`.toLowerCase().includes(search.toLowerCase())
    ),
    [search]
  );

  const totals = useMemo(() => {
    const gross = invoices.reduce((sum, invoice) => sum + parseCurrency(invoice.total), 0);
    const gst = invoices.reduce((sum, invoice) => sum + parseCurrency(invoice.gst), 0);
    const paid = invoices.filter((invoice) => invoice.status === "Paid").length;
    const overdue = invoices.filter((invoice) => invoice.status === "Overdue").length;
    return { gross, gst, paid, overdue };
  }, []);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b6f63]">Finance workspace</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#211a17]">Invoices & GST</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c6355]">
            Monitor invoice generation, GST totals, paid billing, and overdue recovery from one cleaner finance screen.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 items-center gap-3 rounded-2xl border border-[#d8c2b9] bg-[#fff8f6] px-4">
            <CalendarDays size={16} className="text-[#884c2d]" />
            <span className="text-sm font-semibold text-[#211a17]">Current cycle</span>
          </div>
          <Button variant="secondary" size="lg">
            <Filter size={15} />
            Filter
          </Button>
          <Button size="lg">
            <Download size={15} />
            Export PDF
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={BadgeIndianRupee}
          label="Gross Billing"
          value={new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(totals.gross)}
          hint="Total invoice value"
        />
        <Metric
          icon={ReceiptText}
          label="GST Collected"
          value={new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(totals.gst)}
          hint="Across generated invoices"
          tone="amber"
        />
        <Metric
          icon={ShieldCheck}
          label="Paid Invoices"
          value={totals.paid}
          hint="Settled successfully"
          tone="teal"
        />
        <Metric
          icon={WalletCards}
          label="Overdue"
          value={totals.overdue}
          hint="Need collection follow-up"
          tone="rose"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
          <div className="border-b border-[#ead8d1] bg-[#fff3ef] px-6 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#211a17]">Invoice Register</h3>
                <p className="mt-1 text-sm text-[#6c6355]">GST-ready invoice history with payment state and totals.</p>
              </div>
              <div className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-[#d8c2b9] bg-[#fff8f6] px-3 py-2.5">
                <Search size={15} className="text-[#7b6f63]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search invoice, client, status..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#a8948b]"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[#fffaf8]">
                <tr className="text-left text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b6f63]">
                  {["Invoice", "Client", "Base Amount", "GST", "Total", "Status", "Date", "Action"].map((heading) => (
                    <th key={heading} className="px-6 py-4">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1e2dd] bg-[#fff8f6]">
                {filtered.map((invoice) => (
                  <tr key={invoice.id} className="transition-colors hover:bg-[#fff3ef]">
                    <td className="px-6 py-4 text-xs font-mono font-semibold text-[#884c2d]">{invoice.id}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-[#211a17]">{invoice.client}</p>
                      <p className="text-xs text-[#6c6355]">GST billing record</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4b433d]">{invoice.amount}</td>
                    <td className="px-6 py-4 text-sm text-[#4b433d]">{invoice.gst}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#211a17]">{invoice.total}</td>
                    <td className="px-6 py-4">
                      <Badge color={invoice.status === "Paid" ? "green" : invoice.status === "Overdue" ? "red" : "orange"}>
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6c6355]">{invoice.date}</td>
                    <td className="px-6 py-4">
                      <button className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-[#884c2d] transition-colors hover:bg-[#f3dfd7]">
                        <FileSpreadsheet size={12} />
                        Download
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
            <h3 className="text-lg font-semibold text-[#211a17]">Billing Snapshot</h3>
            <div className="mt-5 space-y-3">
              {[
                ["Invoice prefix", "INV"],
                ["GST mode", "18% enabled"],
                ["Payment gateway", "Razorpay"],
                ["Portal invite trigger", "After payment success"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-2xl border border-[#ead8d1] bg-[#fffdfc] px-4 py-3">
                  <span className="text-sm text-[#6c6355]">{label}</span>
                  <span className="text-sm font-semibold text-[#211a17]">{value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
            <h3 className="text-lg font-semibold text-[#211a17]">Collections Notes</h3>
            <div className="mt-5 space-y-3">
              {[
                "Paid invoices should remain linked to client onboarding records.",
                "Overdue invoices should push visible follow-up reminders for admin review.",
                "Invoice exports should stay consistent with GST-ready formatting and client company details.",
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
