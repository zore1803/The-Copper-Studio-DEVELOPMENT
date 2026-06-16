import { ShoppingBag, FolderOpen, Clock, Bell, CheckCircle, Circle, ArrowRight } from "lucide-react";
import { SectionCard } from "../../components/ui";

const purchases = [
  { name: "Growth Studio", price: "₹58,999", date: "12 Jun 2026", status: "Active" },
];

const milestones = [
  { label: "Requirement Gathering", done: true },
  { label: "Design", done: true },
  { label: "Development", done: false },
  { label: "Testing", done: false },
  { label: "Deployment", done: false },
];

const updates = [
  { text: "Design phase completed — Figma files shared", time: "2h ago", type: "success" },
  { text: "Invoice INV-001 generated and emailed", time: "1d ago", type: "info" },
  { text: "Project kickoff call scheduled for 16 Jun", time: "2d ago", type: "info" },
];

const statCards = [
  { icon: ShoppingBag, label: "Purchased Packages", value: "1", bg: "bg-blue-50", color: "text-[#2563EB]" },
  { icon: FolderOpen, label: "Active Projects", value: "1", bg: "bg-emerald-50", color: "text-emerald-600" },
  { icon: Clock, label: "Upcoming Milestones", value: "3", bg: "bg-amber-50", color: "text-amber-600" },
];

export default function ClientDashboard() {
  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-base font-semibold text-gray-900">Your Dashboard</h1>
        <p className="text-xs text-gray-400 mt-0.5">Track your projects, invoices and documents in one place.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        {statCards.map((s) => (
          <SectionCard key={s.label}>
            <div className="flex items-center gap-4 p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>
                <s.icon size={18} className={s.color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-[11px] text-gray-400">{s.label}</p>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <SectionCard className="col-span-2">
          <div className="p-5">
            <p className="text-sm font-semibold text-gray-900 mb-4">Zara Retail App · Progress</p>
            <div className="mb-5">
              <div className="flex justify-between text-[11px] text-gray-400 mb-2">
                <span>Overall Progress</span>
                <span className="font-bold text-gray-700">85%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#2563EB] rounded-full" style={{ width: "85%" }} />
              </div>
            </div>
            <div className="space-y-3">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  {m.done
                    ? <CheckCircle size={15} className="text-emerald-500 flex-shrink-0" />
                    : <Circle size={15} className="text-gray-200 flex-shrink-0" />}
                  <span className={`text-xs font-medium ${m.done ? "text-gray-800" : "text-gray-400"}`}>{m.label}</span>
                  {m.done && (
                    <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">Done</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={13} className="text-gray-400" />
              <p className="text-sm font-semibold text-gray-900">Recent Updates</p>
            </div>
            <div className="space-y-4">
              {updates.map((u, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${u.type === "success" ? "bg-emerald-500" : "bg-[#2563EB]"}`} />
                  <div>
                    <p className="text-xs text-gray-700 leading-snug">{u.text}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{u.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-900">My Purchases</p>
            <button className="text-[11px] text-[#2563EB] font-medium flex items-center gap-1 hover:underline">
              View invoices <ArrowRight size={11} />
            </button>
          </div>
          {purchases.map((p) => (
            <div key={p.name} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl">
              <div>
                <p className="text-xs font-semibold text-gray-900">{p.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{p.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{p.price}</p>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
