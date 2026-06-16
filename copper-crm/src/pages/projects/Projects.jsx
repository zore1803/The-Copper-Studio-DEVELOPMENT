import { Plus, Calendar, MoreHorizontal } from "lucide-react";
import { Button } from "../../components/ui";
import { projects } from "../../data/mockData";

const statusColor = {
  "In Progress": "bg-blue-50 text-blue-700",
  Design: "bg-violet-50 text-violet-700",
  Development: "bg-amber-50 text-amber-700",
  "Requirement Gathering": "bg-gray-100 text-gray-600",
  Review: "bg-indigo-50 text-indigo-700",
  Completed: "bg-emerald-50 text-emerald-700",
};

const progressColor = (p) => p >= 80 ? "bg-emerald-500" : p >= 50 ? "bg-[#2563EB]" : "bg-amber-400";

export default function Projects() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Projects</h1>
          <p className="text-xs text-gray-400 mt-0.5">{projects.length} active projects</p>
        </div>
        <Button><Plus size={13} strokeWidth={2.5} /> New Project</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {projects.map((p) => (
          <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-sm transition-shadow group cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.client}</p>
              </div>
              <button className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-600 transition-all">
                <MoreHorizontal size={15} />
              </button>
            </div>

            <div className="mb-4">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusColor[p.status] || "bg-gray-100 text-gray-600"}`}>
                {p.status}
              </span>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-[11px] text-gray-400 mb-2">
                <span>Progress</span>
                <span className="font-bold text-gray-700">{p.progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${progressColor(p.progress)} rounded-full transition-all`} style={{ width: `${p.progress}%` }} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex -space-x-1.5">
                {p.team.map((t, i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-[#2563EB] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                    {t}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                <Calendar size={11} />
                {p.dueDate}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
