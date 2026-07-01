import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { clientApi } from "../../lib/clientApi";
import { today, DAY_MS, parseFullDate, formatRange } from "../../lib/dates";
import { useClientProject, belongsToProject, orderBelongsToProject } from "../../context/ClientProjectContext";
import {
  Loader2, CalendarDays, Calendar, CalendarPlus, CheckCircle2, Check, Clock,
  CircleDot, StickyNote, History, X, Copy, Video, Search, Download,
  FolderOpen, Receipt, ReceiptText, Wallet, MonitorSmartphone, Headset, Mail,
  Send, Save, Lock, AlertTriangle, Activity, FileText, FileImage,
  FileSpreadsheet, FileArchive, File,
} from "lucide-react";

/* ─── Shared primitives ─── */

const CS = {
  primary: "var(--cs-primary)",
  primaryContainer: "var(--cs-primary-container)",
  primaryFixed: "var(--cs-primary-fixed)",
  onPrimary: "var(--cs-on-primary)",
  background: "var(--cs-background)",
  surface: "var(--cs-surface)",
  surfaceLowest: "var(--cs-surface-container-lowest)",
  surfaceLow: "var(--cs-surface-container-low)",
  surfaceContainer: "var(--cs-surface-container)",
  outlineVariant: "var(--cs-outline-variant)",
  onSurface: "var(--cs-on-surface)",
  secondary: "var(--cs-secondary)",
  error: "var(--cs-error)",
};

/* Gantt status palette — shared with the admin task Gantt for visual parity. */
const GANTT_TASK_STATUSES = ["Backlog", "To Do", "In Progress", "Review", "Completed", "Blocked"];
const GANTT_STATUS_COLOR = {
  Backlog: "#6B7280",
  "To Do": "#C55418",
  "In Progress": "#C55418",
  Review: "#C55418",
  Completed: "#C55418",
  Blocked: "#C55418",
};
const GANTT_ZOOM = { Week: 130, Month: 74, Quarter: 38 };
// Computed once at module load (matches the admin Gantt) to keep render pure.
const GANTT_TODAY = today();

function PageShell({ title, subtitle, children, action }) {
  return (
    <div className="p-5 xl:p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-lg font-bold" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{title}</h1>
          {subtitle && <p className="mt-0.5 text-xs" style={{ color: CS.secondary }}>{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl border shadow-sm ${className}`}
      style={{ background: CS.surfaceLowest, borderColor: CS.outlineVariant }}>
      {children}
    </div>
  );
}

function Badge({ label, type = "neutral" }) {
  const styles = {
    neutral: { background: CS.surfaceContainer, color: CS.secondary },
    success: { background: "#FFFFFF", color: "#C55418" },
    warning: { background: "#FFFFFF", color: "#C55418" },
    primary: { background: CS.primaryFixed, color: CS.primary },
    error: { background: "#FFFFFF", color: CS.error },
  };
  return (
    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold" style={styles[type] || styles.neutral}>
      {label}
    </span>
  );
}

function CsInput({ label, value, onChange, type = "text", disabled, placeholder, required, wrapperClass = "" }) {
  return (
    <div className={`flex flex-col gap-1.5 ${wrapperClass}`}>
      {label && <label className="text-xs font-semibold" style={{ color: CS.secondary, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none transition-all copper-focus"
        style={{ background: disabled ? CS.surfaceLow : "#fff", borderColor: CS.outlineVariant, color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif", opacity: disabled ? 0.7 : 1 }}
      />
    </div>
  );
}

function CsSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold" style={{ color: CS.secondary, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{label}</label>}
      <select
        value={value}
        onChange={e => onChange?.(e.target.value)}
        className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none transition-all copper-focus"
        style={{ background: "#fff", borderColor: CS.outlineVariant, color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <label className="cs-toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="cs-toggle-slider" />
    </label>
  );
}

function CsBtn({ children, onClick, type = "button", variant = "primary", disabled, icon: Icon, loading, className = "" }) {
  const variants = {
    primary: { background: CS.primary, color: CS.onPrimary, border: "none" },
    secondary: { background: "#fff", color: CS.secondary, border: `1px solid ${CS.outlineVariant}` },
    ghost: { background: "transparent", color: CS.secondary, border: "none" },
    danger: { background: "#fff", color: CS.error, border: `1px solid ${CS.error}` },
  };
  const ShownIcon = loading ? Loader2 : Icon;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 ${disabled ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"} ${className}`}
      style={{ ...variants[variant], fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {ShownIcon && <ShownIcon size={16} className={loading ? "animate-spin" : ""} />}
      {children}
    </button>
  );
}

function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon size={40} strokeWidth={1.5} className="mb-3" style={{ color: CS.outlineVariant }} />}
      <p className="text-base font-semibold mb-1" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{title}</p>
      <p className="text-sm" style={{ color: CS.secondary }}>{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function Spinner() {
  return <Loader2 size={24} className="animate-spin" style={{ color: CS.primary }} />;
}

/* ─── PROJECT TIMELINE ─── */

function ClientTaskGantt({ tasks }) {
  const [zoom, setZoom] = useState("Week");

  const { groups, minDate, maxDate, weeks, summary } = useMemo(() => {
    const mapped = tasks.map((task) => {
      const start = task.startDate ? parseFullDate(task.startDate) : null;
      const end = task.dueDate ? parseFullDate(task.dueDate) : task.deadline ? parseFullDate(task.deadline) : null;
      if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
      const safeEnd = end < start ? start : end;
      const status = GANTT_TASK_STATUSES.includes(task.status) ? task.status : "Backlog";
      return { ...task, start, end: safeEnd, status };
    }).filter(Boolean);

    const unscheduled = tasks.length - mapped.length;
    if (!mapped.length) {
      return { groups: [], minDate: GANTT_TODAY, maxDate: GANTT_TODAY, weeks: [], summary: { total: 0, completed: 0, blocked: 0, unscheduled } };
    }

    const allDates = mapped.flatMap((t) => [t.start, t.end]);
    const min = new Date(Math.min(...allDates.map((d) => d.getTime())) - 3 * DAY_MS);
    const max = new Date(Math.max(...allDates.map((d) => d.getTime())) + 3 * DAY_MS);
    const groupList = GANTT_TASK_STATUSES
      .map((status) => ({ status, tasks: mapped.filter((t) => t.status === status) }))
      .filter((g) => g.tasks.length > 0);

    const totalDays = Math.max(1, Math.ceil((max - min) / DAY_MS));
    const weekCount = Math.max(1, Math.ceil(totalDays / 7));
    const weekCols = Array.from({ length: weekCount }, (_, index) => {
      const weekStart = new Date(min.getTime() + index * 7 * DAY_MS);
      const weekEnd = new Date(Math.min(weekStart.getTime() + 6 * DAY_MS, max.getTime()));
      return { label: formatRange(weekStart, weekEnd) };
    });

    return {
      groups: groupList,
      minDate: min,
      maxDate: max,
      weeks: weekCols,
      summary: {
        total: mapped.length,
        completed: mapped.filter((t) => t.status === "Completed").length,
        blocked: mapped.filter((t) => t.status === "Blocked").length,
        unscheduled,
      },
    };
  }, [tasks]);

  if (!groups.length) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-3" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Task Timeline</h3>
        <div className="rounded-xl border border-dashed py-10 text-center" style={{ borderColor: CS.outlineVariant }}>
          <CalendarDays size={32} className="mx-auto" style={{ color: CS.outlineVariant }} />
          <p className="mt-2 text-sm font-semibold" style={{ color: CS.onSurface }}>No scheduled tasks yet.</p>
          <p className="mt-1 text-xs" style={{ color: CS.secondary }}>Tasks appear here once The Copper Studio sets their start and due dates.</p>
        </div>
      </Card>
    );
  }

  const colWidth = GANTT_ZOOM[zoom];
  const totalRangeMs = Math.max(1, maxDate - minDate);
  const timelineWidth = weeks.length * colWidth;
  const toPct = (date) => Math.min(100, Math.max(0, ((date - minDate) / totalRangeMs) * 100));
  const showToday = GANTT_TODAY >= minDate && GANTT_TODAY <= maxDate;
  const completionPct = Math.round((summary.completed / Math.max(summary.total, 1)) * 100);

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4" style={{ borderColor: CS.outlineVariant, background: CS.surfaceLow }}>
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: CS.primaryFixed, color: CS.primary }}>
            <CalendarDays size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Task Timeline</h3>
            <p className="text-xs" style={{ color: CS.secondary }}>{formatRange(minDate, maxDate)} · {summary.total} scheduled task{summary.total === 1 ? "" : "s"}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold" style={{ background: "#FFFFFF", color: "#C55418" }}>
            <CheckCircle2 size={14} /> {completionPct}% complete
          </span>
          {summary.blocked > 0 && (
            <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: "#FFFFFF", color: CS.error }}>{summary.blocked} blocked</span>
          )}
          <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: CS.surfaceContainer }}>
            {Object.keys(GANTT_ZOOM).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setZoom(level)}
                className="rounded-md px-2.5 py-1 text-xs font-bold transition-colors"
                style={zoom === level ? { background: "#fff", color: CS.primary, boxShadow: "0 1px 2px rgba(0,0,0,0.06)" } : { color: CS.secondary }}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b px-5 py-2.5" style={{ borderColor: CS.outlineVariant }}>
        {groups.map((g) => (
          <span key={g.status} className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: CS.secondary }}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: GANTT_STATUS_COLOR[g.status] }} /> {g.status}
          </span>
        ))}
      </div>

      {/* Chart */}
      <div className="flex max-h-[560px] overflow-auto">
        {/* Sticky left: stage / task names */}
        <div className="sticky left-0 z-20 w-56 shrink-0 border-r" style={{ borderColor: CS.outlineVariant, background: CS.surfaceLowest }}>
          <div className="flex h-11 items-center px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: CS.secondary, background: CS.surfaceLow }}>
            Stage / Task
          </div>
          {groups.map((group) => (
            <div key={group.status} className="border-b" style={{ borderColor: CS.outlineVariant }}>
              <div className="flex h-9 items-center gap-2 px-3" style={{ background: CS.surfaceLow }}>
                <span className="h-2 w-2 rounded-full" style={{ background: GANTT_STATUS_COLOR[group.status] }} />
                <span className="text-xs font-bold" style={{ color: CS.onSurface }}>{group.status}</span>
                <span className="ml-auto text-[10px] font-bold" style={{ color: CS.secondary }}>{group.tasks.length}</span>
              </div>
              {group.tasks.map((task) => (
                <div key={task.id || task._id} className="flex h-12 flex-col justify-center px-5">
                  <span className="truncate text-xs font-semibold" style={{ color: CS.onSurface }}>{task.title || task.taskName || "Untitled task"}</span>
                  <span className="truncate text-[10px]" style={{ color: CS.secondary }}>
                    {formatRange(task.start, task.end)}
                    {task.assignedTo || task.assignee ? ` · ${task.assignedTo || task.assignee}` : ""}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Right: dated bars */}
        <div className="flex-1">
          <div style={{ minWidth: `${timelineWidth}px` }}>
            <div className="sticky top-0 z-10 flex h-11" style={{ background: CS.surfaceLowest }}>
              {weeks.map((week, index) => (
                <div key={index} style={{ width: `${colWidth}px`, borderColor: CS.outlineVariant }} className="flex shrink-0 items-center justify-center border-b border-l text-[10px] font-bold uppercase" >
                  <span style={{ color: CS.secondary }}>{week.label}</span>
                </div>
              ))}
            </div>
            <div className="relative">
              {showToday && (
                <div className="pointer-events-none absolute top-0 bottom-0 z-10 w-px" style={{ left: `${toPct(GANTT_TODAY)}%`, background: CS.error }}>
                  <span className="absolute left-1 top-1 rounded px-1.5 py-0.5 text-[9px] font-bold text-white" style={{ background: CS.error }}>Today</span>
                </div>
              )}
              {groups.map((group) => (
                <div key={group.status}>
                  <div className="h-9 border-b" style={{ borderColor: CS.outlineVariant, background: CS.surfaceLow }} />
                  {group.tasks.map((task) => {
                    const left = toPct(task.start);
                    const width = Math.max(toPct(task.end) - left, 3);
                    const days = Math.max(1, Math.round((task.end - task.start) / DAY_MS) + 1);
                    const color = GANTT_STATUS_COLOR[group.status];
                    return (
                      <div key={task.id || task._id} className="relative h-12 border-b" style={{ borderColor: CS.outlineVariant }}>
                        <div
                          className="absolute top-2.5 flex h-7 items-center gap-1.5 overflow-hidden rounded-lg px-2 text-[10px] font-bold text-white shadow-sm"
                          style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%`, minWidth: 70, background: color }}
                          title={`${task.title || task.taskName}\n${group.status}${task.assignedTo || task.assignee ? ` · ${task.assignedTo || task.assignee}` : ""}\n${formatRange(task.start, task.end)} (${days}d)`}
                        >
                          <span className="truncate">{task.title || task.taskName}</span>
                          <span className="ml-auto shrink-0 rounded bg-white/25 px-1">{days}d</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ClientTimelinePage() {
  const { token } = useAuth();
  const { projects, loading, selectedProject, selectedId } = useClientProject();
  const selected = selectedProject;
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!selectedId) return;
    let alive = true;
    clientApi.getProjectTasks(selectedId, token)
      .then((data) => { if (alive) setTasks(data); })
      .catch(() => { if (alive) setTasks([]); });
    return () => { alive = false; };
  }, [selectedId, token]);

  const statusBadge = (s) => {
    const map = {
      not_started: { type: "neutral", label: "Not Started" },
      in_progress: { type: "primary", label: "In Progress" },
      on_hold: { type: "warning", label: "On Hold" },
      completed: { type: "success", label: "Completed" },
      cancelled: { type: "error", label: "Cancelled" },
    };
    return map[s] || { type: "neutral", label: s };
  };

  const stageBadge = (s) => {
    if (s === "completed") return { icon: "check_circle", color: "#C55418" };
    if (s === "in_progress") return { icon: "radio_button_checked", color: CS.primary };
    return { icon: "radio_button_unchecked", color: CS.outlineVariant };
  };

  return (
    <PageShell title="Project Timeline" subtitle="Track every phase of your engagement with The Copper Studio.">
      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : projects.length === 0 ? (
        <Card className="py-4">
          <EmptyState icon={Activity} title="No projects yet" description="Your project timeline will appear here once setup is complete." />
        </Card>
      ) : (
        <div className="space-y-5">
            {selected ? (
              <>
                {/* Overview */}
                <Card className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                    <div>
                      <p className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: CS.secondary }}>Current Project</p>
                      <h2 className="text-2xl font-bold" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{selected.name}</h2>
                      {selected.description && <p className="text-sm mt-1" style={{ color: CS.secondary }}>{selected.description}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: CS.secondary }}>Expected Completion</p>
                      <p className="font-bold" style={{ color: CS.primary }}>
                        {selected.expectedEndDate
                          ? new Date(selected.expectedEndDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                          : "TBD"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm" style={{ color: CS.onSurface }}>
                      Current Phase: <span className="font-semibold" style={{ color: CS.primary }}>{selected.currentPhase || "In Progress"}</span>
                    </span>
                    <span className="font-bold" style={{ color: CS.primary }}>{selected.progress || 0}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden relative" style={{ background: CS.surfaceLow }}>
                    <div className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
                      style={{ width: `${selected.progress || 0}%`, background: CS.primaryContainer }}>
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                  </div>
                </Card>

                {/* Admin notes */}
                {selected.adminNotes && (
                  <Card className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ background: CS.primaryFixed, color: CS.primary }}>
                        <StickyNote size={20} />
                      </div>
                      <h3 className="font-semibold" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Notes from The Copper Studio</h3>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: CS.secondary }}>{selected.adminNotes}</p>
                    <div className="grid sm:grid-cols-2 gap-4 mt-4 pt-4 border-t" style={{ borderColor: CS.outlineVariant }}>
                      <div className="flex items-center gap-2">
                        <Calendar size={18} style={{ color: CS.outlineVariant }} />
                        <span className="text-sm" style={{ color: CS.onSurface }}>
                          Started:{" "}
                          <span className="font-medium">
                            {selected.startDate ? new Date(selected.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "TBD"}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <History size={18} style={{ color: CS.outlineVariant }} />
                        <span className="text-sm" style={{ color: CS.onSurface }}>
                          Status: <span className="font-medium"><Badge {...statusBadge(selected.status)} /></span>
                        </span>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Stages timeline */}
                {selected.stages?.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-5" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Engagement Roadmap</h3>
                    <div className="relative space-y-5 ml-3">
                      <div className="absolute left-[11px] top-3 bottom-3 w-0.5" style={{ background: CS.outlineVariant }} />
                      {selected.stages.map((stage, i) => {
                        const sb = stageBadge(stage.status);
                        return (
                          <div key={i} className="relative flex gap-5 items-start">
                            <div className={`z-10 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white flex-shrink-0 ${
                              stage.status === "completed" ? "" : stage.status === "in_progress" ? "" : ""
                            }`}
                              style={{
                                background: stage.status === "completed" ? CS.primaryContainer : stage.status === "in_progress" ? CS.primaryFixed : CS.surfaceContainer,
                              }}>
                              {(() => {
                                const StageIcon = stage.status === "completed" ? Check : stage.status === "in_progress" ? CircleDot : Clock;
                                return <StageIcon size={14} style={{ color: sb.color }} />;
                              })()}
                            </div>
                            <div className="flex-1 pb-1">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                                <h4 className="font-semibold text-sm" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{stage.name}</h4>
                                {stage.startDate && (
                                  <span className="text-xs" style={{ color: CS.secondary }}>
                                    {new Date(stage.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                  </span>
                                )}
                              </div>
                              {stage.notes && <p className="text-xs leading-relaxed" style={{ color: CS.secondary }}>{stage.notes}</p>}
                              {stage.status === "in_progress" && (
                                <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                                  style={{ background: CS.primaryFixed, color: CS.primary }}>
                                  <Clock size={12} />
                                  In Progress
                                </span>
                              )}
                              {stage.status === "completed" && (
                                <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                                  style={{ background: "#FFFFFF", color: "#C55418" }}>
                                  <CheckCircle2 size={12} />
                                  Completed
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                <ClientTaskGantt tasks={tasks} />
              </>
            ) : (
              <Card className="py-4">
                <EmptyState icon={Activity} title="Select a project" description="Choose a project from the switcher above to see its timeline." />
              </Card>
            )}
        </div>
      )}
    </PageShell>
  );
}

/* ─── MEETINGS ─── */

const MEETING_TYPES = [
  { value: "discovery_session", label: "Discovery Session" },
  { value: "design_review", label: "Design Review" },
  { value: "technical_sync", label: "Technical Sync" },
  { value: "strategy_review", label: "Strategy Review" },
  { value: "delivery_review", label: "Delivery Review" },
  { value: "support_call", label: "Support Call" },
];

function meetingTypelabel(type) {
  return MEETING_TYPES.find(t => t.value === type)?.label || type;
}

export function ClientMeetingsPage() {
  const { token, user } = useAuth();
  const { selectedId } = useClientProject();
  const [allMeetings, setAllMeetings] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRaw, setSelected] = useState(null);

  // Only this project's meetings (plus any general, project-less ones).
  const meetings = useMemo(
    () => allMeetings.filter((m) => belongsToProject(m, selectedId)),
    [allMeetings, selectedId]
  );

  // Keep the open detail valid when the project (and thus the list) changes.
  const mid = (m) => String(m?._id || m?.id || "");
  const selected = (selectedRaw && meetings.some((m) => mid(m) === mid(selectedRaw)))
    ? selectedRaw
    : (meetings[0] || null);
  const [bookingEvent, setBookingEvent] = useState(null);
  const [form, setForm] = useState({ title: "", type: "discovery_session", preferredDate: "", preferredTime: "", agenda: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.all([
      clientApi.getMeetings(token),
      clientApi.getCalendlyEventTypes(token),
    ])
      .then(([m, events]) => {
        if (!alive) return;
        setAllMeetings(m);
        setEventTypes(events);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [token]);

  async function handleRequest(e) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Meeting title is required."); return; }
    setSubmitting(true);
    setError("");
    try {
      const m = await clientApi.requestMeeting({ ...form, projectId: selectedId || undefined }, token);
      setAllMeetings(prev => [m, ...prev]);
      setSelected(m);
      setForm({ title: "", type: "discovery_session", preferredDate: "", preferredTime: "", agenda: "" });
      setSuccess("Meeting request sent! We'll confirm shortly.");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.message || "Failed to request meeting.");
    } finally {
      setSubmitting(false);
    }
  }

  const statusBadge = (s) => {
    const map = {
      requested: { type: "warning", label: "Requested" },
      confirmed: { type: "primary", label: "Confirmed" },
      completed: { type: "success", label: "Completed" },
      cancelled: { type: "neutral", label: "Cancelled" },
    };
    return map[s] || { type: "neutral", label: s };
  };

  return (
    <PageShell title="Meetings" subtitle="Manage your scheduled calls and request new sessions with our team.">
      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {eventTypes.length > 0 && (
              <Card className="p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Book a Meeting</h3>
                    <p className="text-sm mt-1" style={{ color: CS.secondary }}>Choose an available Calendly slot. Confirmed bookings will appear here automatically.</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {eventTypes.map((eventType) => (
                    <button
                      key={eventType.schedulingUrl || eventType.slug}
                      type="button"
                      onClick={() => setBookingEvent(eventType)}
                      className="text-left rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm"
                      style={{ borderColor: CS.outlineVariant, background: CS.surfaceLowest }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sm" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{eventType.name}</p>
                          <p className="text-xs mt-1" style={{ color: CS.secondary }}>{eventType.durationMinutes || 30} minutes</p>
                        </div>
                        <CalendarPlus size={18} style={{ color: eventType.color || CS.primary }} />
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {bookingEvent && (
              <Card>
                <div className="px-5 py-4 border-b flex items-center justify-between gap-3" style={{ borderColor: CS.outlineVariant }}>
                  <div>
                    <h3 className="font-semibold" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{bookingEvent.name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: CS.secondary }}>Select a time and complete the Calendly booking form.</p>
                  </div>
                  <button onClick={() => setBookingEvent(null)} className="p-2 rounded-lg transition-colors" style={{ color: CS.secondary }} title="Close booking">
                    <X size={18} />
                  </button>
                </div>
                <iframe
                  title={`Book ${bookingEvent.name}`}
                  src={`${bookingEvent.schedulingUrl}?hide_gdpr_banner=1&name=${encodeURIComponent(user?.name || "")}&email=${encodeURIComponent(user?.email || "")}`}
                  className="h-[720px] w-full"
                />
              </Card>
            )}

            {/* Past meetings table */}
            {meetings.length > 0 && (
              <Card>
                <div className="px-6 py-4 border-b" style={{ borderColor: CS.outlineVariant }}>
                  <h3 className="font-semibold" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>All Meetings</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: CS.surfaceLow, color: CS.secondary, fontSize: 12, letterSpacing: "0.05em" }}>
                        <th className="px-6 py-3 text-left font-semibold uppercase">Meeting</th>
                        <th className="px-6 py-3 text-left font-semibold uppercase">Type</th>
                        <th className="px-6 py-3 text-left font-semibold uppercase">Date / Time</th>
                        <th className="px-6 py-3 text-left font-semibold uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meetings.map(m => (
                        <tr key={m._id}
                          className="cursor-pointer transition-colors"
                          onClick={() => setSelected(m)}
                          style={{ background: selected?._id === m._id ? CS.surfaceLow : "transparent" }}>
                          <td className="px-6 py-4 text-sm font-medium" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{m.title}</td>
                          <td className="px-6 py-4 text-sm" style={{ color: CS.secondary }}>{meetingTypelabel(m.type)}</td>
                          <td className="px-6 py-4 text-sm" style={{ color: CS.secondary }}>
                            {m.scheduledAt
                              ? new Date(m.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                              : m.preferredDate
                                ? `Preferred: ${new Date(m.preferredDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                                : "TBD"}
                          </td>
                          <td className="px-6 py-4"><Badge {...statusBadge(m.status)} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Request form */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-5" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Request a Meeting</h3>
              <form onSubmit={handleRequest} className="space-y-4">
                <CsInput label="Meeting Title *" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="e.g. Brand strategy review" required />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <CsSelect
                    label="Meeting Type"
                    value={form.type}
                    onChange={v => setForm(f => ({ ...f, type: v }))}
                    options={MEETING_TYPES}
                  />
                  <CsInput label="Preferred Date" type="date" value={form.preferredDate} onChange={v => setForm(f => ({ ...f, preferredDate: v }))} />
                  <CsInput label="Preferred Time" type="time" value={form.preferredTime} onChange={v => setForm(f => ({ ...f, preferredTime: v }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: CS.secondary, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Message (Optional)</label>
                  <textarea
                    value={form.agenda}
                    onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))}
                    placeholder="Tell us about the meeting goals..."
                    rows={3}
                    className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none resize-none copper-focus"
                    style={{ background: "#fff", borderColor: CS.outlineVariant, color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}
                  />
                </div>
                {error && <p className="text-xs font-medium px-3 py-2 rounded-lg" style={{ background: "#FFFFFF", color: CS.error }}>{error}</p>}
                {success && <p className="text-xs font-medium px-3 py-2 rounded-lg" style={{ background: "#FFFFFF", color: "#C55418" }}>{success}</p>}
                <div className="flex justify-end">
                  <CsBtn type="submit" disabled={submitting} loading={submitting} icon={Send}>
                    {submitting ? "Sending…" : "Request Meeting"}
                  </CsBtn>
                </div>
              </form>
            </Card>
          </div>

          {/* Right: selected meeting detail */}
          <div className="space-y-5">
            {selected ? (
              <Card>
                <div className="px-5 py-4 border-b" style={{ borderColor: CS.outlineVariant, background: `${CS.surfaceLow}80` }}>
                  <h3 className="font-semibold" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{selected.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: CS.secondary }}>
                    <Clock size={15} />
                    {selected.scheduledAt
                      ? new Date(selected.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hour12: true })
                      : "Awaiting confirmation"}
                    {selected.duration ? ` (${selected.duration} mins)` : ""}
                  </div>
                </div>
                <div className="p-5 space-y-5">
                  <div><Badge {...{ requested: { type: "warning", label: "Requested" }, confirmed: { type: "primary", label: "Confirmed" }, completed: { type: "success", label: "Completed" }, cancelled: { type: "neutral", label: "Cancelled" } }[selected.status] || { type: "neutral", label: selected.status }} /></div>

                  {selected.meetingLink && (
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: CS.secondary }}>Meeting Link</p>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: CS.surfaceContainer }}>
                        <code className="text-xs flex-1 truncate" style={{ color: CS.primary }}>{selected.meetingLink}</code>
                        <button
                          onClick={() => navigator.clipboard.writeText(selected.meetingLink)}
                          className="p-1 rounded transition-colors"
                          style={{ color: CS.primary }}
                          title="Copy link">
                          <Copy size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                  {selected.agenda && (
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: CS.secondary }}>Agenda / Notes</p>
                      <p className="text-sm leading-relaxed" style={{ color: CS.onSurface }}>{selected.agenda}</p>
                    </div>
                  )}

                  {selected.participants?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-3" style={{ color: CS.secondary }}>Participants</p>
                      <div className="flex flex-wrap gap-2">
                        {selected.participants.map((p, i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
                            style={{ background: CS.surfaceLow, borderColor: CS.outlineVariant }}>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                              style={{ background: CS.primaryFixed, color: CS.primary }}>
                              {p.initials || p.name?.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-xs font-medium" style={{ color: CS.onSurface }}>{p.name}</span>
                          </div>
                        ))}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
                          style={{ background: CS.surfaceLow, borderColor: CS.outlineVariant }}>
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ background: CS.primary }}>CS</div>
                          <span className="text-xs font-medium" style={{ color: CS.onSurface }}>Copper Studio</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selected.status === "confirmed" && selected.meetingLink && (
                    <a href={selected.meetingLink} target="_blank" rel="noreferrer"
                      className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all active:scale-95"
                      style={{ background: CS.primary, color: CS.onPrimary }}>
                      <Video size={18} />
                      Join Video Call
                    </a>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-6">
                <EmptyState icon={Video} title="Select a meeting" description="Click on a meeting to view its details, or request a new one." />
              </Card>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}

/* ─── DOCUMENTS ─── */

function fileIcon(type) {
  const map = { pdf: FileText, doc: FileText, docx: FileText, png: FileImage, jpg: FileImage, jpeg: FileImage, xlsx: FileSpreadsheet, zip: FileArchive };
  return map[type?.toLowerCase()] || File;
}

function docStatusBadge(s) {
  return {
    pending_review: { type: "warning", label: "Pending Review" },
    approved: { type: "primary", label: "Approved" },
    final_delivery: { type: "success", label: "Final Delivery" },
  }[s] || { type: "neutral", label: s };
}

export function ClientDocumentsPage() {
  const { token } = useAuth();
  const { selectedId } = useClientProject();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    clientApi.getDocuments(token).then(setDocs).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const filtered = docs.filter(d => {
    const matchesProject = belongsToProject(d, selectedId);
    const matchesSearch = (d.name || "").toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || d.status === filter;
    return matchesProject && matchesSearch && matchesFilter;
  });

  const filterOpts = [
    { value: "all", label: "All" },
    { value: "final_delivery", label: "Final Delivery" },
    { value: "approved", label: "Approved" },
    { value: "pending_review", label: "Pending Review" },
  ];

  return (
    <PageShell title="Documents & Deliverables" subtitle="Access all files shared with you by The Copper Studio team.">
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: CS.secondary }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm outline-none copper-focus"
            style={{ background: "#fff", borderColor: CS.outlineVariant, color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filterOpts.map(o => (
            <button key={o.value} onClick={() => setFilter(o.value)}
              className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: filter === o.value ? CS.primary : "#fff",
                color: filter === o.value ? CS.onPrimary : CS.secondary,
                border: `1px solid ${filter === o.value ? CS.primary : CS.outlineVariant}`,
              }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={FolderOpen} title="No documents" description={search || filter !== "all" ? "No documents match your filter." : "No documents have been shared with you yet."} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => (
            <Card key={doc._id} className="p-5 flex flex-col gap-4 transition-all hover:shadow-md">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: CS.primaryFixed, color: CS.primary }}>
                  {(() => { const FIcon = fileIcon(doc.fileType); return <FIcon size={24} />; })()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{doc.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: CS.secondary }}>
                    {doc.fileType?.toUpperCase()} {doc.fileSize ? `· ${doc.fileSize}` : ""} · v{doc.version || "1.0"}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Badge {...docStatusBadge(doc.status)} />
                <span className="text-xs" style={{ color: CS.secondary }}>
                  {doc.uploadedByName || "Copper Studio"}
                </span>
              </div>
              <div className="pt-3 border-t flex gap-2" style={{ borderColor: CS.outlineVariant }}>
                {doc.fileUrl ? (
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: CS.primary, color: CS.onPrimary }}>
                    <Download size={15} />
                    Download
                  </a>
                ) : (
                  <button disabled className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold opacity-40 cursor-not-allowed"
                    style={{ background: CS.surfaceContainer, color: CS.secondary }}>
                    <Download size={15} />
                    Download
                  </button>
                )}
              </div>
              <p className="text-xs" style={{ color: CS.secondary }}>
                Uploaded {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              </p>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}

/* ─── BILLING & INVOICES ─── */

export function ClientBillingPage() {
  const { token } = useAuth();
  const { selectedProject } = useClientProject();
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderRaw, setSelectedOrder] = useState(null);

  useEffect(() => {
    clientApi.getOrders(token).then(setAllOrders).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  // Only the selected project's invoices/orders.
  const orders = useMemo(
    () => allOrders.filter((o) => orderBelongsToProject(o, selectedProject)),
    [allOrders, selectedProject]
  );

  // Keep the open invoice valid when the project (and thus the list) changes.
  const oid = (o) => String(o?._id || o?.id || "");
  const selectedOrder = (selectedOrderRaw && orders.some((o) => oid(o) === oid(selectedOrderRaw)))
    ? selectedOrderRaw
    : (orders[0] || null);

  const totalPaid = orders.filter(o => o.payment?.status === "paid").reduce((sum, o) => sum + (o.package?.total || 0), 0);

  return (
    <PageShell title="Billing & Invoices" subtitle="View your payment history and download invoices.">
      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { Icon: Wallet, label: "Total Paid", value: `₹${totalPaid.toLocaleString("en-IN")}`, color: CS.primary },
              { Icon: ReceiptText, label: "Total Invoices", value: orders.length, color: "#C55418" },
              { Icon: Clock, label: "Pending", value: orders.filter(o => o.payment?.status !== "paid").length, color: "#C55418" },
            ].map(s => (
              <div key={s.label} className="rounded-xl border p-5 flex items-center gap-4"
                style={{ background: CS.surfaceLowest, borderColor: CS.outlineVariant }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: s.color + "15" }}>
                  <s.Icon size={22} style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-xl font-bold" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{s.value}</p>
                  <p className="text-xs" style={{ color: CS.secondary }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <div className="px-6 py-4 border-b" style={{ borderColor: CS.outlineVariant }}>
                  <h3 className="font-semibold" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Invoice History</h3>
                </div>
                {orders.length === 0 ? (
                  <EmptyState icon={ReceiptText} title="No invoices" description="Your invoices will appear here after purchasing a package." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ background: CS.surfaceLow, color: CS.secondary, fontSize: 12, letterSpacing: "0.05em" }}>
                          <th className="px-6 py-3 text-left font-semibold uppercase">Invoice</th>
                          <th className="px-6 py-3 text-left font-semibold uppercase">Package</th>
                          <th className="px-6 py-3 text-left font-semibold uppercase">Date</th>
                          <th className="px-6 py-3 text-right font-semibold uppercase">Amount</th>
                          <th className="px-6 py-3 text-left font-semibold uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(o => (
                          <tr key={o._id}
                            className="cursor-pointer border-t transition-colors"
                            onClick={() => setSelectedOrder(o)}
                            style={{
                              borderColor: CS.outlineVariant,
                              background: selectedOrder?._id === o._id ? CS.surfaceLow : "transparent",
                            }}>
                            <td className="px-6 py-4 text-sm font-medium" style={{ color: CS.primary, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                              #{o.payment?.invoiceId || "—"}
                            </td>
                            <td className="px-6 py-4 text-sm" style={{ color: CS.onSurface }}>{o.package?.name}</td>
                            <td className="px-6 py-4 text-sm" style={{ color: CS.secondary }}>
                              {o.payment?.paidAt
                                ? new Date(o.payment.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                : o.createdAt
                                  ? new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                  : "—"}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-right" style={{ color: CS.onSurface }}>
                              ₹{(o.package?.total || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                label={o.payment?.status === "paid" ? "Paid" : o.payment?.status === "failed" ? "Failed" : "Pending"}
                                type={o.payment?.status === "paid" ? "success" : o.payment?.status === "failed" ? "error" : "warning"}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>

            {/* Invoice detail */}
            <div>
              {selectedOrder ? (
                <Card>
                  <div className="px-5 py-4 border-b" style={{ borderColor: CS.outlineVariant, background: `${CS.surfaceLow}80` }}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                        Invoice #{selectedOrder.payment?.invoiceId}
                      </h3>
                      <Badge
                        label={selectedOrder.payment?.status === "paid" ? "Paid" : "Pending"}
                        type={selectedOrder.payment?.status === "paid" ? "success" : "warning"}
                      />
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="space-y-3">
                      {[
                        { label: "Package", value: selectedOrder.package?.name },
                        { label: "Amount", value: `₹${(selectedOrder.package?.total || 0).toLocaleString("en-IN")}` },
                        { label: "Provider", value: selectedOrder.payment?.provider || "Razorpay" },
                        { label: "Payment ID", value: selectedOrder.payment?.razorpayPaymentId || "—" },
                        {
                          label: "Date", value: selectedOrder.payment?.paidAt
                            ? new Date(selectedOrder.payment.paidAt).toLocaleDateString("en-IN", { dateStyle: "long" })
                            : "—"
                        },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between items-start gap-2">
                          <span className="text-xs font-semibold" style={{ color: CS.secondary }}>{r.label}</span>
                          <span className="text-xs text-right font-medium max-w-[60%]" style={{ color: CS.onSurface }}>{r.value}</span>
                        </div>
                      ))}
                    </div>
                    {selectedOrder.package?.includes?.length > 0 && (
                      <div className="pt-3 border-t" style={{ borderColor: CS.outlineVariant }}>
                        <p className="text-xs font-semibold mb-2" style={{ color: CS.secondary }}>Includes</p>
                        <ul className="space-y-1.5">
                          {selectedOrder.package.includes.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: CS.primary }} />
                              <span className="text-xs" style={{ color: CS.onSurface }}>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedOrder.payment?.status === "paid" && (
                      <div className="pt-4 border-t" style={{ borderColor: CS.outlineVariant }}>
                        <button
                          type="button"
                          onClick={() =>
                            window.open(
                              `${import.meta.env.VITE_API_BASE_URL || ""}/api/invoices/by-order/${selectedOrder._id}/pdf`,
                              "_blank",
                              "noopener"
                            )
                          }
                          className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                          style={{ background: CS.primary, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                          <Download size={18} />
                          Download Invoice (PDF)
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              ) : (
                <Card className="p-6">
                  <EmptyState icon={Receipt} title="Select an invoice" description="Click an invoice to see its details." />
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}

/* ─── SETTINGS ─── */

const TABS = ["Account", "Notifications", "Security"];

export function ClientSettingsPage() {
  const auth = useAuth();
  const token = auth.token;
  const user = auth.user;

  const [tab, setTab] = useState("Account");
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    company: user?.company || "",
    jobTitle: user?.jobTitle || "",
  });
  const [prefs, setPrefs] = useState({
    email: user?.preferences?.notifications?.email ?? true,
    browser: user?.preferences?.notifications?.browser ?? false,
    weeklyReports: user?.preferences?.notifications?.weeklyReports ?? true,
    meetingReminders: user?.preferences?.notifications?.meetingReminders ?? true,
    billingAlerts: user?.preferences?.notifications?.billingAlerts ?? false,
  });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    try {
      const updated = await clientApi.updateProfile({
        ...form,
        preferences: { notifications: prefs }
      }, token);
      if (auth.updateUser) auth.updateUser(updated.user);
      setSuccess("Profile updated successfully.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to save.");
    } finally { setSaving(false); }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { setError("New passwords do not match."); return; }
    setSavingPw(true); setError(""); setSuccess("");
    try {
      await clientApi.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }, token);
      setSuccess("Password updated successfully.");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to change password.");
    } finally { setSavingPw(false); }
  }

  const initials = (user?.name || "U").split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <PageShell title="Settings" subtitle="Manage your account preferences, notifications, and portal experience.">
      {/* Tabs */}
      <div className="flex gap-1 border-b mb-6 overflow-x-auto" style={{ borderColor: CS.outlineVariant }}>
        {TABS.map(t => (
          <button key={t} onClick={() => { setTab(t); setError(""); setSuccess(""); }}
            className="px-4 pb-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all"
            style={{
              borderColor: tab === t ? CS.primary : "transparent",
              color: tab === t ? CS.primary : CS.secondary,
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}>
            {t}
          </button>
        ))}
      </div>

      {success && <p className="text-xs font-medium px-4 py-3 rounded-lg mb-4" style={{ background: "#FFFFFF", color: "#C55418" }}>{success}</p>}
      {error && <p className="text-xs font-medium px-4 py-3 rounded-lg mb-4" style={{ background: "#FFFFFF", color: CS.error }}>{error}</p>}

      <div className="max-w-3xl space-y-5">
        {tab === "Account" && (
          <>
            {/* Profile */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-5" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Profile Settings</h3>
              <form onSubmit={saveProfile} className="space-y-5">
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  {/* Avatar */}
                  <div className="flex flex-col items-center gap-3 flex-shrink-0">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white border-2"
                      style={{ background: CS.primary, borderColor: CS.outlineVariant }}>
                      {initials}
                    </div>
                  </div>
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CsInput label="Full Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
                    <CsInput label="Email Address" value={user?.email || ""} disabled />
                    <CsInput label="Job Title" value={form.jobTitle} onChange={v => setForm(f => ({ ...f, jobTitle: v }))} placeholder="e.g. Marketing Director" />
                    <CsInput label="Phone Number" type="tel" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="+91 98765 43210" />
                    <CsInput label="Company" value={form.company} onChange={v => setForm(f => ({ ...f, company: v }))} placeholder="Your company name" wrapperClass="sm:col-span-2" />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <CsBtn type="submit" disabled={saving} loading={saving} icon={Save}>
                    {saving ? "Saving…" : "Save Changes"}
                  </CsBtn>
                </div>
              </form>
            </Card>

            {/* Account Preferences */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-5" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Account Preferences</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CsSelect label="Language" value="en" onChange={() => {}} options={[
                  { value: "en", label: "English - US" },
                  { value: "en-uk", label: "English - UK" },
                  { value: "hi", label: "Hindi" },
                ]} />
                <CsSelect label="Timezone" value="Asia/Kolkata" onChange={() => {}} options={[
                  { value: "Asia/Kolkata", label: "(GMT +5:30) Mumbai, New Delhi" },
                  { value: "UTC", label: "(GMT +0:00) London" },
                  { value: "America/New_York", label: "(GMT -5:00) New York" },
                ]} />
              </div>
            </Card>
          </>
        )}

        {tab === "Notifications" && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-5" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Notification Preferences</h3>
            <div className="space-y-4">
              {[
                { key: "email", label: "Email Notifications", description: "Receive updates via email" },
                { key: "browser", label: "Browser Notifications", description: "Push notifications in browser" },
                { key: "weeklyReports", label: "Weekly Project Reports", description: "Summary email every Monday" },
                { key: "meetingReminders", label: "Meeting Reminders", description: "Reminders 24h before meetings" },
                { key: "billingAlerts", label: "Billing Alerts", description: "Invoice and payment notifications" },
              ].map((item, i) => (
                <div key={item.key} className={`flex items-center justify-between py-3.5 ${i > 0 ? "border-t" : ""}`} style={{ borderColor: CS.outlineVariant + "50" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{item.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: CS.secondary }}>{item.description}</p>
                  </div>
                  <Toggle checked={prefs[item.key]} onChange={v => setPrefs(p => ({ ...p, [item.key]: v }))} />
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-5 pt-4 border-t" style={{ borderColor: CS.outlineVariant }}>
              <CsBtn onClick={saveProfile} disabled={saving} loading={saving} icon={Save}>
                {saving ? "Saving…" : "Save Preferences"}
              </CsBtn>
            </div>
          </Card>
        )}

        {tab === "Security" && (
          <>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-5" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Change Password</h3>
              <form onSubmit={changePassword} className="space-y-4">
                <CsInput label="Current Password" type="password" value={pwForm.currentPassword} onChange={v => setPwForm(f => ({ ...f, currentPassword: v }))} required />
                <CsInput label="New Password (min 8 chars)" type="password" value={pwForm.newPassword} onChange={v => setPwForm(f => ({ ...f, newPassword: v }))} required />
                <CsInput label="Confirm New Password" type="password" value={pwForm.confirmPassword} onChange={v => setPwForm(f => ({ ...f, confirmPassword: v }))} required />
                <div className="flex justify-end">
                  <CsBtn type="submit" disabled={savingPw} loading={savingPw} icon={Lock}>
                    {savingPw ? "Updating…" : "Update Password"}
                  </CsBtn>
                </div>
              </form>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-1" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Active Sessions</h3>
              <p className="text-sm mb-4" style={{ color: CS.secondary }}>Devices currently logged into your account.</p>
              <div className="rounded-lg p-4 flex items-center gap-4" style={{ background: CS.surfaceLow }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center border"
                  style={{ background: "#fff", borderColor: CS.outlineVariant }}>
                  <MonitorSmartphone size={20} style={{ color: CS.primary }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Current Browser</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase" style={{ background: CS.primaryFixed, color: CS.primary }}>Current</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: CS.secondary }}>
                    Last active: Just now · {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("en-IN", { dateStyle: "medium" }) : ""}
                  </p>
                </div>
              </div>
            </Card>

            {/* Danger zone */}
            <div className="rounded-xl border p-6" style={{ borderColor: `${CS.error}30`, background: "#fde8e810" }}>
              <h3 className="text-lg font-semibold mb-1" style={{ color: CS.error, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Danger Zone</h3>
              <p className="text-sm mb-4" style={{ color: CS.secondary }}>
                Deactivating your account will archive all your data and revoke portal access immediately.
              </p>
              <CsBtn variant="danger" icon={AlertTriangle}>Deactivate Account</CsBtn>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}

/* ─── Legacy stubs for removed pages ─── */
export function ClientPurchasesPage() {
  return <ClientBillingPage />;
}

export function ClientSupportPage() {
  const { token } = useAuth();
  const [, setMeetings] = useState([]);
  useEffect(() => {
    clientApi.getMeetings(token).catch(() => setMeetings([]));
  }, [token]);

  return (
    <PageShell title="Support" subtitle="Need help? Reach out to The Copper Studio team.">
      <Card className="p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: CS.primaryFixed, color: CS.primary }}>
            <Headset size={24} />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Get in Touch</h3>
            <p className="text-sm" style={{ color: CS.secondary }}>Our team typically responds within 24 hours.</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { Icon: Mail, label: "Email us", value: "studio@coppercrm.in" },
            { Icon: Video, label: "Book a call", value: "Use the Meetings section to schedule a support call" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 p-4 rounded-lg" style={{ background: CS.surfaceLow }}>
              <item.Icon size={20} style={{ color: CS.primary }} />
              <div>
                <p className="text-xs font-semibold" style={{ color: CS.secondary }}>{item.label}</p>
                <p className="text-sm font-medium" style={{ color: CS.onSurface }}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
