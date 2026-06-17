import { useNavigate, useParams } from "react-router-dom";
import { Calendar, ChevronLeft, Pencil, Trash2, TrendingUp, User } from "lucide-react";
import { Button } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";

const dealsSeed = [
  { id: "D-101", name: "Retail app redesign", account: "Zara India", contact: "Meera Kapoor", value: "₹2,93,898", stage: "Negotiation", close: "20 Jun, 2026" },
  { id: "D-102", name: "Enterprise dashboard", account: "LogiTrack", contact: "Vikram Nair", value: "₹1,19,999", stage: "Proposal Sent", close: "24 Jun, 2026" },
];

export default function DealDetail() {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { records: deals } = useCrmRecords("deals", dealsSeed);
  const deal = deals.find((d) => (d._id || d.id) === dealId) || dealsSeed[0] || {};

  const chips = [
    { icon: TrendingUp, label: "Deal Value", value: deal.value || "₹2,93,898", sub: "Total Deal Amount", color: "text-blue-500 bg-blue-50" },
    { icon: () => <span className="text-xs font-bold">🏢</span>, label: "Company", value: deal.account || "SCIVYT", sub: "Associated Company", color: "text-gray-600 bg-gray-100" },
    { icon: User, label: "Contact Person", value: deal.contact || "Contact Name", sub: "Primary Contact", color: "text-purple-500 bg-purple-50" },
    { icon: Calendar, label: "Added On", value: deal.close || "12th June, 2026", sub: deal.account || "Asterisks.Inc", color: "text-blue-400 bg-blue-50" },
  ];

  return (
    <div className="p-5 xl:p-6 bg-[#f9fafb] min-h-full">
      <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900">
            <ChevronLeft size={16} /> {deal.name || "Deal Name Goes Here"}
          </button>
          <span className="text-gray-300">»</span>
          <span className="text-gray-500">{deal.stage || "Stage Name Goes Here"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm"><Pencil size={13} /> Edit</Button>
          <button className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">
            <Trash2 size={13} /> Delete Deal
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
        <div className="grid grid-cols-4 gap-4 border-b border-gray-100 pb-5 mb-5">
          {chips.map(({ icon: Icon, label, value, sub, color }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
                <Icon size={16} />
              </div>
              <div>
                <p className="text-[11px] text-gray-400">{label}</p>
                <p className="text-base font-bold text-gray-900">{value}</p>
                <p className="text-[11px] text-gray-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="py-16 text-center text-sm text-gray-300">
          Deal activity and notes will appear here.
        </div>
      </div>
    </div>
  );
}
