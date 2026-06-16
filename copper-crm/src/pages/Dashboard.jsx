import { useMemo, useState } from "react";
import { CalendarDays, Filter, FolderKanban, Search, SlidersHorizontal } from "lucide-react";
import { projects } from "../data/mockData";

const monthDays = Array.from({ length: 14 }, (_, index) => index + 16);
const statusTone = {
  "In Progress": "bg-blue-500",
  Design: "bg-violet-500",
  Development: "bg-amber-500",
  "Requirement Gathering": "bg-gray-500",
  Review: "bg-indigo-500",
  Completed: "bg-emerald-500",
};

function Card({ children, className = "" }) {
  return <section className={`rounded-xl border border-gray-200 bg-white shadow-sm shadow-gray-100/60 ${className}`}>{children}</section>;
}

function projectStart(index) {
  return Math.max(0, (index * 2) % 8);
}

function projectSpan(project) {
  if (project.progress >= 80) return 9;
  if (project.progress >= 50) return 7;
  return 5;
}

export default function Dashboard() {
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const statuses = ["All", ...new Set(projects.map((project) => project.status))];
  const priorities = ["All", ...new Set(projects.map((project) => project.priority))];
  const filtered = useMemo(() => projects.filter((project) => {
    const matchesStatus = status === "All" || project.status === status;
    const matchesPriority = priority === "All" || project.priority === priority;
    const matchesSearch = `${project.name} ${project.client}`.toLowerCase().includes(query.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  }), [query, status, priority]);

  return (
    <div className="p-5 xl:p-6">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">Admin home</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">Project Gantt Chart</h1>
          <p className="mt-1 text-sm text-gray-500">Timeline view for active delivery, filtered by project status and client.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3">
            <CalendarDays size={14} className="text-[#2563EB]" />
            <span className="text-xs font-bold text-gray-600">16 Jun - 29 Jun</span>
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition-colors ${
              filtersOpen ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <SlidersHorizontal size={14} />
            Filters
          </button>
        </div>
      </div>

      {filtersOpen && (
        <Card className="mb-5 flex flex-wrap items-center gap-3 p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Priority</span>
          {priorities.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPriority(item)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
                priority === item ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {item}
            </button>
          ))}
        </Card>
      )}

      <div className="mb-5 grid gap-4 md:grid-cols-4">
        {[
          ["Total projects", projects.length],
          ["In progress", projects.filter((project) => project.status === "In Progress").length],
          ["Avg progress", `${Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length)}%`],
          ["At risk", projects.filter((project) => project.priority === "urgent").length],
        ].map(([label, value]) => (
          <Card key={label} className="p-4">
            <FolderKanban size={18} className="text-[#2563EB]" />
            <p className="mt-3 text-2xl font-bold text-gray-950">{value}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="grid gap-3 border-b border-gray-100 p-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
            <Search size={14} className="text-gray-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search project or client" className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" />
          </div>
          <div className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3">
            <Filter size={14} className="text-gray-400" />
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full bg-transparent text-xs font-bold text-gray-600 outline-none">
              {statuses.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[260px_repeat(14,minmax(48px,1fr))] border-b border-gray-100 bg-gray-50/80">
              <div className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Project</div>
              {monthDays.map((day) => (
                <div key={day} className="border-l border-gray-100 px-2 py-3 text-center text-[11px] font-bold text-gray-400">Jun {day}</div>
              ))}
            </div>

            {filtered.map((project, index) => {
              const start = projectStart(index);
              const span = projectSpan(project);
              return (
                <div key={project.id} className="grid grid-cols-[260px_repeat(14,minmax(48px,1fr))] border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                  <div className="px-5 py-4">
                    <p className="text-sm font-bold text-gray-950">{project.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{project.client} - {project.status}</p>
                  </div>
                  {monthDays.map((day, dayIndex) => {
                    const inRange = dayIndex >= start && dayIndex < start + span;
                    const first = dayIndex === start;
                    return (
                      <div key={day} className="relative border-l border-gray-100 py-5">
                        {inRange && (
                          <div className={`${statusTone[project.status] || "bg-gray-500"} absolute left-0 right-0 top-1/2 h-3 -translate-y-1/2 ${first ? "rounded-l-full" : ""} ${dayIndex === start + span - 1 ? "rounded-r-full" : ""}`}>
                            {first && <span className="absolute -top-6 left-2 whitespace-nowrap text-[10px] font-bold text-gray-500">{project.progress}%</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
