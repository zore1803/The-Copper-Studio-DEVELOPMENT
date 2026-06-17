import { useMemo, useState } from "react";
import { CalendarDays, CreditCard, FileText, PackageCheck, Plus, ReceiptText, Save, Search, WalletCards } from "lucide-react";
import { Button } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import SidePanel from "../../components/SidePanel";

function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function parseMoney(value) {
  return Number(String(value || "").replace(/[^\d.-]/g, "")) || 0;
}

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fff1ec] text-[#884c2d]">
          <Icon size={17} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">{label}</p>
          <p className="mt-0.5 text-lg font-bold text-[#111827]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="rounded-xl border border-dashed border-[#d8c2b9] bg-white p-10 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[#fff1ec] text-[#884c2d]">
        <PackageCheck size={20} />
      </div>
      <p className="text-sm font-semibold text-[#111827]">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-[#6b7280]">{text}</p>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", options }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[#374151]">{label}</span>
      {options ? (
        <select value={value || ""} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d]">
          {options.map((opt) => <option key={opt}>{opt}</option>)}
        </select>
      ) : (
        <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20" />
      )}
    </label>
  );
}

function OrderModal({ mode, companies, onClose, onSave }) {
  const isPayment = mode === "payments";
  const [form, setForm] = useState(isPayment
    ? { orderId: "", company: "", amount: "", method: "UPI", gateway: "Razorpay", status: "Success" }
    : { company: "", client: "", package: "", couponCode: "", amount: "", paymentStatus: "Created", projectStatus: "Not created" });
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <SidePanel
      title={isPayment ? "New Payment" : "New Order"}
      subtitle={isPayment ? "Record a payment received against an order." : "Create a new order to track purchase intent."}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}><Save size={14} /> Save {isPayment ? "Payment" : "Order"}</Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {isPayment ? (
          <>
            <Field label="Order ID" value={form.orderId} onChange={set("orderId")} />
            <Field label="Company" value={form.company} onChange={set("company")} options={["", ...companies.map((c) => c.name)]} />
            <Field label="Amount" type="number" value={form.amount} onChange={set("amount")} />
            <Field label="Method" value={form.method} onChange={set("method")} options={["UPI", "Card", "Netbanking", "Wallet", "Bank Transfer"]} />
            <Field label="Gateway" value={form.gateway} onChange={set("gateway")} options={["Razorpay", "Stripe", "Manual"]} />
            <Field label="Status" value={form.status} onChange={set("status")} options={["Success", "Pending", "Failed", "Refunded"]} />
          </>
        ) : (
          <>
            <Field label="Company" value={form.company} onChange={set("company")} options={["", ...companies.map((c) => c.name)]} />
            <Field label="Client" value={form.client} onChange={set("client")} />
            <Field label="Package" value={form.package} onChange={set("package")} />
            <Field label="Coupon code" value={form.couponCode} onChange={set("couponCode")} />
            <Field label="Amount" type="number" value={form.amount} onChange={set("amount")} />
            <Field label="Payment status" value={form.paymentStatus} onChange={set("paymentStatus")} options={["Created", "Pending Payment", "Paid", "Failed", "Refunded", "Cancelled"]} />
          </>
        )}
      </div>
    </SidePanel>
  );
}

export default function Orders({ mode = "orders" }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [creating, setCreating] = useState(false);
  const { records: companies } = useCrmRecords("companies");
  const { records: orders, save: saveOrder } = useCrmRecords("orders");
  const { records: payments, save: savePayment } = useCrmRecords("payments");
  const { records: invoices } = useCrmRecords("invoices");
  const { showToast } = useToast();

  const rows = mode === "payments" ? payments : orders;
  const filtered = useMemo(() => rows.filter((row) => {
    const rowStatus = row.status || row.paymentStatus || "Created";
    const matchesStatus = status === "All" || rowStatus === status;
    const haystack = `${row.orderId || row.paymentId || row.id || ""} ${row.company || ""} ${row.client || row.customer || ""} ${row.package || row.packageName || ""} ${rowStatus}`.toLowerCase();
    return matchesStatus && haystack.includes(query.toLowerCase());
  }), [query, rows, status]);

  const successfulPayments = payments.filter((payment) => ["Success", "Paid", "successful"].includes(payment.status));
  const paidOrders = orders.filter((order) => ["Paid", "Success"].includes(order.status || order.paymentStatus));
  const revenue = successfulPayments.reduce((sum, payment) => sum + parseMoney(payment.amount), 0) ||
    paidOrders.reduce((sum, order) => sum + parseMoney(order.finalAmount || order.amount), 0);
  const pending = orders.filter((order) => /pending/i.test(order.status || order.paymentStatus || "")).reduce((sum, order) => sum + parseMoney(order.finalAmount || order.amount), 0);

  const title = mode === "payments" ? "Payments" : "Orders";
  const subtitle = mode === "payments"
    ? "Actual money received, Razorpay mapping, refund state, and payment audit."
    : "Purchase intent, coupon application, payment status, invoice handoff, and project activation.";

  async function handleCreate(form) {
    if (mode === "payments") {
      const created = await savePayment({ ...form, id: `payment-${Date.now()}`, paymentId: `PAY-${Date.now().toString().slice(-8)}`, createdAt: new Date().toISOString() });
      showToast({ title: "Payment recorded", message: `${created.paymentId} saved.` });
    } else {
      const created = await saveOrder({ ...form, id: `order-${Date.now()}`, orderId: `ORD-${Date.now().toString().slice(-8)}`, createdAt: new Date().toISOString() });
      showToast({ title: "Order created", message: `${created.orderId} saved.` });
    }
    setCreating(false);
  }

  return (
    <div className="min-h-full bg-[#f5f6fa] p-6">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9ca3af]">Finance</p>
          <h1 className="mt-1 text-2xl font-bold text-[#111827]">{title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-[#6b7280]">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-9 items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3">
            <CalendarDays size={14} className="text-[#9ca3af]" />
            <span className="text-sm text-[#374151]">All time</span>
          </div>
          <Button onClick={() => setCreating(true)}><Plus size={14} /> New {mode === "payments" ? "Payment" : "Order"}</Button>
        </div>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total Revenue" value={money(revenue)} icon={WalletCards} />
        <Metric label="Pending Payments" value={money(pending)} icon={CreditCard} />
        <Metric label="Successful Payments" value={successfulPayments.length || paidOrders.length} icon={PackageCheck} />
        <Metric label="Invoices" value={invoices.length} icon={ReceiptText} />
      </div>

      <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#f3f4f6] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {["All", "Created", "Pending Payment", "Paid", "Failed", "Refunded", "Cancelled", "Success"].map((item) => (
              <button
                key={item}
                onClick={() => setStatus(item)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${status === item ? "bg-[#884c2d] text-white" : "bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb]"}`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex h-9 items-center gap-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3">
            <Search size={14} className="text-[#9ca3af]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${title.toLowerCase()}`} className="w-64 bg-transparent text-sm outline-none" />
          </div>
        </div>

        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[#fafafa]">
                <tr className="text-left text-xs font-bold uppercase tracking-wide text-[#9ca3af]">
                  {(mode === "payments"
                    ? ["Payment ID", "Order ID", "Company", "Amount", "Method", "Gateway", "Status"]
                    : ["Order ID", "Company", "Client", "Package", "Coupon", "Amount", "Payment", "Project"]
                  ).map((head) => <th key={head} className="px-4 py-3">{head}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {filtered.map((row) => mode === "payments" ? (
                  <tr key={row._id || row.id || row.paymentId} className="hover:bg-[#fafafa]">
                    <td className="px-4 py-3 font-mono text-xs text-[#6b7280]">{row.paymentId || row.id || row._id}</td>
                    <td className="px-4 py-3 text-sm text-[#374151]">{row.orderId || "Not linked"}</td>
                    <td className="px-4 py-3 text-sm text-[#374151]">{row.company || "Not linked"}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#111827]">{money(parseMoney(row.amount))}</td>
                    <td className="px-4 py-3 text-sm text-[#374151]">{row.paymentMethod || row.method || "Not added"}</td>
                    <td className="px-4 py-3 text-sm text-[#374151]">{row.gateway || "Razorpay"}</td>
                    <td className="px-4 py-3"><Status value={row.status || "Pending"} /></td>
                  </tr>
                ) : (
                  <tr key={row._id || row.id || row.orderId} className="hover:bg-[#fafafa]">
                    <td className="px-4 py-3 font-mono text-xs text-[#6b7280]">{row.orderId || row.id || row._id}</td>
                    <td className="px-4 py-3 text-sm text-[#374151]">{row.company || "Not linked"}</td>
                    <td className="px-4 py-3 text-sm text-[#374151]">{row.client || row.customer || "Not added"}</td>
                    <td className="px-4 py-3 text-sm text-[#374151]">{row.package || row.packageName || "Not added"}</td>
                    <td className="px-4 py-3 text-sm text-[#374151]">{row.couponCode || row.couponId || "None"}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#111827]">{money(parseMoney(row.finalAmount || row.amount))}</td>
                    <td className="px-4 py-3"><Status value={row.paymentStatus || row.status || "Created"} /></td>
                    <td className="px-4 py-3 text-sm text-[#374151]">{row.projectStatus || "Not created"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={`No ${title.toLowerCase()} yet.`}
            text={mode === "payments" ? "Successful Razorpay payments and refunds will appear here." : "Orders will be created from accepted proposals, coupons, and checkout/payment flows."}
          />
        )}
      </section>

      {creating && <OrderModal mode={mode} companies={companies} onClose={() => setCreating(false)} onSave={handleCreate} />}
    </div>
  );
}

function Status({ value }) {
  const tone = /paid|success/i.test(value)
    ? "bg-emerald-50 text-emerald-700"
    : /fail|cancel|refund/i.test(value)
      ? "bg-red-50 text-red-600"
      : /pending|processing/i.test(value)
        ? "bg-amber-50 text-amber-700"
        : "bg-[#f3f4f6] text-[#6b7280]";
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${tone}`}>{value}</span>;
}
