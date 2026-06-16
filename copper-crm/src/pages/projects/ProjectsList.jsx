import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { projects } from "../../data/mockData";
import { TODAY, daysBetween, parseFullDate } from "../../lib/dates";
import ProjectCard from "../../components/ProjectCard";

const MONTH_COL_WIDTH = 140;

const priorityBar = {
  urgent: "border-red-200 bg-red-100 text-red-700",
  upcoming: "border-amber-200 bg-amber-100 text-amber-700",
  "on-track": "border-[#a8d8d2] bg-[#d7efeb] text-[#026769]",
};

function monthLabel(date) {
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function DeadlineTimeline({ items }) {
  const { rows, months, minDate, totalMs } = useMemo(() => {
    const computed = items.map((project) => {
      const start = parseFullDate(project.startDate);
      const end = parseFullDate(project.dueDate);
      const daysLeft = daysBetween(TODAY, end);
      const overdue = daysLeft < 0 && project.status !== "Completed";
      return { project, start, end, daysLeft, overdue };
    }).sort((a, b) => a.end - b.end);

    if (!computed.length) return { rows: [], months: [], minDate: TODAY, totalMs: 1 };

    const min = new Date(Math.min(...computed.map((r) => r.start.getTime())));
    const max = new Date(Math.max(...computed.map((r) => r.end.getTime())));
    const monthCols = [];
    const cursor = new Date(min.getFullYear(), min.getMonth(), 1);
    while (cursor <= max) {
      monthCols.push({ label: monthLabel(cursor) });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return { rows: computed, months: monthCols, minDate: new Date(min.getFullYear(), min.getMonth(), 1), totalMs: Math.max(1, max - min) };
  }, [items]);

  if (!rows.length) return null;

  const timelineWidth = months.length * MONTH_COL_WIDTH;
  const toPct = (date) => Math.min(100, Math.max(0, ((date - minDate) / totalMs) * 100));
  const todayVisible = rows.length && TODAY >= rows[0].start && TODAY <= new Date(minDate.getTime() + totalMs);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#d8c2b9] bg-[#fff8f6] shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
      <div className="flex border-b border-[#ead8d1] px-5 py-3">
        <h3 className="font-display text-sm font-semibold text-[#211a17]">Deadline Timeline</h3>
        <p className="ml-auto text-xs font-semibold text-[#6c6355]">{rows.filter((r) => r.overdue).length} overdue</p>
      </div>
      <div className="flex">
        <div className="w-56 shrink-0 border-r border-[#ead8d1]">
          <div className="flex h-11 items-center border-b border-[#ead8d1] bg-[#fff1ec] px-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6c6355]">Project</span>
          </div>
          {rows.map(({ project }) => (
            <Link
              key={project.id}
              to={`/admin/companies/${project.companyId}/projects/${project.id}`}
              className="flex h-12 items-center border-b border-[#ead8d1]/60 px-4 hover:bg-white"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-[#211a17]">{project.name}</p>
                <p className="truncate text-[11px] text-[#6c6355]">{project.client}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="flex-1 overflow-x-auto">
          <div style={{ minWidth: `${timelineWidth}px` }}>
            <div className="flex h-11 border-b border-[#ead8d1] bg-white">
              {months.map((month, index) => (
                <div
                  key={index}
                  style={{ width: `${MONTH_COL_WIDTH}px` }}
                  className="flex shrink-0 items-center justify-center border-r border-[#ead8d1]/60 text-[10px] font-bold uppercase text-[#6c6355]"
                >
                  {month.label}
                </div>
              ))}
            </div>

            <div className="relative">
              {todayVisible && (
                <div className="absolute top-0 bottom-0 z-10 w-px bg-red-400" style={{ left: `${toPct(TODAY)}%` }}>
                  <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-red-400" />
                </div>
              )}
              {rows.map(({ project, start, end, daysLeft, overdue }) => {
                const left = toPct(start);
                const width = Math.max(3, toPct(end) - left);
                const tone = overdue ? "border-red-300 bg-red-200 text-red-800" : priorityBar[project.priority] || priorityBar["on-track"];
                return (
                  <Link
                    key={project.id}
                    to={`/admin/companies/${project.companyId}/projects/${project.id}`}
                    className="relative block h-12 border-b border-[#ead8d1]/40"
                  >
                    <span
                      style={{ left: `${left}%`, width: `${width}%` }}
                      className={`absolute top-2.5 flex h-7 min-w-[70px] items-center justify-between gap-2 rounded-lg border px-2.5 text-[10px] font-bold shadow-sm transition-all hover:brightness-105 ${tone}`}
                    >
                      <span className="truncate">{project.progress}%</span>
                      <span className="shrink-0 whitespace-nowrap">
                        {project.status === "Completed" ? "Done" : overdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsList() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((project) =>
      `${project.name} ${project.client} ${project.status}`.toLowerCase().includes(query)
    );
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-[#211a17]">All Projects</h2>
          <p className="mt-1 text-sm text-[#6c6355]">{filtered.length} of {projects.length} projects across every company</p>
        </div>
        <div className="flex h-10 w-full items-center gap-2 rounded-xl border border-[#d8c2b9] bg-[#fff8f6] px-3 sm:w-72">
          <Search size={14} className="text-[#6c6355]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects or clients"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[#85736c]/60"
          />
        </div>
      </div>

      <DeadlineTimeline items={filtered} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {!filtered.length && (
        <p className="rounded-2xl border border-dashed border-[#d8c2b9] p-10 text-center text-sm text-[#6c6355]">
          No projects match your search.
        </p>
      )}
    </div>
  );
}
