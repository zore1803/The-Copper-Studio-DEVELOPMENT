import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Search, Plus, Download } from "lucide-react";
import { Button, StatusBadge, Avatar, SectionCard } from "../../components/ui";
import { orders } from "../../data/mockData";

export default function Orders() {
  const location = useLocation();
  const [search, setSearch] = useState(location.state?.query || "");
  const filtered = orders.filter((o) =>
    o.customer.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search)
  );
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Orders</h1>
          <p className="text-xs text-gray-400 mt-0.5">{orders.length} total orders</p>
        </div>
        <Button><Plus size={13} strokeWidth={2.5} /> New Order</Button>
      </div>
      <SectionCard>
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-50">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 flex-1 max-w-xs">
            <Search size={13} className="text-gray-300" />
            <input className="bg-transparent text-xs outline-none placeholder-gray-300 w-full"
              placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50">
              {["Order ID","Customer","Package","Amount","Invoice","Status","Date",""].map((h) => (
                <th key={h} className="text-left py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50/50 transition-colors group border-b border-gray-50 last:border-0">
                <td className="py-3 px-5 text-[11px] font-mono text-gray-400">{o.id}</td>
                <td className="py-3 px-5">
                  <div className="flex items-center gap-2">
                    <Avatar name={o.customer} size="sm" />
                    <span className="text-xs font-semibold text-gray-900">{o.customer}</span>
                  </div>
                </td>
                <td className="py-3 px-5 text-[11px] text-gray-400">{o.package}</td>
                <td className="py-3 px-5 text-sm font-bold text-gray-900">{o.amount}</td>
                <td className="py-3 px-5 text-[11px] font-mono text-[#2563EB]">{o.invoice}</td>
                <td className="py-3 px-5"><StatusBadge status={o.status} /></td>
                <td className="py-3 px-5 text-[11px] text-gray-400">{o.date}</td>
                <td className="py-3 px-5 text-right">
                  <button className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-[#2563EB] transition-all">
                    <Download size={13} />
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
