import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { clientApi } from "../../lib/clientApi";
import { apiGet } from "../../lib/api";
import { storeGet, storeSet } from "../../lib/store";
import { today, DAY_MS, parseFullDate, formatRange } from "../../lib/dates";
import { useClientProject, belongsToProject, orderBelongsToProject } from "../../context/ClientProjectContext";
import FilterButton from "../../components/FilterButton";
import { useToast } from "../../components/useToast";
import SidePanel from "../../components/SidePanel";
import { useRevalidate } from "../../hooks/useRevalidate";
import { isNotificationSupported, requestBrowserNotificationPermission } from "../../lib/browserNotifications";
import {
  Loader2, Calendar, CalendarCheck, CalendarPlus, CheckCircle2, Check, Clock,
  StickyNote, History, Copy, Video, Search, Download, Eye,
  FolderOpen, Receipt, ReceiptText, Wallet, MonitorSmartphone, Headset, Mail,
  Save, Lock, AlertTriangle, Activity, FileText, FileImage, LogOut,
  FileSpreadsheet, FileArchive, File, Zap, ListChecks, Route,
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

// `colWidth` is the px width of one column. Day zoom renders one column per
// day; the rest render one column per week (denser = zoomed out further).
const GANTT_ZOOM = {
  Day: { unit: "day", colWidth: 48 },
  Week: { unit: "week", colWidth: 130 },
  Month: { unit: "week", colWidth: 74 },
  Quarter: { unit: "week", colWidth: 38 },
};
// Computed once at module load (matches the admin Gantt) to keep render pure.
const GANTT_TODAY = today();

function PageShell({ title, subtitle, children, action, maxWidthClass = "max-w-7xl" }) {
  return (
    <div className="flex flex-col min-h-full">
      <div
        className="flex flex-col gap-4 border-b bg-white px-6 py-3 lg:h-14 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:py-0"
        style={{ borderColor: CS.outlineVariant }}
      >
        <div className="min-w-0">
          <h1 className="text-base font-medium" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{title}</h1>
          {subtitle && <p className="mt-0.5 text-xs truncate" style={{ color: CS.secondary }}>{subtitle}</p>}
        </div>
        {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
      </div>
      <div className={`p-5 xl:p-6 ${maxWidthClass} mx-auto w-full`}>
        {children}
      </div>
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
    success: { background: "#e8f5e9", color: "#388e3c" },
    warning: { background: "#fff8e1", color: "#f57f17" },
    primary: { background: CS.primaryFixed, color: CS.primary },
    error: { background: "#fde8e8", color: CS.error },
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

function TimelineKpiChip({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-xl border px-4 py-3.5 flex items-start gap-3" style={{ borderColor: CS.outlineVariant, background: CS.surfaceLowest }}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: `${color}1A`, color }}>
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium" style={{ color: CS.secondary }}>{label}</p>
        <p className="mt-0.5 truncate text-base font-bold leading-tight" style={{ color: CS.onSurface }} title={String(value)}>{value}</p>
      </div>
    </div>
  );
}

// Shared Gantt chart pattern: fed pre-normalised rows ({ id, title, status,
// start, end, subtitle }), grouped by an ordered status list with its own
// colour palette. Used for both the project's Stage Timeline and its Task
// Timeline, so both charts look and behave identically instead of the app
// growing two differently-styled Gantt implementations.
function startOfWeek(ms) {
  const x = new Date(ms);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

const GANTT_SCALE_MIN = 0.4;
const GANTT_SCALE_MAX = 4;
// Width of the sticky "STAGE" name rail (w-56) — the timeline area starts after
// it, so anchoring a zoom to the cursor's date has to account for this offset.
const GANTT_LEFT_PANEL_PX = 224;

function GanttChart({ title, icon: Icon, rows, statusOrder, statusColor, rowLabel, emptyTitle, emptyDescription, doneStatus, blockedStatus }) {
  const [zoom, setZoom] = useState("Week");
  // Independent of the day/week/month unit: trackpad pinch (Ctrl+wheel)
  // stretches the sheet wider or squeezes it narrower, spreading/contracting
  // the columns and stage bars together (they're all sized off colWidth).
  const [scale, setScale] = useState(1);
  const scrollRef = useRef(null);
  const pendingPrependPx = useRef(0);
  const lastScrollLeft = useRef(0);
  const didInitialScroll = useRef(false);
  // Set on pinch so the layout effect can re-anchor scrollLeft to the same
  // date/cursor after the columns resize — keeps the bars visually stable.
  const pendingZoom = useRef(null);
  const dayWidthRef = useRef(0);

  const { groups, orderedRows, dataMin, dataMax, summary } = useMemo(() => {
    if (!rows.length) {
      return { groups: [], orderedRows: [], dataMin: GANTT_TODAY, dataMax: GANTT_TODAY, summary: { total: 0, completed: 0, blocked: 0 } };
    }
    // Only dated rows drive the timeline's span; undated ones still render as
    // rows (no bar) but must not break the min/max computation.
    const datedTimes = rows.flatMap((r) => [r.start, r.end]).filter(Boolean).map((d) => d.getTime());
    const min = datedTimes.length ? new Date(Math.min(...datedTimes)) : GANTT_TODAY;
    const max = datedTimes.length ? new Date(Math.max(...datedTimes)) : GANTT_TODAY;
    const groupList = statusOrder
      .map((status) => ({ status, rows: rows.filter((r) => r.status === status) }))
      .filter((g) => g.rows.length > 0);
    return {
      groups: groupList,
      orderedRows: groupList.flatMap((g) => g.rows),
      dataMin: min,
      dataMax: max,
      summary: {
        total: rows.length,
        completed: doneStatus ? rows.filter((r) => r.status === doneStatus).length : 0,
        blocked: blockedStatus ? rows.filter((r) => r.status === blockedStatus).length : 0,
      },
    };
  }, [rows, statusOrder, doneStatus, blockedStatus]);

  // The visible date window is seeded with a few weeks of padding around the
  // data, then extended on demand as the user scrolls toward either edge — so
  // the timeline scrolls forward and backward without a fixed limit, like a
  // calendar. Kept in state (not derived) precisely so it can grow.
  const PAD_WEEKS = 4;
  const EXTEND_WEEKS = 8;
  const [windowStart, setWindowStart] = useState(() => startOfWeek(dataMin.getTime() - PAD_WEEKS * 7 * DAY_MS));
  const [windowEnd, setWindowEnd] = useState(() => startOfWeek(dataMax.getTime() + (PAD_WEEKS + 1) * 7 * DAY_MS));

  // Re-seed (and re-center) whenever the underlying data span changes.
  useEffect(() => {
    setWindowStart(startOfWeek(dataMin.getTime() - PAD_WEEKS * 7 * DAY_MS));
    setWindowEnd(startOfWeek(dataMax.getTime() + (PAD_WEEKS + 1) * 7 * DAY_MS));
    didInitialScroll.current = false;
  }, [dataMin, dataMax]);

  const { unit, colWidth: baseColWidth } = GANTT_ZOOM[zoom];
  const colWidth = baseColWidth * scale;
  const isDay = unit === "day";
  const dayWidth = isDay ? colWidth : colWidth / 7;
  dayWidthRef.current = dayWidth;
  const windowDays = Math.max(1, Math.round((windowEnd - windowStart) / DAY_MS));
  const columns = isDay
    ? Array.from({ length: windowDays }, (_, i) => {
        const d = new Date(windowStart.getTime() + i * DAY_MS);
        return { label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) };
      })
    : Array.from({ length: Math.max(1, Math.round(windowDays / 7)) }, (_, i) => {
        const ws = new Date(windowStart.getTime() + i * 7 * DAY_MS);
        return { label: formatRange(ws, new Date(ws.getTime() + 6 * DAY_MS)) };
      });
  const timelineWidth = columns.length * colWidth;
  const leftPx = (date) => ((date - windowStart) / DAY_MS) * dayWidth;
  const todayPx = leftPx(GANTT_TODAY);
  const completionPct = doneStatus ? Math.round((summary.completed / Math.max(summary.total, 1)) * 100) : null;

  // Keep the viewport steady when weeks are prepended on the left (which shifts
  // all content rightward), and do a one-time scroll to bring the data into view.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (pendingZoom.current) {
      const { anchorDays, cursorX } = pendingZoom.current;
      pendingZoom.current = null;
      el.scrollLeft = Math.max(0, GANTT_LEFT_PANEL_PX + anchorDays * dayWidth - cursorX);
      lastScrollLeft.current = el.scrollLeft;
    }
    if (pendingPrependPx.current) {
      el.scrollLeft += pendingPrependPx.current;
      pendingPrependPx.current = 0;
      lastScrollLeft.current = el.scrollLeft;
    }
    if (!didInitialScroll.current && orderedRows.length) {
      el.scrollLeft = Math.max(0, leftPx(dataMin) - colWidth);
      lastScrollLeft.current = el.scrollLeft;
      didInitialScroll.current = true;
    }
  });

  // Trackpad pinch-zoom (and Ctrl+wheel) stretches/squeezes the sheet — the
  // browser reports pinch as a wheel event with ctrlKey set. Attached natively
  // with passive:false so preventDefault can stop the page from zooming instead.
  // Re-runs when the chart first mounts (orderedRows 0 → N attaches the ref).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    function onWheel(e) {
      if (!e.ctrlKey) return;
      e.preventDefault();
      // Anchor the zoom to the date under the cursor: remember how many days
      // from the window start that point is, and where the cursor sits, so the
      // layout effect can restore the same date to the same spot after resize.
      const rect = el.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const dw = dayWidthRef.current || 1;
      pendingZoom.current = {
        anchorDays: (el.scrollLeft + cursorX - GANTT_LEFT_PANEL_PX) / dw,
        cursorX,
      };
      setScale((s) => {
        const next = s * (1 - e.deltaY * 0.01);
        return Math.min(GANTT_SCALE_MAX, Math.max(GANTT_SCALE_MIN, Math.round(next * 100) / 100));
      });
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [orderedRows.length]);

  function handleScroll(event) {
    const el = event.currentTarget;
    // Ignore pure vertical scrolls (scrollLeft unchanged) so scrolling the row
    // list at the left edge doesn't keep prepending weeks.
    if (el.scrollLeft === lastScrollLeft.current) return;
    const movingLeft = el.scrollLeft < lastScrollLeft.current;
    lastScrollLeft.current = el.scrollLeft;
    const edge = Math.max(colWidth * 3, 200);
    if (movingLeft && el.scrollLeft < edge) {
      // Pixel width of the prepended span, so the scrollLeft compensation is
      // correct at any zoom (dayWidth already accounts for day vs week columns).
      pendingPrependPx.current += EXTEND_WEEKS * 7 * dayWidth;
      setWindowStart((prev) => new Date(prev.getTime() - EXTEND_WEEKS * 7 * DAY_MS));
    } else if (!movingLeft && el.scrollWidth - el.scrollLeft - el.clientWidth < edge) {
      setWindowEnd((prev) => new Date(prev.getTime() + EXTEND_WEEKS * 7 * DAY_MS));
    }
  }

  if (!groups.length) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-3" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{title}</h3>
        <div className="rounded-xl border border-dashed py-10 text-center" style={{ borderColor: CS.outlineVariant }}>
          {Icon && <Icon size={32} className="mx-auto" style={{ color: CS.outlineVariant }} />}
          <p className="mt-2 text-sm font-semibold" style={{ color: CS.onSurface }}>{emptyTitle}</p>
          <p className="mt-1 text-xs" style={{ color: CS.secondary }}>{emptyDescription}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4" style={{ borderColor: CS.outlineVariant, background: CS.surfaceLow }}>
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: CS.primaryFixed, color: CS.primary }}>
            {Icon && <Icon size={18} />}
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{title}</h3>
            <p className="text-xs" style={{ color: CS.secondary }}>{summary.total} scheduled {rowLabel}{summary.total === 1 ? "" : "s"} · scroll to explore</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {completionPct != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold" style={{ background: "#e8f5e9", color: "#388e3c" }}>
              <CheckCircle2 size={14} /> {completionPct}% complete
            </span>
          )}
          {summary.blocked > 0 && (
            <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: "#fde8e8", color: CS.error }}>{summary.blocked} blocked</span>
          )}
          <select
            value={zoom}
            onChange={(e) => setZoom(e.target.value)}
            className="rounded-lg border px-3 py-1.5 text-xs font-bold outline-none focus:ring-2"
            style={{ borderColor: CS.outlineVariant, color: CS.onSurface, background: "#fff" }}
            aria-label="Timeline zoom"
          >
            {Object.keys(GANTT_ZOOM).map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b px-5 py-2.5" style={{ borderColor: CS.outlineVariant }}>
        {groups.map((g) => (
          <span key={g.status} className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: CS.secondary }}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: statusColor[g.status] }} /> {g.status}
          </span>
        ))}
      </div>

      {/* Chart */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex max-h-[560px] overflow-auto">
        {/* Sticky left: row names */}
        <div className="sticky left-0 z-20 w-56 shrink-0 border-r" style={{ borderColor: CS.outlineVariant, background: CS.surfaceLowest }}>
          <div className="flex h-11 items-center px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: CS.secondary, background: CS.surfaceLow }}>
            {rowLabel}
          </div>
          {orderedRows.map((row) => (
            <div key={row.id} className="flex h-12 flex-col justify-center px-4 border-b" style={{ borderColor: CS.outlineVariant }}>
              <span className="flex items-center gap-2 truncate text-xs font-semibold" style={{ color: CS.onSurface }}>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: statusColor[row.status] }} />
                {row.title}
              </span>
              <span className="truncate pl-4 text-[10px]" style={{ color: CS.secondary }}>
                {row.start && row.end ? formatRange(row.start, row.end) : "Dates not set"}
                {row.subtitle ? ` · ${row.subtitle}` : ""}
              </span>
            </div>
          ))}
        </div>

        {/* Right: dated bars */}
        <div className="flex-1">
          <div style={{ minWidth: `${timelineWidth}px` }}>
            <div className="sticky top-0 z-10 flex h-11" style={{ background: CS.surfaceLowest }}>
              {columns.map((col, index) => (
                <div key={index} style={{ width: `${colWidth}px`, borderColor: CS.outlineVariant }} className="flex shrink-0 items-center justify-center border-b border-l text-[10px] font-bold uppercase" >
                  <span style={{ color: CS.secondary }}>{col.label}</span>
                </div>
              ))}
            </div>
            <div className="relative">
              {todayPx >= 0 && todayPx <= timelineWidth && (
                <div className="pointer-events-none absolute top-0 bottom-0 z-10 w-px" style={{ left: `${todayPx}px`, background: CS.error }}>
                  <span className="absolute left-1 top-1 rounded px-1.5 py-0.5 text-[9px] font-bold text-white" style={{ background: CS.error }}>Today</span>
                </div>
              )}
              {orderedRows.map((row) => {
                // Undated stage → keep the row (for alignment with the left rail)
                // but draw no bar; it appears once dates are assigned.
                if (!row.start || !row.end) {
                  return <div key={row.id} className="h-12 border-b" style={{ borderColor: CS.outlineVariant }} />;
                }
                const left = leftPx(row.start);
                const days = Math.max(1, Math.round((row.end - row.start) / DAY_MS) + 1);
                const width = Math.max(days * dayWidth, 70);
                const color = statusColor[row.status];
                return (
                  <div key={row.id} className="relative h-12 border-b" style={{ borderColor: CS.outlineVariant }}>
                    <div
                      className="absolute top-2.5 flex h-7 items-center gap-1.5 overflow-hidden rounded-lg px-2 text-[10px] font-bold text-white shadow-sm"
                      style={{ left: `${left}px`, width: `${width}px`, background: color }}
                      title={`${row.title}\n${row.status}${row.subtitle ? ` · ${row.subtitle}` : ""}\n${formatRange(row.start, row.end)} (${days}d)`}
                    >
                      <span className="truncate">{row.title}</span>
                      <span className="ml-auto shrink-0 rounded bg-white/25 px-1">{days}d</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

const STAGE_STATUS_ORDER = ["Upcoming", "In Progress", "In Review", "Completed"];
const STAGE_STATUS_COLOR = { Upcoming: "#9ca3af", "In Progress": "#f59e0b", "In Review": "#7c3aed", Completed: "#10b981" };
const STAGE_STATUS_LABEL = { not_started: "Upcoming", in_progress: "In Progress", review: "In Review", completed: "Completed" };

function ClientStageGantt({ stages }) {
  // Every stage is shown, dated or not — an undated stage still appears as a
  // row (with a "Dates not set" note and no bar) so the roadmap is complete,
  // and its bar fills in automatically once start/end dates are assigned.
  const rows = useMemo(() => (stages || [])
    .map((stage, i) => {
      const rawStart = stage.startDate ? parseFullDate(stage.startDate) : null;
      const rawEnd = stage.endDate ? parseFullDate(stage.endDate) : rawStart;
      const start = rawStart && !Number.isNaN(rawStart.getTime()) ? rawStart : null;
      const end = rawEnd && !Number.isNaN(rawEnd.getTime()) ? rawEnd : null;
      return {
        id: stage._id || i,
        title: stage.name || `Stage ${i + 1}`,
        status: STAGE_STATUS_LABEL[stage.status] || "Upcoming",
        start,
        end: start && end && end < start ? start : end,
      };
    }), [stages]);

  return (
    <GanttChart
      title="Stage Timeline"
      icon={Route}
      rows={rows}
      statusOrder={STAGE_STATUS_ORDER}
      statusColor={STAGE_STATUS_COLOR}
      rowLabel="stage"
      doneStatus="Completed"
      emptyTitle="No stages yet."
      emptyDescription="Your roadmap stages will appear here once The Copper Studio sets them up."
    />
  );
}

export function ClientTimelinePage() {
  const { projects, loading, selectedProject } = useClientProject();
  const selected = selectedProject;

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
                    <Badge {...statusBadge(selected.status)} />
                  </div>

                  <div className="w-full h-2.5 rounded-full overflow-hidden relative mb-5" style={{ background: CS.surfaceLow }}>
                    <div className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
                      style={{ width: `${selected.progress || 0}%`, background: CS.primaryContainer }}>
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <TimelineKpiChip label="Progress" value={`${selected.progress || 0}%`} icon={Zap} color="#3b82f6" />
                    <TimelineKpiChip label="Current Phase" value={selected.currentPhase || "In Progress"} icon={ListChecks} color="#8D3118" />
                    <TimelineKpiChip
                      label="Expected Completion"
                      value={selected.expectedEndDate ? new Date(selected.expectedEndDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "TBD"}
                      icon={CalendarCheck}
                      color="#16a34a"
                    />
                    <TimelineKpiChip label="Roadmap Stages" value={`${(selected.stages || []).filter((s) => s.status === "completed").length}/${(selected.stages || []).length}`} icon={Route} color="#0d9488" />
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
                <Card className="p-6 lg:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: CS.primaryFixed, color: CS.primary }}>
                      <Route size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Engagement Roadmap</h3>
                      {selected.stages?.length > 0 && (
                        <p className="text-xs" style={{ color: CS.secondary }}>
                          {selected.stages.filter((s) => s.status === "completed").length} of {selected.stages.length} stages completed
                        </p>
                      )}
                    </div>
                  </div>

                  {!selected.stages?.length ? (
                    <div className="rounded-xl border border-dashed py-10 text-center" style={{ borderColor: CS.outlineVariant }}>
                      <Route size={32} className="mx-auto" style={{ color: CS.outlineVariant }} />
                      <p className="mt-2 text-sm font-semibold" style={{ color: CS.onSurface }}>No roadmap stages yet.</p>
                      <p className="mt-1 text-xs" style={{ color: CS.secondary }}>Your engagement phases will appear here once The Copper Studio sets them up.</p>
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-6">
                      {selected.stages.length > 1 && (
                        <div className="absolute left-[19px] top-2 bottom-2 w-0.5" style={{ background: CS.outlineVariant }} />
                      )}
                      {selected.stages.map((stage, i) => {
                        const isCompleted = stage.status === "completed";
                        const isReview = stage.status === "review";
                        const isActive = stage.status === "in_progress";
                        const iconBg = isCompleted ? "#34d399" : isReview ? "#ede9fe" : isActive ? "#fef3c7" : "#ffffff";
                        const iconBorder = isCompleted ? "#34d399" : isReview ? "#a78bfa" : isActive ? "#fbbf24" : CS.outlineVariant;
                        const cardBg = isCompleted ? "#f0fdf4" : isReview ? "#f5f3ff" : isActive ? "#fffbeb" : "#f9fafb";
                        const cardBorder = isCompleted ? "#bbf7d0" : isReview ? "#ddd6fe" : isActive ? "#fde68a" : "#e5e7eb";
                        return (
                          <div key={i} className="relative flex items-start gap-4">
                            <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 shadow-sm"
                              style={{ background: iconBg, borderColor: iconBorder }}>
                              {isCompleted ? (
                                <Check size={16} style={{ color: "#fff" }} />
                              ) : isReview ? (
                                <Eye size={15} style={{ color: "#7c3aed" }} />
                              ) : isActive ? (
                                <Zap size={15} style={{ color: "#d97706" }} />
                              ) : (
                                <span className="text-xs font-bold" style={{ color: "#9ca3af" }}>{i + 1}</span>
                              )}
                            </div>
                            <div className="flex-1 rounded-xl border p-4" style={{ background: cardBg, borderColor: cardBorder }}>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1.5">
                                <h4 className="font-bold text-sm" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{stage.name}</h4>
                                {stage.startDate && (
                                  <span className="text-xs font-medium" style={{ color: CS.secondary }}>
                                    {new Date(stage.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                  </span>
                                )}
                              </div>
                              {stage.notes && <p className="text-xs leading-relaxed mb-2" style={{ color: CS.secondary }}>{stage.notes}</p>}
                              {isCompleted ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: "#166534" }}>
                                  <CheckCircle2 size={12} /> Completed
                                </span>
                              ) : isReview ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: "#7c3aed" }}>
                                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#7c3aed" }} /> In Review
                                </span>
                              ) : isActive ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: "#d97706" }}>
                                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#d97706" }} /> Currently Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: "#9ca3af" }}>
                                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#d1d5db" }} /> Upcoming
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                <ClientStageGantt stages={selected.stages} />
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

const MEETING_STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "current", label: "Current" },
  { value: "past", label: "Past" },
];

// Buckets a meeting into New (awaiting confirmation) / Current (confirmed &
// upcoming) / Past (completed, cancelled, or already elapsed) for the filter.
function isSameCalendarDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Past: completed (or cancelled, or scheduled for a date that's already gone
// by but never got marked completed). Current: scheduled for today.
// New: scheduled for a future date, or not yet scheduled at all (a fresh
// request awaiting confirmation is still an upcoming ask).
function meetingCategory(m) {
  if (m.status === "completed" || m.status === "cancelled") return "past";

  const when = m.scheduledAt ? new Date(m.scheduledAt) : (m.preferredDate ? new Date(m.preferredDate) : null);
  if (!when || Number.isNaN(when.getTime())) return "new";

  const now = new Date();
  if (isSameCalendarDay(when, now)) return "current";
  if (when < now) return "past";
  return "new";
}

const MEETING_STATUS_BADGE = {
  requested: { type: "warning", label: "Requested" },
  confirmed: { type: "success", label: "Confirmed" },
  completed: { type: "success", label: "Completed" },
  cancelled: { type: "neutral", label: "Cancelled" },
};

const MEETINGS_PAGE_SIZE = 10;

export function ClientMeetingsPage() {
  const { token, user } = useAuth();
  const { selectedId } = useClientProject();
  const { showToast } = useToast();
  // Paint instantly from cache (same as the admin side's useCrmRecords)
  // instead of blocking on the network round trip — revalidates in the
  // background once the real fetch resolves.
  const [allMeetings, setAllMeetings] = useState(() => storeGet("meetings"));
  const [eventTypes, setEventTypes] = useState([]);
  // Tracked separately from the meetings-list `loading` (which can resolve
  // instantly from cache) so the booking card doesn't flash "Booking
  // unavailable" for the second or two the event-types fetch is still in
  // flight before it's had a chance to auto-select the first slot.
  const [eventTypesLoading, setEventTypesLoading] = useState(true);
  const [loading, setLoading] = useState(() => storeGet("meetings").length === 0);
  const [selectedRaw, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Only this project's meetings (plus any general, project-less ones).
  const meetings = useMemo(
    () => allMeetings.filter((m) => belongsToProject(m, selectedId)),
    [allMeetings, selectedId]
  );

  const filteredMeetings = useMemo(
    () => statusFilter === "all" ? meetings : meetings.filter((m) => meetingCategory(m) === statusFilter),
    [meetings, statusFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredMeetings.length / MEETINGS_PAGE_SIZE));
  // Clamp instead of resetting via effect — filtering/project changes can leave
  // `page` past the new last page without needing a synchronous setState effect.
  const safePage = Math.min(page, totalPages);
  const paginated = filteredMeetings.slice((safePage - 1) * MEETINGS_PAGE_SIZE, safePage * MEETINGS_PAGE_SIZE);

  const selected = selectedRaw;
  const [bookingEvent, setBookingEvent] = useState(null);
  const [bookingFrameHeight, setBookingFrameHeight] = useState(520);
  // Bumped after every booking to force the iframe to remount with a fresh
  // src instead of sitting on Calendly's own "waiting for confirmation" /
  // thank-you screen from the just-completed booking.
  const [bookingFrameKey, setBookingFrameKey] = useState(0);

  // Calendly's embedded scheduler posts messages to the parent window: a
  // page-height update whenever its content size changes (so the iframe can
  // be sized to fit instead of leaving blank space or clipping), and an
  // event_scheduled message once the invitee finishes booking. The Meeting
  // record itself lands via the Calendly webhook (if configured) or the
  // server-side API sync — both async — so poll repeatedly after booking to
  // pick it up as soon as it exists instead of requiring a manual refresh.
  useEffect(() => {
    function onCalendlyMessage(e) {
      if (e.data?.event === "calendly.page_height") {
        const height = Number(e.data?.payload?.height);
        if (height > 0) setBookingFrameHeight(Math.min(800, Math.max(420, height)));
        return;
      }
      if (e.data?.event !== "calendly.event_scheduled") return;
      showToast({ title: "Meeting booked", message: "Your meeting has been scheduled and will appear below shortly." });
      setBookingFrameHeight(520);
      setBookingFrameKey((k) => k + 1); // reset the widget to a fresh, bookable state
      let attempts = 0;
      const poll = () => {
        attempts += 1;
        clientApi.getMeetings(token).then((m) => { storeSet("meetings", m); setAllMeetings(m); }).catch(() => {});
      };
      poll(); // check immediately, don't wait for the first interval tick
      const interval = setInterval(() => {
        if (attempts >= 8) { clearInterval(interval); return; }
        poll();
      }, 3000);
    }
    window.addEventListener("message", onCalendlyMessage);
    return () => window.removeEventListener("message", onCalendlyMessage);
  }, [token]);

  // Direct apiGet for meetings, not clientApi.getMeetings, which swallows
  // failures and silently resolves with stale cached data instead of
  // retrying — that could leave a booked/cancelled meeting stuck showing
  // its old state until a hard refresh.
  const loadMeetingsAndEvents = useCallback(() => {
    return Promise.all([
      apiGet("/api/client/meetings", token).catch(() => null),
      clientApi.getCalendlyEventTypes(token).catch(() => null),
    ]).then(([m, events]) => {
      if (Array.isArray(m)) { storeSet("meetings", m); setAllMeetings(m); }
      if (Array.isArray(events)) {
        setEventTypes(events);
        // Default straight to the first slot's Calendly widget instead of
        // making the client click through a picker first.
        setBookingEvent((prev) => prev || events[0] || null);
      }
    });
  }, [token]);

  useEffect(() => {
    loadMeetingsAndEvents().finally(() => { setLoading(false); setEventTypesLoading(false); });
  }, [loadMeetingsAndEvents]);

  useRevalidate(loadMeetingsAndEvents);

  const statusBadge = (s) => MEETING_STATUS_BADGE[s] || { type: "neutral", label: s };

  return (
    <PageShell
      title="Meetings"
      subtitle="Manage your scheduled calls and book new sessions with our team."
      maxWidthClass="max-w-[1600px]"
      action={
        <FilterButton
          buttonClassName="h-8 w-8"
          onReset={() => setStatusFilter("all")}
          fields={[
            { key: "status", label: "Status", type: "select", value: statusFilter, onChange: setStatusFilter, options: MEETING_STATUS_FILTERS, allValue: "all" }
          ]}
        />
      }
    >
      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left: all meetings list, admin list pattern */}
          <div className="w-full flex-1 min-w-0">
            <div className="overflow-hidden rounded-xl border" style={{ borderColor: CS.outlineVariant, background: CS.surfaceLowest }}>
              {filteredMeetings.length === 0 ? (
                <EmptyState icon={Video} title="No meetings" description={statusFilter === "all" ? "You don't have any meetings yet." : "No meetings match this filter."} />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ background: "#8D3118" }}>
                          <th className="px-6 py-3 text-left text-xs font-bold uppercase text-white">Meeting</th>
                          <th className="px-6 py-3 text-left text-xs font-bold uppercase text-white">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-bold uppercase text-white">Date / Time</th>
                          <th className="px-6 py-3 text-left text-xs font-bold uppercase text-white">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map(m => (
                          <tr key={m._id}
                            className="cursor-pointer transition-colors border-t"
                            onClick={() => setSelected(m)}
                            style={{ borderColor: CS.outlineVariant }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = CS.surfaceLow; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
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

                  {/* Pagination */}
                  <div className="flex items-center justify-between px-6 py-3.5 border-t" style={{ borderColor: CS.outlineVariant }}>
                    <p className="text-xs" style={{ color: CS.secondary }}>
                      Showing {paginated.length} of {filteredMeetings.length} meetings
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPage(Math.max(1, safePage - 1))}
                        disabled={safePage === 1}
                        className="flex h-8 w-8 items-center justify-center rounded-full border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        style={{ borderColor: CS.outlineVariant, color: CS.secondary }}
                      >
                        ‹
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors"
                          style={p === safePage
                            ? { background: CS.primary, color: CS.onPrimary }
                            : { border: `1px solid ${CS.outlineVariant}`, color: CS.secondary }}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                        disabled={safePage === totalPages}
                        className="flex h-8 w-8 items-center justify-center rounded-full border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        style={{ borderColor: CS.outlineVariant, color: CS.secondary }}
                      >
                        ›
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: book a meeting — Calendly widget shown directly */}
          <div className="w-full lg:w-[480px] shrink-0">
            {eventTypesLoading ? (
              <Card className="p-6 flex justify-center py-16"><Spinner /></Card>
            ) : bookingEvent ? (
              <Card>
                <div className="px-4 py-3 border-b" style={{ borderColor: CS.outlineVariant }}>
                  <h3 className="font-semibold text-sm" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Book a Meeting</h3>
                  {eventTypes.length > 1 ? (
                    <select
                      value={bookingEvent.schedulingUrl || bookingEvent.slug}
                      onChange={(e) => { setBookingEvent(eventTypes.find((et) => (et.schedulingUrl || et.slug) === e.target.value) || bookingEvent); setBookingFrameHeight(520); }}
                      className="mt-1.5 w-full rounded-lg px-2 py-1.5 text-xs border outline-none"
                      style={{ background: "#fff", borderColor: CS.outlineVariant, color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}
                    >
                      {eventTypes.map((et) => (
                        <option key={et.schedulingUrl || et.slug} value={et.schedulingUrl || et.slug}>
                          {et.name} ({et.durationMinutes || 30} min)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs mt-0.5" style={{ color: CS.secondary }}>{bookingEvent.name} · {bookingEvent.durationMinutes || 30} minutes</p>
                  )}
                </div>
                <iframe
                  key={bookingFrameKey}
                  title={`Book ${bookingEvent.name}`}
                  src={`${bookingEvent.schedulingUrl}?hide_gdpr_banner=1&hide_event_type_details=1&name=${encodeURIComponent(user?.name || "")}&email=${encodeURIComponent(user?.email || "")}`}
                  style={{ height: bookingFrameHeight }}
                  className="w-full"
                />
              </Card>
            ) : (
              <Card className="p-6">
                <EmptyState icon={CalendarPlus} title="Booking unavailable" description="No booking slots are configured right now. Please check back later." />
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Meeting detail panel */}
      {selected && (
        <SidePanel title={selected.title} subtitle={meetingTypelabel(selected.type)} onClose={() => setSelected(null)}>
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-xs" style={{ color: CS.secondary }}>
              <Clock size={15} />
              {selected.scheduledAt
                ? new Date(selected.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hour12: true })
                : "Awaiting confirmation"}
              {selected.duration ? ` (${selected.duration} mins)` : ""}
            </div>

            <div><Badge {...statusBadge(selected.status)} /></div>

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
        </SidePanel>
      )}
    </PageShell>
  );
}

/* ─── DOCUMENTS ─── */

function fileIcon(type) {
  const map = { pdf: FileText, doc: FileText, docx: FileText, png: FileImage, jpg: FileImage, jpeg: FileImage, xlsx: FileSpreadsheet, zip: FileArchive };
  return map[type?.toLowerCase()] || File;
}

// Invoice PDFs come back from the API as a relative "/api/..." path (they're
// generated on the fly, not stored in cloud storage like uploaded documents).
// Used directly as an <a href>, a relative path resolves against the SPA's
// own origin instead of the API's, so the client-side router swallows the
// navigation and bounces to the dashboard instead of downloading anything.
function resolveFileUrl(url) {
  if (!url) return url;
  return url.startsWith("/api/") ? `${import.meta.env.VITE_API_BASE_URL || ""}${url}` : url;
}

// data: URLs can't be navigated to directly as a top-level tab (browsers
// block it and silently fall back to downloading it under a generated
// name instead) — convert to a blob URL first, which opens/displays inline
// like a normal link. http(s) URLs (uploaded docs, invoice PDFs) open as-is.
function viewDocument(doc) {
  const url = resolveFileUrl(doc.fileUrl);
  if (!url) return;
  if (url.startsWith("data:")) {
    try {
      const [meta, base64] = url.split(",");
      const mime = (meta.match(/data:(.*?);base64/) || [])[1] || "application/octet-stream";
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      const blobUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
      window.open(blobUrl, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch {
      window.open(url, "_blank", "noopener");
    }
    return;
  }
  window.open(url, "_blank", "noopener");
}

// The browser's plain <a download> attribute is ignored for most
// cross-origin URLs (the file API lives on a different domain than the
// SPA), so the filename fell back to whatever random id/hash was last in
// the URL path instead of the document's real name. Fetching it as a blob
// first and downloading that local object URL works regardless of origin.
async function downloadDocument(doc) {
  const url = resolveFileUrl(doc.fileUrl);
  const filename = doc.fileName || doc.name || "document";
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  } catch {
    // Fall back to a plain navigation so the file still opens even if the
    // blob fetch itself failed (e.g. a CORS-restricted response).
    window.open(url, "_blank", "noopener");
  }
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
  const { projects, selectedId } = useClientProject();
  const [docs, setDocs] = useState(() => storeGet("documents"));
  const [loading, setLoading] = useState(() => storeGet("documents").length === 0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const loadDocuments = useCallback(() => {
    // Direct apiGet, not clientApi.getDocuments, which swallows failures and
    // silently resolves with stale cached data instead of retrying.
    return apiGet("/api/client/documents", token)
      .then((data) => { if (Array.isArray(data)) { storeSet("documents", data); setDocs(data); } })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    loadDocuments().finally(() => setLoading(false));
  }, [loadDocuments]);

  useRevalidate(loadDocuments);

  const filtered = docs.filter(d => {
    const matchesProject = belongsToProject(d, selectedId);
    const matchesSearch = (d.name || "").toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || d.status === filter;
    return matchesProject && matchesSearch && matchesFilter;
  });

  const projectManagerFor = (doc) => {
    const project = projects.find((p) => String(p._id || p.id) === String(doc.projectId));
    return project?.projectManager || project?.manager || "Unassigned";
  };

  const filterOpts = [
    { value: "all", label: "All" },
    { value: "final_delivery", label: "Final Delivery" },
    { value: "approved", label: "Approved" },
    { value: "pending_review", label: "Pending Review" },
  ];

  return (
    <PageShell
      title="Documents & Deliverables"
      subtitle="Access all files shared with you by The Copper Studio team."
      action={
        <>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: CS.secondary }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="w-full h-8 pl-8 pr-3 rounded-full border text-sm outline-none copper-focus"
              style={{ background: "#fff", borderColor: CS.outlineVariant, color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}
            />
          </div>
          <FilterButton
            buttonClassName="h-8 w-8"
            onReset={() => setFilter("all")}
            fields={[
              { key: "status", label: "Status", type: "select", value: filter, onChange: setFilter, options: filterOpts, allValue: "all" }
            ]}
          />
        </>
      }
    >
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
                    {doc.fileType?.toUpperCase()} {doc.fileSize ? `· ${doc.fileSize}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Badge {...docStatusBadge(doc.status)} />
                <span className="text-xs" style={{ color: CS.secondary }}>
                  {projectManagerFor(doc)}
                </span>
              </div>
              <div className="pt-3 border-t flex gap-2" style={{ borderColor: CS.outlineVariant }}>
                {doc.fileUrl ? (
                  <>
                    <button type="button" onClick={() => viewDocument(doc)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all border"
                      style={{ borderColor: CS.outlineVariant, color: CS.onSurface }}>
                      <Eye size={15} />
                      View
                    </button>
                    <button type="button" onClick={() => downloadDocument(doc)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: CS.primary, color: CS.onPrimary }}>
                      <Download size={15} />
                      Download
                    </button>
                  </>
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
  const [allOrders, setAllOrders] = useState(() => storeGet("orders"));
  const [loading, setLoading] = useState(() => storeGet("orders").length === 0);
  const [selectedOrderRaw, setSelectedOrder] = useState(null);

  const loadOrders = useCallback(() => {
    // Direct apiGet, not clientApi.getOrders, which swallows failures and
    // silently resolves with stale cached data instead of retrying.
    return apiGet("/api/client/orders", token)
      .then((data) => { if (Array.isArray(data)) { storeSet("orders", data); setAllOrders(data); } })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    loadOrders().finally(() => setLoading(false));
  }, [loadOrders]);

  useRevalidate(loadOrders);

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
              { Icon: ReceiptText, label: "Total Invoices", value: orders.length, color: "#4caf50" },
              { Icon: Clock, label: "Pending", value: orders.filter(o => o.payment?.status !== "paid").length, color: "#ff9800" },
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
                        <tr style={{ background: "#8D3118", color: "#ffffff", fontSize: 12, letterSpacing: "0.05em" }}>
                          <th className="px-6 py-3 text-left font-bold uppercase text-white">Invoice</th>
                          <th className="px-6 py-3 text-left font-bold uppercase text-white">Package</th>
                          <th className="px-6 py-3 text-left font-bold uppercase text-white">Date</th>
                          <th className="px-6 py-3 text-right font-bold uppercase text-white">Amount</th>
                          <th className="px-6 py-3 text-left font-bold uppercase text-white">Coupon</th>
                          <th className="px-6 py-3 text-left font-bold uppercase text-white">Status</th>
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
                            <td className="px-6 py-4 text-sm font-mono" style={{ color: CS.secondary }}>
                              {o.payment?.couponCode || "-"}
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
                    {selectedOrder.package?.total > 0 && (() => {
                      // Mirrors the server-side invoice math (invoiceTemplate.js): the
                      // stored package.total is already GST-inclusive and post-discount,
                      // so the taxable base and discount are derived by working backwards
                      // from it — same-state (seller is Maharashtra, code 27) splits GST
                      // into CGST+SGST; any other client GSTIN state code charges IGST.
                      const totalPaid = Number(selectedOrder.package?.total || 0);
                      const taxableBase = Math.round(totalPaid / 1.18);
                      const couponCode = selectedOrder.payment?.couponCode;
                      // Fall back to the taxable base when no original pre-discount price
                      // is on record (e.g. manually-created invoices), so the discount
                      // line never goes negative.
                      const planAmount = Number(selectedOrder.package?.price || 0) || taxableBase;
                      const discount = couponCode ? Math.max(0, planAmount - taxableBase) : 0;
                      const gstAmount = totalPaid - taxableBase;
                      const clientGstin = selectedOrder.customer?.companyGstin || "";
                      const clientStateCode = clientGstin ? clientGstin.slice(0, 2) : "27";
                      const isInterState = clientStateCode !== "27";
                      const fmt = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;
                      return (
                        <div className="pt-3 border-t space-y-2" style={{ borderColor: CS.outlineVariant }}>
                          <p className="text-xs font-semibold mb-1" style={{ color: CS.secondary }}>GST Details</p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs" style={{ color: CS.secondary }}>Plan Amount</span>
                            <span className="text-xs font-medium" style={{ color: CS.onSurface }}>{fmt(planAmount)}</span>
                          </div>
                          {couponCode && (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-xs" style={{ color: CS.secondary }}>Discount ({couponCode})</span>
                                <span className="text-xs font-medium" style={{ color: "#388e3c" }}>-{fmt(discount)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs" style={{ color: CS.secondary }}>Amount After Discount</span>
                                <span className="text-xs font-medium" style={{ color: CS.onSurface }}>{fmt(taxableBase)}</span>
                              </div>
                            </>
                          )}
                          {isInterState ? (
                            <div className="flex justify-between items-center">
                              <span className="text-xs" style={{ color: CS.secondary }}>IGST (18%)</span>
                              <span className="text-xs font-medium" style={{ color: CS.onSurface }}>{fmt(gstAmount)}</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-xs" style={{ color: CS.secondary }}>SGST (9%)</span>
                                <span className="text-xs font-medium" style={{ color: CS.onSurface }}>{fmt(gstAmount / 2)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs" style={{ color: CS.secondary }}>CGST (9%)</span>
                                <span className="text-xs font-medium" style={{ color: CS.onSurface }}>{fmt(gstAmount / 2)}</span>
                              </div>
                            </>
                          )}
                          <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: CS.outlineVariant }}>
                            <span className="text-xs font-bold" style={{ color: CS.onSurface }}>Total Amount Paid</span>
                            <span className="text-sm font-bold" style={{ color: CS.primary }}>{fmt(totalPaid)}</span>
                          </div>
                        </div>
                      );
                    })()}
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
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [deactivateModal, setDeactivateModal] = useState(false);

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
  const [sessions, setSessions] = useState(null);
  const [revokingSid, setRevokingSid] = useState("");

  useEffect(() => {
    if (tab !== "Security" || !token) return;
    let alive = true;
    clientApi.getSessions(token)
      .then((data) => { if (alive) setSessions(data.sessions || []); })
      .catch(() => { if (alive) setSessions([]); });
    return () => { alive = false; };
  }, [tab, token]);

  async function revokeSession(sid) {
    setRevokingSid(sid);
    try {
      await clientApi.revokeSession(sid, token);
      setSessions((prev) => (prev || []).filter((s) => s.sid !== sid));
      showToast({ title: "Session signed out", message: "That device no longer has access." });
    } catch (err) {
      showToast({ type: "error", title: "Couldn't sign out that session", message: err.message || "Something went wrong." });
    } finally {
      setRevokingSid("");
    }
  }

  // Browser notifications need the OS/browser's own permission grant, which
  // can only be requested from a user gesture — this toggle click is one.
  // If the user denies (or has denied before), the toggle snaps back off
  // instead of silently claiming to be enabled.
  async function handlePrefToggle(key, value) {
    if (key === "browser" && value) {
      if (!isNotificationSupported()) {
        showToast({ type: "error", title: "Not supported", message: "This browser doesn't support notifications." });
        return;
      }
      const granted = await requestBrowserNotificationPermission();
      if (!granted) {
        showToast({
          type: "error",
          title: "Permission denied",
          message: "Allow notifications for this site in your browser settings, then try again.",
        });
        return;
      }
    }
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  function handleAccountDeactivated() {
    showToast({ title: "Account deactivated", message: "Your portal access has been revoked. Your data has been retained." });
    auth.logout();
    navigate("/login", { replace: true });
  }

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

      {success && <p className="text-xs font-medium px-4 py-3 rounded-lg mb-4" style={{ background: "#e8f5e9", color: "#388e3c" }}>{success}</p>}
      {error && <p className="text-xs font-medium px-4 py-3 rounded-lg mb-4" style={{ background: "#fde8e8", color: CS.error }}>{error}</p>}

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
                  <Toggle checked={prefs[item.key]} onChange={v => handlePrefToggle(item.key, v)} />
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
              {sessions === null ? (
                <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin" style={{ color: CS.secondary }} /></div>
              ) : sessions.length === 0 ? (
                <p className="text-sm" style={{ color: CS.secondary }}>No active sessions found.</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div key={session.sid} className="rounded-lg p-4 flex items-center gap-4" style={{ background: CS.surfaceLow }}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center border shrink-0"
                        style={{ background: "#fff", borderColor: CS.outlineVariant }}>
                        <MonitorSmartphone size={20} style={{ color: CS.primary }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{session.device}</p>
                          {session.current && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase" style={{ background: CS.primaryFixed, color: CS.primary }}>Current</span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: CS.secondary }}>
                          Last active: {new Date(session.lastActiveAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                          {session.ip ? ` · ${session.ip}` : ""}
                        </p>
                      </div>
                      {!session.current && (
                        <button
                          type="button"
                          onClick={() => revokeSession(session.sid)}
                          disabled={revokingSid === session.sid}
                          title="Sign out this device"
                          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-red-50"
                          style={{ color: CS.error }}
                        >
                          {revokingSid === session.sid ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
                          Sign out
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Danger zone */}
            <div className="rounded-xl border p-6" style={{ borderColor: `${CS.error}30`, background: "#fde8e810" }}>
              <h3 className="text-lg font-semibold mb-1" style={{ color: CS.error, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Danger Zone</h3>
              <p className="text-sm mb-4" style={{ color: CS.secondary }}>
                Deactivating your account revokes your portal access immediately. Your projects, documents, and invoices are
                kept exactly as they are — nothing is deleted. Only The Copper Studio team can permanently delete your data,
                from the admin side.
              </p>
              <CsBtn variant="danger" icon={AlertTriangle} onClick={() => setDeactivateModal(true)}>Deactivate Account</CsBtn>
            </div>
          </>
        )}
      </div>
      {deactivateModal && (
        <DeactivateAccountModal
          accountName={user?.name || ""}
          token={token}
          onClose={() => setDeactivateModal(false)}
          onDeactivated={handleAccountDeactivated}
        />
      )}
    </PageShell>
  );
}

// GitHub-style two-phase confirmation: type the exact account name, then a
// final "are you sure" step — matches the deliberate friction of GitHub's own
// "delete this repository" flow so a deactivation can't happen by accident.
// Deactivating only flips the account to "disabled" (blocks login), it never
// deletes any project/document/invoice data — permanent deletion is admin-only.
function DeactivateAccountModal({ accountName: initialAccountName, token, onClose, onDeactivated }) {
  const { showToast } = useToast();
  const [phase, setPhase] = useState(1);
  const [typedName, setTypedName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // The cached auth.user.name (from login time) can drift from the database
  // — a profile edit since then, or plain staleness — while the server's
  // confirm check always compares against the current value. Re-fetch it
  // fresh here so what the client-side gate accepts is exactly what the
  // server will accept too, instead of "matched locally, rejected on save".
  const [accountName, setAccountName] = useState(initialAccountName);
  useEffect(() => {
    apiGet("/api/client/profile", token)
      .then((data) => { if (data?.user?.name) setAccountName(data.user.name); })
      .catch(() => {});
  }, [token]);
  const normalize = (s) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const nameMatches = normalize(typedName) === normalize(accountName);

  async function confirmDeactivate() {
    setSubmitting(true);
    try {
      await clientApi.deactivateAccount(typedName.trim(), token);
      onDeactivated();
    } catch (err) {
      showToast({ type: "error", title: "Couldn't deactivate", message: err.message || "Something went wrong. Try again." });
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border bg-white shadow-2xl"
        style={{ borderColor: CS.outlineVariant }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b p-5" style={{ borderColor: CS.outlineVariant }}>
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: "#fde8e8", color: CS.error }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              {phase === 1 ? "Deactivate your account" : "Are you absolutely sure?"}
            </h3>
            <p className="mt-0.5 text-xs" style={{ color: CS.secondary }}>
              {phase === 1
                ? "This immediately revokes your portal login. Your data is kept, not deleted."
                : "This is your last chance to back out."}
            </p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {phase === 1 ? (
            <>
              <p className="text-sm" style={{ color: CS.onSurface }}>
                Type <span className="font-bold">{accountName}</span> to confirm you want to deactivate this account.
              </p>
              <input
                autoFocus
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder={accountName}
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all copper-focus"
                style={{ background: "#fff", borderColor: CS.outlineVariant, color: CS.onSurface, fontFamily: "'DM Sans', system-ui, sans-serif" }}
              />
            </>
          ) : (
            <div className="rounded-xl border p-4" style={{ borderColor: `${CS.error}40`, background: "#fde8e810" }}>
              <p className="text-sm font-semibold" style={{ color: CS.error }}>You will be signed out immediately.</p>
              <p className="mt-1 text-xs" style={{ color: CS.secondary }}>
                Your projects, documents, and invoices stay exactly as they are. Reach out to The Copper Studio to
                reactivate, or to permanently delete your data.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t p-4" style={{ borderColor: CS.outlineVariant }}>
          <CsBtn variant="secondary" onClick={onClose} disabled={submitting}>Cancel</CsBtn>
          {phase === 1 ? (
            <CsBtn variant="danger" disabled={!nameMatches} onClick={() => setPhase(2)}>Continue</CsBtn>
          ) : (
            <CsBtn variant="danger" icon={AlertTriangle} loading={submitting} onClick={confirmDeactivate}>
              Deactivate Account
            </CsBtn>
          )}
        </div>
      </div>
    </div>
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
