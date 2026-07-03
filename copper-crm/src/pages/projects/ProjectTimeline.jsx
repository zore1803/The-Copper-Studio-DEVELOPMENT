import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  CalendarRange, CheckCircle2, Columns3, GripVertical,
  Plus, Save, Trash2, Sparkles, AlertTriangle
} from "lucide-react";
import { Button } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import SidePanel from "../../components/SidePanel";
import ProjectHeader from "./ProjectHeader";
import { today, DAY_MS, parseFullDate, parseShortDate, formatRange } from "../../lib/dates";
import { TASK_STATUSES, normalizeTaskStatus, COLUMN_TO_STAGE_STATUS } from "../../lib/taskStatus";
import { projectRollup } from "../../lib/stageProgress";
import GanttChart from "../../components/GanttChart";

// Bar/legend colours for the canonical stage statuses (mirrors STATUS_DOT).
const STAGE_STATUS_COLOR = {
  "To Do": "#0ea5e9",
  "In Progress": "#f59e0b",
  Review: "#8b5cf6",
  Done: "#10b981",
};

function getProgressText(start, end, status, needsDates = false) {
  if (needsDates || status === "Done" || !start || !end) return "";
  const TODAY = today();
  const totalDays = Math.max(1, Math.round((end - start) / DAY_MS));
  if (TODAY < start) {
    return `0/${totalDays}d`;
  } else if (TODAY > end) {
    return `${totalDays}/${totalDays}d (Overdue)`;
  } else {
    const elapsed = Math.max(0, Math.round((TODAY - start) / DAY_MS));
    const left = Math.max(0, totalDays - elapsed);
    return left > 0 ? `${elapsed}/${totalDays}d (${left} left)` : `${elapsed}/${totalDays}d`;
  }
}

const STATUS_DOT = {
  "To Do": "bg-sky-500",
  "In Progress": "bg-amber-500",
  Review: "bg-violet-500",
  Done: "bg-emerald-500",
};

const priorityConfig = {
  High: "bg-red-50 text-red-600 border-red-100",
  Medium: "bg-amber-50 text-amber-700 border-amber-100",
  Low: "bg-gray-50 text-gray-500 border-gray-200",
};

function TaskField({ label, value, onChange, placeholder = "", type = "text", className = "", min, max }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold text-[#374151]">{label}</span>
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#8D3118] focus:ring-2 focus:ring-[#8D3118]/20"
      />
    </label>
  );
}

export function StageEditorModal({ statuses, initialStatus, stage, mode, projectDates = {}, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(stage);
  const [status, setStatus] = useState(initialStatus);
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  function submit(event) {
    event.preventDefault();
    onSave({ ...form, title: (form.title || "").trim() || "Untitled Stage" }, status);
  }

  return (
    <SidePanel
      title={mode === "create" ? "Create Stage" : "Edit Stage"}
      subtitle="Stages appear on both the board and the project roadmap."
      onClose={onClose}
      footer={
        <div className="flex w-full items-center justify-between">
          {mode === "edit" ? (
            <button type="button" onClick={onDelete} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
              <Trash2 size={14} /> Delete
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={submit}><Save size={14} /> Save Stage</Button>
          </div>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TaskField label="Stage name" value={form.title || ""} onChange={set("title")} className="sm:col-span-2" />
        <label className="block">
          <span className="text-xs font-semibold text-[#374151]">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#8D3118]">
            {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-[#374151]">Priority</span>
          <select value={form.priority || "Medium"} onChange={(e) => set("priority")(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#8D3118]">
            {["High", "Medium", "Low"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <TaskField label="Start date" type="date" value={form.startDate || ""} onChange={set("startDate")} min={projectDates.startDate} max={projectDates.endDate} />
        <TaskField label="Due date" type="date" value={form.dueDate || ""} onChange={set("dueDate")} min={projectDates.startDate} max={projectDates.endDate} />
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-[#374151]">Notes</span>
          <textarea value={form.description || ""} onChange={(e) => set("description")(e.target.value)} rows={3} className="mt-1.5 w-full resize-none rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#8D3118]" />
        </label>
      </div>
    </SidePanel>
  );
}

export function KanbanView({ stages, onDragEnd, onOpenNew, onOpenEdit }) {
  const columns = useMemo(() => {
    const grouped = Object.fromEntries(TASK_STATUSES.map((status) => [status, []]));
    stages.forEach((card) => {
      grouped[normalizeTaskStatus(card.status)].push(card);
    });
    return grouped;
  }, [stages]);

  return (
    <DragDropContext onDragEnd={(result) => onDragEnd(columns, result)}>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {TASK_STATUSES.map((status) => (
          <section key={status} className="flex w-[260px] shrink-0 flex-col rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-[#FFFFFF] px-3.5 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[status]}`} />
                <h3 className="truncate text-sm font-semibold text-[#111827]">{status}</h3>
                <span className="rounded-md bg-[#f9fafb] px-1.5 py-0.5 text-[11px] font-bold text-[#6b7280]">{columns[status].length}</span>
              </div>
              <button onClick={() => onOpenNew(status)} className="grid h-7 w-7 place-items-center rounded-lg text-[#9ca3af] hover:bg-[#f9fafb] hover:text-[#374151]">
                <Plus size={14} />
              </button>
            </div>
            <Droppable droppableId={status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 space-y-2 p-2.5 ${snapshot.isDraggingOver ? "bg-[#fff8f6]" : ""}`}
                  style={{ minHeight: 140 }}
                >
                  {columns[status].map((task, index) => (
                    <Draggable key={task.id || task._id} draggableId={String(task.id || task._id)} index={index}>
                      {(prov, snap) => (
                        <article
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                          onClick={() => onOpenEdit(status, task)}
                          className={`cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition-shadow ${snap.isDragging ? "border-[#8D3118] shadow-md" : "border-[#e5e7eb] hover:border-[#8D3118]/40"}`}
                        >
                          <div className="mb-2 flex items-start gap-2">
                            <GripVertical size={12} className="mt-0.5 shrink-0 text-[#d1d5db]" />
                            <h4 className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-[#111827]">{task.title || task.taskName || "Untitled task"}</h4>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${priorityConfig[task.priority] || priorityConfig.Medium}`}>{task.priority || "Medium"}</span>
                            <span className="text-[10px] font-semibold text-[#9ca3af]">{task.dueDate || task.deadline || "No due date"}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between border-t border-[#FFFFFF] pt-2">
                            <span className="inline-flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-[#9ca3af]">
                              <span className="inline-flex items-center gap-1"><CalendarRange size={11} /> {task.startDate || "No start"}</span>
                              {(() => {
                                const st = task.startDate ? parseFullDate(task.startDate) : null;
                                const en = task.dueDate ? parseFullDate(task.dueDate) : task.endDate ? parseFullDate(task.endDate) : task.deadline ? parseShortDate(task.deadline, new Date().getFullYear()) : null;
                                const pText = getProgressText(st, en, status, !st || !en);
                                return pText ? <span className="text-[#8D3118]">{pText}</span> : null;
                              })()}
                            </span>
                            <div className="flex items-center text-[10px] font-semibold text-violet-500 bg-violet-50 px-2 py-0.5 rounded-full">
                              <Sparkles size={10} className="mr-1" /> Stage
                            </div>
                          </div>
                        </article>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {columns[status].length === 0 && (
                    <div className="grid h-20 place-items-center rounded-lg border border-dashed border-[#e5e7eb] text-[11px] font-semibold text-[#9ca3af]">
                      Drop stages here
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </section>
        ))}
      </div>
    </DragDropContext>
  );
}

export function GanttView({ stages, onOpenEdit, groupBy = "status", groupCategories }) {
  // Normalise each stage into the shared Gantt's row shape, grouped either by
  // an explicit category list, by project, or by status. Undated stages carry
  // null dates (rendered as "Dates not set", no bar) and near-deadline ones are
  // flagged as danger. `raw`/`groupId` ride along so a click can open the editor.
  const groups = useMemo(() => {
    const referenceYear = new Date().getFullYear();
    const TODAY = today();
    const parsed = stages.map((card, i) => {
      const start = card.startDate ? parseFullDate(card.startDate) : null;
      const end = card.dueDate
        ? parseFullDate(card.dueDate)
        : card.endDate
          ? parseFullDate(card.endDate)
          : card.deadline
            ? parseShortDate(card.deadline, referenceYear)
            : null;
      const hasDates = !!start && !!end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime());
      const status = normalizeTaskStatus(card.status);
      let danger = false;
      if (hasDates && status !== "Done" && Math.round((end - TODAY) / DAY_MS) <= 3) danger = true;
      return {
        card,
        status,
        row: {
          id: card.id || card._id || `stage-${i}`,
          title: card.title || card.taskName || card.name || "Untitled",
          status,
          start: hasDates ? start : null,
          end: hasDates ? (end < start ? start : end) : null,
          subtitle: getProgressText(start, end, status, !hasDates) || "",
          danger,
          raw: card,
        },
      };
    });

    const rowsFor = (predicate, groupId) =>
      parsed.filter(predicate).map((p) => ({ ...p.row, groupId }));

    if (groupCategories) {
      return groupCategories.map((cat) => ({
        id: cat.id,
        title: cat.title,
        rows: rowsFor((p) => (groupBy === "project" ? String(p.card.projectId) === String(cat.id) : p.status === cat.id), cat.id),
      }));
    }
    if (groupBy === "project") {
      return Array.from(new Set(parsed.map((p) => p.card.projectName || "Unknown Project"))).map((name) => ({
        id: name,
        title: name,
        rows: rowsFor((p) => (p.card.projectName || "Unknown Project") === name, name),
      }));
    }
    return TASK_STATUSES
      .map((s) => ({ id: s, title: s, rows: rowsFor((p) => p.status === s, s) }))
      .filter((g) => g.rows.length > 0);
  }, [stages, groupBy, groupCategories]);

  return (
    <GanttChart
      title="Stage Gantt Timeline"
      icon={CalendarRange}
      groups={groups}
      statusColor={STAGE_STATUS_COLOR}
      statusOrder={TASK_STATUSES}
      rowLabel="stage"
      doneStatus="Done"
      onRowClick={(row) => onOpenEdit(row.groupId, row.raw)}
      emptyTitle="No scheduled stages yet."
      emptyDescription="Add start and due dates to stages to see them on the timeline."
    />
  );
}

export default function ProjectTimeline() {
  const { companyId, projectId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { records: companies, loading: companiesLoading } = useCrmRecords("companies");
  const { records: projects, save: saveProject, loading: projectsLoading } = useCrmRecords("projects");
  const [view, setView] = useState("gantt");
  const [stageEditor, setStageEditor] = useState(null);

  const project = useMemo(
    () => projects.find((p) => String(p.id || p._id) === projectId),
    [projects, projectId]
  );
  // companyId is absent under /admin/projects/:id — derive the company from the
  // project. Match against BOTH the company's local id and Mongo _id, since
  // project.companyId is the _id while c.id is the local id.
  const company = useMemo(() => {
    const wanted = [companyId, project?.companyId].filter(Boolean).map(String);
    return companies.find((c) => [c.id, c._id].filter(Boolean).map(String).some((cid) => wanted.includes(cid)));
  }, [companies, companyId, project]);

  // The board is driven entirely by the project's stages — each stage renders as one
  // card on the Kanban / Gantt. There is no separate "task" concept here, so anything
  // added on this board is a stage and shows up on the project roadmap too.
  const stageCards = useMemo(() => {
    if (!project || !Array.isArray(project.stages)) return [];
    const pid = String(project.id || project._id);
    return project.stages.map((stage, idx) => ({
      isStage: true,
      stageIndex: idx,
      id: stage.id || stage._id || `stage-${pid}-${idx}`,
      title: stage.name || "Untitled Stage",
      status: normalizeTaskStatus(stage.status),
      priority: stage.priority || "Medium",
      startDate: stage.startDate ? String(stage.startDate).slice(0, 10) : "",
      dueDate: stage.endDate ? String(stage.endDate).slice(0, 10) : "",
      description: stage.notes || "",
    }));
  }, [project]);

  // While the records are still loading on first mount, show a spinner instead of
  // the "not found" message — otherwise it flashes for a moment before the data
  // arrives (e.g. when navigating in from the Overview tab).
  if ((!company || !project) && (companiesLoading || projectsLoading)) {
    return (
      <div className="rounded-xl border border-dashed border-[#e5e7eb] bg-white p-10 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-[#8D3118]" />
        <p className="mt-4 text-sm font-semibold text-[#6b7280]">Loading timeline…</p>
      </div>
    );
  }

  if (!company || !project) {
    return (
      <div className="rounded-xl border border-dashed border-[#e5e7eb] bg-white p-10 text-center">
        <p className="text-sm font-semibold text-[#6b7280]">We couldn't find that project for this company.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate("/admin/companies")}>Back to Companies</Button>
      </div>
    );
  }

  function openNewStage(status = "To Do") {
    // Default to a today → +4 days window so a new stage shows on the Gantt right away;
    // the admin can adjust the dates in the editor.
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const start = today();
    const due = new Date(start.getTime() + 4 * DAY_MS);
    setStageEditor({
      mode: "create",
      status,
      stageIndex: -1,
      card: { title: "", priority: "Medium", startDate: fmt(start), dueDate: fmt(due), description: "" },
    });
  }

  function openEditStage(status, card) {
    setStageEditor({ mode: "edit", status, stageIndex: card.stageIndex, card });
  }

  async function handleSaveStage(form, status) {
    const pStartStr = project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : null;
    const pEndStr = (project.expectedEndDate || project.endDate) ? new Date(project.expectedEndDate || project.endDate).toISOString().slice(0, 10) : null;

    if (form.startDate && pStartStr && form.startDate < pStartStr) {
      return showToast({ type: "error", title: "Invalid Date", message: `Stage start date cannot be before project start (${pStartStr}).` });
    }
    if (form.dueDate && pEndStr && form.dueDate > pEndStr) {
      return showToast({ type: "error", title: "Invalid Date", message: `Stage due date cannot be after project end (${pEndStr}).` });
    }

    try {
      const stageStatus = COLUMN_TO_STAGE_STATUS[status] || "not_started";
      const stages = [...(project.stages || [])];
      const stageData = {
        name: (form.title || "").trim() || "Untitled Stage",
        status: stageStatus,
        priority: form.priority || "Medium",
        startDate: form.startDate || null,
        endDate: form.dueDate || null,
        notes: form.description || "",
        completedAt: stageStatus === "completed" ? new Date().toISOString() : null,
      };
      const isNew = stageEditor.mode !== "edit" || stageEditor.stageIndex < 0;
      if (!isNew && stages[stageEditor.stageIndex]) {
        stages[stageEditor.stageIndex] = { ...stages[stageEditor.stageIndex], ...stageData };
      } else {
        stages.push({ id: `stage-${Date.now()}`, ...stageData });
      }
      await saveProject(projectRollup(project, stages));
      setStageEditor(null);
      showToast({ title: isNew ? "Stage created" : "Stage updated", message: `${stageData.name} saved in ${status}.` });
    } catch (error) {
      showToast({ type: "error", title: "Could not save stage", message: error.message });
    }
  }

  async function handleDeleteStage(card) {
    try {
      const stages = [...(project.stages || [])];
      if (card.stageIndex >= 0 && stages[card.stageIndex]) {
        stages.splice(card.stageIndex, 1);
        await saveProject(projectRollup(project, stages));
      }
      setStageEditor(null);
      showToast({ title: "Stage deleted", message: `${card.title || "Stage"} removed.` });
    } catch (error) {
      showToast({ type: "error", title: "Could not delete stage", message: error.message });
    }
  }

  async function handleDragEnd(columns, result) {
    const { source, destination } = result;
    if (!destination) return;
    // Same column = reorder only; status doesn't change on a status board, so nothing to persist.
    if (source.droppableId === destination.droppableId) return;

    const movedCard = columns[source.droppableId][source.index];
    const newStageStatus = COLUMN_TO_STAGE_STATUS[destination.droppableId] || "not_started";
    try {
      const stages = [...(project.stages || [])];
      if (stages[movedCard.stageIndex]) {
        stages[movedCard.stageIndex] = {
          ...stages[movedCard.stageIndex],
          status: newStageStatus,
          completedAt: newStageStatus === "completed" ? new Date().toISOString() : null,
        };
        await saveProject(projectRollup(project, stages));
        showToast({ title: "Success", message: `Stage "${movedCard.title}" moved to ${destination.droppableId}` });
      }
    } catch (err) {
      console.error(err);
      showToast({ type: "error", title: "Error", message: "Failed to move stage" });
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-[#f8fafc]">
      <ProjectHeader
        company={company}
        project={project}
        activeTab="Timeline"
        actionLabel="New Stage"
        actionIcon={Plus}
        onAction={() => openNewStage()}
      />

      <div className="flex-1 space-y-5 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#111827]">Project Timeline</h3>
        <div className="flex items-center rounded-full border border-[#e5e7eb] bg-white p-0.5">
          <button
            onClick={() => setView("gantt")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${view === "gantt" ? "bg-[#fff1ec] text-[#8D3118]" : "text-[#9ca3af] hover:text-[#374151]"}`}
          >
            <CalendarRange size={13} /> Gantt
          </button>
          <button
            onClick={() => setView("kanban")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${view === "kanban" ? "bg-[#fff1ec] text-[#8D3118]" : "text-[#9ca3af] hover:text-[#374151]"}`}
          >
            <Columns3 size={13} /> Kanban
          </button>
        </div>
      </div>

      {view === "kanban" ? (
        <KanbanView stages={stageCards} onDragEnd={handleDragEnd} onOpenNew={openNewStage} onOpenEdit={openEditStage} />
      ) : (
        <GanttView stages={stageCards} onOpenEdit={openEditStage} />
      )}
      </div>

      {stageEditor && (
        <StageEditorModal
          statuses={TASK_STATUSES}
          initialStatus={stageEditor.status}
          stage={stageEditor.card}
          mode={stageEditor.mode}
          projectDates={{
            startDate: project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : undefined,
            endDate: (project.expectedEndDate || project.endDate) ? new Date(project.expectedEndDate || project.endDate).toISOString().slice(0, 10) : undefined,
          }}
          onClose={() => setStageEditor(null)}
          onSave={(form, status) => handleSaveStage(form, status)}
          onDelete={() => handleDeleteStage(stageEditor.card)}
        />
      )}
    </div>
  );
}
