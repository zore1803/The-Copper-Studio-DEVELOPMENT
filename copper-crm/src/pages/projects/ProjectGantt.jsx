import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronDown, ChevronRight, MessageSquare, CheckSquare } from "lucide-react";
import { Avatar, Badge, Button } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import SidePanel from "../../components/SidePanel";
import ProjectHeader from "./ProjectHeader";
import { TODAY, DAY_MS, parseFullDate, parseShortDate, formatRange } from "../../lib/dates";

const PHASE_ORDER = ["Backlog", "Requirement Gathering", "Design", "Development", "Testing", "Review", "Completed"];
const PHASE_DOT = {
  Backlog: "bg-gray-400",
  "Requirement Gathering": "bg-blue-500",
  Design: "bg-violet-500",
  Development: "bg-amber-500",
  Testing: "bg-yellow-500",
  Review: "bg-indigo-500",
  Completed: "bg-emerald-500",
};

const ZOOM_LEVELS = {
  Week: 150,
  Month: 80,
  Quarter: 40,
};

export default function ProjectGantt() {
  const { companyId, projectId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { records: companies } = useCrmRecords("companies");
  const { records: projects } = useCrmRecords("projects");
  const { records: tasks } = useCrmRecords("tasks");
  const [zoom, setZoom] = useState("Week");
  const [collapsed, setCollapsed] = useState({});
  const [activeTask, setActiveTask] = useState(null);

  const company = useMemo(() => companies.find((c) => String(c.id || c._id) === companyId), [companies, companyId]);
  const project = useMemo(
    () => projects.find((p) => String(p.id || p._id) === projectId && String(p.companyId) === companyId),
    [projects, companyId, projectId]
  );

  const { phases, minDate, maxDate, weeks } = useMemo(() => {
    if (!project) return { phases: [], minDate: TODAY, maxDate: TODAY, weeks: [] };

    const referenceYear = parseFullDate(project.dueDate || project.expectedEndDate || new Date()).getFullYear();
    const allTasks = tasks
      .filter((task) => String(task.projectId) === String(project.id || project._id) || task.project === project.name)
      .map((task) => {
        const end = task.dueDate ? parseFullDate(task.dueDate) : task.deadline ? parseShortDate(task.deadline, referenceYear) : new Date(TODAY.getTime() + 7 * DAY_MS);
        const span = Math.max(1, Math.min(Number(task.estimatedDays || task.subtasks || 2), 14));
        const start = task.startDate ? parseFullDate(task.startDate) : new Date(end.getTime() - span * DAY_MS);
        return { ...task, status: task.status || "Backlog", start, end };
      });

    // Anchor the visible range to where the tasks actually are, not the
    // project's full start-to-due window (which is mostly empty of tasks).
    const allDates = allTasks.flatMap((task) => [task.start, task.end]);
    const min = allDates.length ? new Date(Math.min(...allDates.map((d) => d.getTime())) - 3 * DAY_MS) : TODAY;
    const max = allDates.length ? new Date(Math.max(...allDates.map((d) => d.getTime())) + 3 * DAY_MS) : new Date(TODAY.getTime() + 7 * DAY_MS);

    const phaseGroups = PHASE_ORDER
      .map((phase) => ({ phase, tasks: allTasks.filter((task) => task.status === phase) }))
      .filter((group) => group.tasks.length > 0);

    const totalDays = Math.max(1, Math.ceil((max - min) / DAY_MS));
    const weekCount = Math.max(1, Math.ceil(totalDays / 7));
    const weekCols = Array.from({ length: weekCount }, (_, index) => {
      const weekStart = new Date(min.getTime() + index * 7 * DAY_MS);
      const weekEnd = new Date(Math.min(weekStart.getTime() + 6 * DAY_MS, max.getTime()));
      return { label: formatRange(weekStart, weekEnd) };
    });

    return { phases: phaseGroups, minDate: min, maxDate: max, weeks: weekCols };
  }, [project, tasks]);

  if (!company || !project) {
    return (
      <div className="rounded-2xl border border-[#d8c2b9] bg-[#fff8f6] p-10 text-center">
        <p className="text-sm font-semibold text-[#6c6355]">We couldn't find that project for this company.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate("/admin/companies")}>Back to Companies</Button>
      </div>
    );
  }

  const colWidth = ZOOM_LEVELS[zoom];
  const totalRangeMs = Math.max(1, maxDate - minDate);
  const timelineWidth = weeks.length * colWidth;

  function toPct(date) {
    return Math.min(100, Math.max(0, ((date - minDate) / totalRangeMs) * 100));
  }

  function togglePhase(phase) {
    setCollapsed((current) => ({ ...current, [phase]: !current[phase] }));
  }

  const showTodayLine = TODAY >= minDate && TODAY <= maxDate;

  function handleShare() {
    navigator.clipboard?.writeText(`${window.location.origin}/admin/companies/${company.id}/projects/${project.id}/tasks`);
    showToast({ title: "Link copied", message: "Project timeline link copied to clipboard." });
  }

  return (
    <div className="space-y-6">
      <ProjectHeader
        company={company}
        project={project}
        activeTab="Tasks"
        onShare={handleShare}
        onNewTask={() => navigate("/admin/kanban")}
      />

      <div className="rounded-2xl border border-[#d8c2b9] bg-[#fff8f6] shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ead8d1] px-5 py-3">
          <div className="flex items-center gap-1 rounded-lg bg-[#ede0db] p-1">
            {Object.keys(ZOOM_LEVELS).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setZoom(level)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                  zoom === level ? "bg-white text-[#884c2d] shadow-sm" : "text-[#6c6355] hover:text-[#211a17]"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="text-xs font-semibold text-[#6c6355]">
            {phases.reduce((sum, group) => sum + group.tasks.length, 0)} tasks across {phases.length} stages
          </p>
        </div>

        <div className="flex">
          <div className="w-64 shrink-0 border-r border-[#ead8d1]">
            <div className="flex h-11 items-center border-b border-[#ead8d1] bg-[#fff1ec] px-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6c6355]">Stage / Task</span>
            </div>
            {phases.map((group) => (
              <div key={group.phase} className="border-b border-[#ead8d1]/60">
                <button
                  type="button"
                  onClick={() => togglePhase(group.phase)}
                  className="flex h-10 w-full items-center gap-2 bg-[#fff1ec]/60 px-3 text-left"
                >
                  {collapsed[group.phase] ? <ChevronRight size={14} className="text-[#6c6355]" /> : <ChevronDown size={14} className="text-[#6c6355]" />}
                  <span className={`h-2 w-2 rounded-full ${PHASE_DOT[group.phase]}`} />
                  <span className="text-sm font-bold text-[#211a17]">{group.phase}</span>
                  <span className="ml-auto text-[10px] font-bold text-[#85736c]">{group.tasks.length}</span>
                </button>
                    {!collapsed[group.phase] && group.tasks.map((task) => (
                  <button
                    key={task.id || task._id}
                    type="button"
                    onClick={() => setActiveTask(task)}
                    className="flex h-10 w-full items-center gap-2 px-6 text-left hover:bg-white"
                  >
                    <span className="truncate text-xs text-[#211a17]">{task.title}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-x-auto">
            <div style={{ minWidth: `${timelineWidth}px` }}>
              <div className="sticky top-0 flex h-11 border-b border-[#ead8d1] bg-white">
                {weeks.map((week, index) => (
                  <div
                    key={index}
                    style={{ width: `${colWidth}px` }}
                    className="flex shrink-0 items-center justify-center border-r border-[#ead8d1]/60 text-[10px] font-bold uppercase text-[#6c6355]"
                  >
                    {week.label}
                  </div>
                ))}
              </div>

              <div className="relative">
                {showTodayLine && (
                  <div className="absolute top-0 bottom-0 z-10 w-px bg-red-400" style={{ left: `${toPct(TODAY)}%` }}>
                    <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-red-400" />
                  </div>
                )}
                {phases.map((group) => (
                  <div key={group.phase}>
                    <div className="h-10 border-b border-[#ead8d1]/60 bg-[#fff1ec]/30" />
                    {!collapsed[group.phase] && group.tasks.map((task) => {
                      const left = toPct(task.start);
                      const width = Math.max(4, toPct(task.end) - left);
                      const isDone = group.phase === "Completed";
                      return (
                        <div key={task.id || task._id} className="relative h-10 border-b border-[#ead8d1]/40">
                          <button
                            type="button"
                            onClick={() => setActiveTask(task)}
                            style={{ left: `${left}%`, width: `${width}%` }}
                            className={`absolute top-1.5 flex h-7 min-w-[90px] items-center gap-2 rounded-lg border px-2.5 text-left shadow-sm transition-all hover:brightness-105 ${
                              isDone
                                ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                                : "border-[#ffb693]/50 bg-[#ffdbcc] text-[#6f381a]"
                            }`}
                          >
                            <span className="truncate text-[11px] font-bold">{task.title || task.taskName}</span>
                            <Avatar name={task.assignee || task.assignedTo} size="sm" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeTask && (
        <SidePanel
          title={activeTask.title || activeTask.taskName}
          subtitle={`${activeTask.status || "Backlog"} - ${activeTask.project || project.name}`}
          onClose={() => setActiveTask(null)}
        >
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Badge color={activeTask.priority === "High" ? "red" : activeTask.priority === "Medium" ? "orange" : "gray"}>
                {activeTask.priority || "Medium"} priority
              </Badge>
              <Badge color="gray">{formatRange(activeTask.start, activeTask.end)}</Badge>
            </div>
            <p className="text-sm leading-6 text-gray-600">{activeTask.description || "No task description added yet."}</p>
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <Avatar name={activeTask.assignee || activeTask.assignedTo} />
              <div>
                <p className="text-xs font-bold text-gray-950">Assignee</p>
                <p className="text-xs text-gray-500">{activeTask.assignee || activeTask.assignedTo || "Unassigned"}</p>
              </div>
            </div>
            <div className="flex items-center gap-5 text-xs font-bold text-gray-500">
              <span className="inline-flex items-center gap-1.5"><CheckSquare size={13} /> {activeTask.subtasks || 0} subtasks</span>
              <span className="inline-flex items-center gap-1.5"><MessageSquare size={13} /> {activeTask.comments || 0} comments</span>
            </div>
            <Button className="w-full justify-center" onClick={() => navigate("/admin/kanban")}>Open in Kanban Board</Button>
          </div>
        </SidePanel>
      )}
    </div>
  );
}
