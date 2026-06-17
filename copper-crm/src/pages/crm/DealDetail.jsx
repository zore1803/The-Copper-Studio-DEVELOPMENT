import { useNavigate, useParams } from "react-router-dom";
import { Calendar, ChevronLeft, Pencil, Trash2, TrendingUp, User } from "lucide-react";
import { Button } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";

export default function DealDetail() {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { records: deals } = useCrmRecords("deals");
  const deal = deals.find((d) => String(d._id || d.id) === String(dealId));

  if (!deal) {
    return (
      <div className="m-6 rounded-xl border border-gray-200 bg-white p-12 text-center">
        <p className="text-sm font-semibold text-gray-500">Deal not found.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate("/admin/deals")}>Back to Deals</Button>
      </div>
    );
  }

  const chips = [
    { icon: TrendingUp, label: "Deal Value", value: deal.value || "Not added", sub: "Total deal amount", color: "text-blue-500 bg-blue-50" },
    { icon: () => <span className="text-xs font-bold">CO</span>, label: "Company", value: deal.account || "Not linked", sub: "Associated company", color: "text-gray-600 bg-gray-100" },
    { icon: User, label: "Contact Person", value: deal.contact || deal.owner || "Not linked", sub: "Primary contact", color: "text-purple-500 bg-purple-50" },
    { icon: Calendar, label: "Close Date", value: deal.close || "Not set", sub: deal.stage || "No stage", color: "text-blue-400 bg-blue-50" },
  ];

  return (
    <div className="min-h-full bg-[#f9fafb] p-5 xl:p-6">
      <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gray-900">
          <ChevronLeft size={16} /> {deal.name || "Untitled deal"}
        </button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm"><Pencil size={13} /> Edit</Button>
          <button className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">
            <Trash2 size={13} /> Delete Deal
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 grid gap-4 border-b border-gray-100 pb-5 sm:grid-cols-2 xl:grid-cols-4">
          {chips.map(({ icon: Icon, label, value, sub, color }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
                <Icon size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400">{label}</p>
                <p className="truncate text-base font-bold text-gray-900">{value}</p>
                <p className="text-[11px] text-gray-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="py-16 text-center text-sm text-gray-300">Deal activity and notes will appear here.</div>
      </div>
    </div>
  );
}
