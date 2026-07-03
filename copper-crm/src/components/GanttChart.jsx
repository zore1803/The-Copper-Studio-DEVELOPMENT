import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { DAY_MS, formatRange, today } from "../lib/dates";

/**
 * Shared Gantt chart used across the whole app (client Stage Timeline, admin
 * Project/Task timelines). One design, one behaviour set:
 *   - infinite forward/backward scroll (the date window extends as you reach an edge)
 *   - Day / Week / Month / Quarter zoom via a dropdown
 *   - trackpad pinch (Ctrl+wheel) stretches/squeezes the sheet, anchored to the cursor
 *   - undated rows still appear (no bar, "Dates not set") until dates are assigned
 *
 * Feed it pre-normalised rows: { id, title, status, start, end, subtitle?,
 * needsDates?, danger?, raw? }. Colour comes from `statusColor[status]`.
 *
 * Two layouts:
 *   - flat (default): pass `rows` + `statusOrder`; rows render as one list,
 *     ordered by status, each tinted by its own status colour (no header rows).
 *   - grouped: pass `groups` = [{ id, title, rows }]; each group gets a
 *     collapsible header. Used by the admin timelines that group by project/status.
 *
 * `onRowClick(row)` (optional) makes bars/names clickable — the admin timelines
 * use it to open the stage editor.
 */

const CS = {
  primary: "var(--cs-primary)",
  primaryFixed: "var(--cs-primary-fixed)",
  surfaceLowest: "var(--cs-surface-container-lowest)",
  surfaceLow: "var(--cs-surface-container-low)",
  outlineVariant: "var(--cs-outline-variant)",
  onSurface: "var(--cs-on-surface)",
  secondary: "var(--cs-secondary)",
  error: "var(--cs-error)",
};

const GANTT_ZOOM = {
  Day: { unit: "day", colWidth: 48 },
  Week: { unit: "week", colWidth: 130 },
  Month: { unit: "week", colWidth: 74 },
  Quarter: { unit: "week", colWidth: 38 },
};
const GANTT_TODAY = today();
const GANTT_SCALE_MIN = 0.4;
const GANTT_SCALE_MAX = 4;
const GANTT_LEFT_PANEL_PX = 224; // matches the sticky w-56 name rail
const PAD_WEEKS = 4;
const EXTEND_WEEKS = 8;
const DEFAULT_BAR_COLOR = "#8D3118";

function startOfWeek(ms) {
  const x = new Date(ms);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl border shadow-sm ${className}`} style={{ background: CS.surfaceLowest, borderColor: CS.outlineVariant }}>
      {children}
    </div>
  );
}

export default function GanttChart({
  title,
  icon: Icon,
  rows,
  groups,
  statusOrder = [],
  statusColor = {},
  rowLabel = "item",
  emptyTitle = "Nothing scheduled yet.",
  emptyDescription = "Items with start and end dates will appear here.",
  doneStatus,
  blockedStatus,
  collapsible = true,
  onRowClick,
}) {
  const isGrouped = Array.isArray(groups);
  const [zoom, setZoom] = useState("Week");
  const [scale, setScale] = useState(1);
  const [collapsed, setCollapsed] = useState({});
  const scrollRef = useRef(null);
  const pendingPrependPx = useRef(0);
  const lastScrollLeft = useRef(0);
  const didInitialScroll = useRef(false);
  const pendingZoom = useRef(null);
  const dayWidthRef = useRef(0);

  const { allRows, orderedRows, legendStatuses, dataMin, dataMax, summary } = useMemo(() => {
    const flat = isGrouped ? groups.flatMap((g) => g.rows) : (rows || []);
    if (!flat.length) {
      return { allRows: [], orderedRows: [], legendStatuses: [], dataMin: GANTT_TODAY, dataMax: GANTT_TODAY, summary: { total: 0, completed: 0, blocked: 0 } };
    }
    const datedTimes = flat.flatMap((r) => [r.start, r.end]).filter(Boolean).map((d) => d.getTime());
    const min = datedTimes.length ? new Date(Math.min(...datedTimes)) : GANTT_TODAY;
    const max = datedTimes.length ? new Date(Math.max(...datedTimes)) : GANTT_TODAY;
    const ordered = statusOrder.length
      ? statusOrder.flatMap((s) => flat.filter((r) => r.status === s)).concat(flat.filter((r) => !statusOrder.includes(r.status)))
      : flat;
    const legend = statusOrder.length
      ? statusOrder.filter((s) => flat.some((r) => r.status === s))
      : Array.from(new Set(flat.map((r) => r.status).filter(Boolean)));
    return {
      allRows: flat,
      orderedRows: ordered,
      legendStatuses: legend,
      dataMin: min,
      dataMax: max,
      summary: {
        total: flat.length,
        completed: doneStatus ? flat.filter((r) => r.status === doneStatus).length : 0,
        blocked: blockedStatus ? flat.filter((r) => r.status === blockedStatus).length : 0,
      },
    };
  }, [isGrouped, groups, rows, statusOrder, doneStatus, blockedStatus]);

  const [windowStart, setWindowStart] = useState(() => startOfWeek(dataMin.getTime() - PAD_WEEKS * 7 * DAY_MS));
  const [windowEnd, setWindowEnd] = useState(() => startOfWeek(dataMax.getTime() + (PAD_WEEKS + 1) * 7 * DAY_MS));

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

  // A single flat list of what to render (group headers + rows), so the left
  // rail and the bar area stay perfectly aligned in both modes.
  const items = [];
  if (isGrouped) {
    for (const g of groups) {
      items.push({ kind: "header", group: g });
      if (!(collapsible && collapsed[g.id])) for (const r of g.rows) items.push({ kind: "row", row: r });
    }
  } else {
    for (const r of orderedRows) items.push({ kind: "row", row: r });
  }

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
    if (!didInitialScroll.current && allRows.length) {
      el.scrollLeft = Math.max(0, leftPx(dataMin) - colWidth);
      lastScrollLeft.current = el.scrollLeft;
      didInitialScroll.current = true;
    }
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    function onWheel(e) {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const dw = dayWidthRef.current || 1;
      pendingZoom.current = { anchorDays: (el.scrollLeft + cursorX - GANTT_LEFT_PANEL_PX) / dw, cursorX };
      setScale((s) => {
        const next = s * (1 - e.deltaY * 0.01);
        return Math.min(GANTT_SCALE_MAX, Math.max(GANTT_SCALE_MIN, Math.round(next * 100) / 100));
      });
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [allRows.length]);

  function handleScroll(event) {
    const el = event.currentTarget;
    if (el.scrollLeft === lastScrollLeft.current) return;
    const movingLeft = el.scrollLeft < lastScrollLeft.current;
    lastScrollLeft.current = el.scrollLeft;
    const edge = Math.max(colWidth * 3, 200);
    if (movingLeft && el.scrollLeft < edge) {
      pendingPrependPx.current += EXTEND_WEEKS * 7 * dayWidth;
      setWindowStart((prev) => new Date(prev.getTime() - EXTEND_WEEKS * 7 * DAY_MS));
    } else if (!movingLeft && el.scrollWidth - el.scrollLeft - el.clientWidth < edge) {
      setWindowEnd((prev) => new Date(prev.getTime() + EXTEND_WEEKS * 7 * DAY_MS));
    }
  }

  if (!allRows.length) {
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

  const barColorFor = (row) => statusColor[row.status] || DEFAULT_BAR_COLOR;

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
            <p className="text-xs" style={{ color: CS.secondary }}>{summary.total} {rowLabel}{summary.total === 1 ? "" : "s"} · scroll to explore</p>
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
      {legendStatuses.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b px-5 py-2.5" style={{ borderColor: CS.outlineVariant }}>
          {legendStatuses.map((status) => (
            <span key={status} className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: CS.secondary }}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: statusColor[status] || DEFAULT_BAR_COLOR }} /> {status}
            </span>
          ))}
        </div>
      )}

      {/* Chart */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex max-h-[560px] overflow-auto">
        {/* Sticky left: names */}
        <div className="sticky left-0 z-20 w-56 shrink-0 border-r" style={{ borderColor: CS.outlineVariant, background: CS.surfaceLowest }}>
          <div className="flex h-11 items-center px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: CS.secondary, background: CS.surfaceLow }}>
            {rowLabel}
          </div>
          {items.map((item, i) =>
            item.kind === "header" ? (
              <button
                key={`h-${item.group.id}-${i}`}
                type="button"
                onClick={() => collapsible && setCollapsed((c) => ({ ...c, [item.group.id]: !c[item.group.id] }))}
                className="flex h-9 w-full items-center gap-2 px-3 text-left"
                style={{ background: CS.surfaceLow }}
              >
                {collapsible && (collapsed[item.group.id] ? <ChevronRight size={13} style={{ color: CS.secondary }} /> : <ChevronDown size={13} style={{ color: CS.secondary }} />)}
                <span className="truncate text-xs font-bold" style={{ color: CS.onSurface }}>{item.group.title}</span>
                <span className="ml-auto text-[10px] font-bold" style={{ color: CS.secondary }}>{item.group.rows.length}</span>
              </button>
            ) : (
              <div
                key={item.row.id}
                onClick={onRowClick ? () => onRowClick(item.row) : undefined}
                className={`flex h-12 flex-col justify-center px-4 border-b ${onRowClick ? "cursor-pointer hover:bg-black/[0.02]" : ""}`}
                style={{ borderColor: CS.outlineVariant }}
              >
                <span className="flex items-center gap-2 truncate text-xs font-semibold" style={{ color: CS.onSurface }}>
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: barColorFor(item.row) }} />
                  {item.row.title}
                </span>
                <span className="truncate pl-4 text-[10px]" style={{ color: CS.secondary }}>
                  {item.row.start && item.row.end ? formatRange(item.row.start, item.row.end) : "Dates not set"}
                  {item.row.subtitle ? ` · ${item.row.subtitle}` : ""}
                </span>
              </div>
            )
          )}
        </div>

        {/* Right: bars */}
        <div className="flex-1">
          <div style={{ minWidth: `${timelineWidth}px` }}>
            <div className="sticky top-0 z-10 flex h-11" style={{ background: CS.surfaceLowest }}>
              {columns.map((col, index) => (
                <div key={index} style={{ width: `${colWidth}px`, borderColor: CS.outlineVariant }} className="flex shrink-0 items-center justify-center border-b border-l text-[10px] font-bold uppercase">
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
              {items.map((item, i) => {
                if (item.kind === "header") {
                  return <div key={`hr-${item.group.id}-${i}`} className="h-9 border-b" style={{ borderColor: CS.outlineVariant, background: CS.surfaceLow }} />;
                }
                const row = item.row;
                if (!row.start || !row.end) {
                  return <div key={row.id} className="h-12 border-b" style={{ borderColor: CS.outlineVariant }} />;
                }
                const left = leftPx(row.start);
                const days = Math.max(1, Math.round((row.end - row.start) / DAY_MS) + 1);
                const width = Math.max(days * dayWidth, 70);
                return (
                  <div key={row.id} className="relative h-12 border-b" style={{ borderColor: CS.outlineVariant }}>
                    <div
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={`absolute top-2.5 flex h-7 items-center gap-1.5 overflow-hidden rounded-lg px-2 text-[10px] font-bold text-white shadow-sm ${onRowClick ? "cursor-pointer" : ""}`}
                      style={{
                        left: `${left}px`,
                        width: `${width}px`,
                        background: barColorFor(row),
                        outline: row.danger ? "2px solid var(--cs-error)" : undefined,
                        outlineOffset: row.danger ? "1px" : undefined,
                      }}
                      title={`${row.title}\n${row.status || ""}${row.subtitle ? ` · ${row.subtitle}` : ""}\n${formatRange(row.start, row.end)} (${days}d)`}
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
