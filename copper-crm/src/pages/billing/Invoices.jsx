import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Download, Plus, Search } from "lucide-react";
import { Button, StatusBadge, SectionCard } from "../../components/ui";
import { invoices } from "../../data/mockData";

export default function Invoices() {
  const location = useLocation();
  const [search, setSearch] = useState(location.state?.query || "");
  const filtered = invoices.filter((i) =>
    i.client.toLowerCase().includes(search.toLowerCase()) || i.id.includes(search)
  );
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Invoices</h1>
          <p className="text-xs text-gray-400 mt-0.5">GST invoices and billing history</p>
        </div>
        <Button><Plus size={13} strokeWidth={2.5} /> Generate Invoice</Button>
      </div>
      <SectionCard>
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-50">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 flex-1 max-w-xs">
            <Search size={13} className="text-gray-300" />
            <input className="bg-transparent text-xs outline-none placeholder-gray-300 w-full"
              placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50">
              {["Invoice","Client","Base Amount","GST 18%","Total","Status","Date",""].map((h) => (
                <th key={h} className="text-left py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group border-b border-gray-50 last:border-0">
                <td className="py-3 px-5 text-[11px] font-mono font-semibold text-[#2563EB]">{inv.id}</td>
                <td className="py-3 px-5 text-sm font-semibold text-gray-900">{inv.client}</td>
                <td className="py-3 px-5 text-xs text-gray-600">{inv.amount}</td>
                <td className="py-3 px-5 text-xs text-gray-400">{inv.gst}</td>
                <td className="py-3 px-5 text-sm font-bold text-gray-900">{inv.total}</td>
                <td className="py-3 px-5"><StatusBadge status={inv.status} /></td>
                <td className="py-3 px-5 text-[11px] text-gray-400">{inv.date}</td>
                <td className="py-3 px-5 text-right">
                  <button className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] text-gray-400 hover:text-[#2563EB] transition-all ml-auto font-medium">
                    <Download size={12} /> PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}
