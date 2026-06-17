import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  CalendarRange, Columns3, GripVertical, MessageSquare,
  Plus, Save, Trash2,
} from "lucide-react";
import { Avatar, Button } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import SidePanel from "../../components/SidePanel";
import ProjectHeader from "./ProjectHeader";
import { TODAY, DAY_MS, parseFullDate, parseShortDate, formatRange } from "../../lib/dates";

const TASK_STATUSES = ["Backlog", "To Do", "In Progress", "Review", "Completed", "Blocked"];

const STATUS_DOT = {
  Backlog: "bg-gray-400",
  "To Do": "bg-sky-500",
  "In Progress": "bg-amber-500",
  Review: "bg-indigo-500",
  Completed: "bg-emerald-500",
  Blocked: "bg-red-500",
};

const priorityConfig = {
  High: "bg-red-50 text-red-600 border-red-100",
  Medium: "bg-amber-50 text-amber-700 border-amber-100",
  Low: "bg-gray-50 text-gray-500 border-gray-200",
};

const ZOOM_LEVELS = { Week: 150, Month: 80, Quarter: 40 };

function reorder(list, startIndex, endIndex) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

function move(source, destination, droppableSource, droppableDestination) {
  const sourceClone = Array.from(source);
  const destClone = Array.from(destination);
  const [removed] = sourceClone.splice(droppableSource.index, 1);
  destClone.splice(droppableDestination.index, 0, removed);
  return {
    [droppableSource.droppableId]: sourceClone,
    [droppableDestination.droppableId]: destClone,
  };
}

function TaskField({ label, value, onChange, placeholder = "", type = "text", className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold text-[#374151]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-[#E1E4EA] px-3 py-2 text-sm outline-none focus:border-[#C57E5B] focus:ring-2 focus:ring-[#C57E5B]/20"
      />
    </label>
  );
}

function TaskEditorModal({ statuses, initialStatus, task, mode, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(task);
  const [status, setStatus] = useState(initialStatus);
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  function submit(event) {
    event.preventDefault();
    onSave({ ...form, title: (form.title || "").trim() || "Untitled task" }, status);
  }

  return (
    <SidePanel
      title={mode === "create" ? "Create Task" : "Edit Task"}
      subtitle="Update task details, owner, priority, and stage."
      onClose={onClose}
      footer={
        <div className="flex w-full items-center justify-between">
          {mode === "edit" ? (
            <button type="button" onClick={() => onDelete(task)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
              <Trash2 size={14} /> Delete
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={submit}><Save size={14} /> Save Task</Button>
          </div>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TaskField label="Task title" value={form.title || ""} onChange={set("title")} className="sm:col-span-2" />
        <label className="block">
          <span className="text-xs font-semibold text-[#374151]">Stage</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#E1E4EA] px-3 py-2 text-sm outline-none focus:border-[#C57E5B]">
            {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-[#374151]">Priority</span>
          <select value={form.priority || "Medium"} onChange={(e) => set("priority")(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#E1E4EA] px-3 py-2 text-sm outline-none focus:border-[#C57E5B]">
            {["High", "Medium", "Low"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <TaskField label="Assignee" value={form.assignedTo || form.assignee || ""} onChange={set("assignedTo")} />
        <TaskField label="Start date" type="date" value={form.startDate || ""} onChange={set("startDate")} />
        <TaskField label="Due date" type="date" value={form.dueDate || ""} onChange={set("dueDate")} />
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-[#374151]">Description</span>
          <textarea value={form.description || ""} onChange={(e) => set("description")(e.target.value)} rows={3} className="mt-1.5 w-full resize-none rounded-lg border border-[#E1E4EA] px-3 py-2 text-sm outline-none focus:border-[#C57E5B]" />
        </label>
      </div>
    </SidePanel>
  );
}

function KanbanView({ tasks, onDragEnd, onOpenNew, onOpenEdit }) {
  const columns = useMemo(() => {
    const grouped = Object.fromEntries(TASK_STATUSES.map((status) => [status, []]));
    tasks.forEach((task) => {
      const status = grouped[task.status] ? task.status : "Backlog";
      grouped[status].push(task);
    });
    return grouped;
  }, [tasks]);

  return (
    <DragDropContext onDragEnd={(result) => onDragEnd(columns, result)}>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {TASK_STATUSES.map((status) => (
          <section key={status} className="flex w-[260px] shrink-0 flex-col rounded-xl border border-[#E1E4EA] bg-white shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-[#f1f1f5] px-3.5 py-3">
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
                          className={`cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition-shadow ${snap.isDragging ? "border-[#C57E5B] shadow-md" : "border-[#E1E4EA] hover:border-[#C57E5B]/40"}`}
                        >
                          <div className="mb-2 flex items-start gap-2">
                            <GripVertical size={12} className="mt-0.5 shrink-0 text-[#d1d5db]" />
                            <h4 className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-[#111827]">{task.title || task.taskName || "Untitled task"}</h4>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${priorityConfig[task.priority] || priorityConfig.Medium}`}>{task.priority || "Medium"}</span>
                            <span className="text-[10px] font-semibold text-[#9ca3af]">{task.dueDate || task.deadline || "No due date"}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between border-t border-[#f1f1f5] pt-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#9ca3af]">
                              <MessageSquare size={11} /> {task.comments || 0}
                            </span>
                            <Avatar name={task.assignedTo || task.assignee} size="sm" />
                          </div>
                        </article>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {columns[status].length === 0 && (
                    <div className="grid h-20 place-items-center rounded-lg border border-dashed border-[#E1E4EA] text-[11px] font-semibold text-[#9ca3af]">
                      Drop tasks here
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

function GanttView({ tasks, onOpenEdit }) {
  const [zoom, setZoom] = useState("Week");
  const [collapsed, setCollapsed] = useState({});

  const { groups, minDate, maxDate, weeks } = useMemo(() => {
    const referenceYear = new Date().getFullYear();
    const mapped = tasks.map((task) => {
      const end = task.dueDate ? parseFullDate(task.dueDate) : task.deadline ? parseShortDate(task.deadline, referenceYear) : new Date(TODAY.getTime() + 7 * DAY_MS);
      const start = task.startDate ? parseFullDate(task.startDate) : new Date(end.getTime() - 3 * DAY_MS);
      return { ...task, start, end, status: TASK_STATUSES.includes(task.status) ? task.status : "Backlog" };
    });
    if (!mapped.length) return { groups: [], minDate: TODAY, maxDate: TODAY, weeks: [] };

    const allDates = mapped.flatMap((t) => [t.start, t.end]);
    const min = new Date(Math.min(...allDates.map((d) => d.getTime())) - 3 * DAY_MS);
    const max = new Date(Math.max(...allDates.map((d) => d.getTime())) + 3 * DAY_MS);
    const groupList = TASK_STATUSES
      .map((status) => ({ status, tasks: mapped.filter((t) => t.status === status) }))
      .filter((g) => g.tasks.length > 0);

    const totalDays = Math.max(1, Math.ceil((max - min) / DAY_MS));
    const weekCount = Math.max(1, Math.ceil(totalDays / 7));
    const weekCols = Array.from({ length: weekCount }, (_, index) => {
      const weekStart = new Date(min.getTime() + index * 7 * DAY_MS);
      const weekEnd = new Date(Math.min(weekStart.getTime() + 6 * DAY_MS, max.getTime()));
      return { label: formatRange(weekStart, weekEnd) };
    });
    return { groups: groupList, minDate: min, maxDate: max, weeks: weekCols };
  }, [tasks]);

  if (!groups.length) {
    return (
      <div className="rounded-xl border border-dashed border-[#E1E4EA] bg-white p-10 text-center">
        <p className="text-sm font-semibold text-[#111827]">No tasks with dates yet.</p>
        <p className="mt-1 text-sm text-[#6b7280]">Add tasks from the Kanban view to see them on the timeline.</p>
      </div>
    );
  }

  const colWidth = ZOOM_LEVELS[zoom];
  const totalRangeMs = Math.max(1, maxDate - minDate);
  const timelineWidth = weeks.length * colWidth;
  const toPct = (date) => Math.min(100, Math.max(0, ((date - minDate) / totalRangeMs) * 100));
  const showTodayLine = TODAY >= minDate && TODAY <= maxDate;

  function toggleGroup(status) {
    setCollapsed((current) => ({ ...current, [status]: !current[status] }));
  }

  return (
    <div className="rounded-xl border border-[#E1E4EA] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1f1f5] px-5 py-3">
        <div className="flex items-center gap-1 rounded-lg bg-[#F1F1F5] p-1">
          {Object.keys(ZOOM_LEVELS).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setZoom(level)}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${zoom === level ? "bg-white text-[#C57E5B] shadow-sm" : "text-[#6b7280] hover:text-[#111827]"}`}
            >
              {level}
            </button>
          ))}
        </div>
        <p className="text-xs font-semibold text-[#6b7280]">
          {groups.reduce((sum, g) => sum + g.tasks.length, 0)} tasks across {groups.length} stages
        </p>
      </div>

      <div className="flex">
        <div className="w-56 shrink-0 border-r border-[#f1f1f5]">
          <div className="flex h-11 items-center border-b border-[#f1f1f5] bg-[#fafafa] px-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">Stage / Task</span>
          </div>
          {groups.map((group) => (
            <div key={group.status} className="border-b border-[#f1f1f5]">
              <button type="button" onClick={() => toggleGroup(group.status)} className="flex h-10 w-full items-center gap-2 bg-[#fafafa] px-3 text-left">
                <span className={`h-2 w-2 rounded-full ${STATUS_DOT[group.status]}`} />
                <span className="text-sm font-semibold text-[#111827]">{group.status}</span>
                <span className="ml-auto text-[10px] font-bold text-[#9ca3af]">{group.tasks.length}</span>
              </button>
              {!collapsed[group.status] && group.tasks.map((task) => (
                <button key={task.id || task._id} type="button" onClick={() => onOpenEdit(group.status, task)} className="flex h-10 w-full items-center px-6 text-left hover:bg-[#fafafa]">
                  <span className="truncate text-xs text-[#374151]">{task.title || task.taskName}</span>
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-x-auto">
          <div style={{ minWidth: `${timelineWidth}px` }}>
            <div className="flex h-11 border-b border-[#f1f1f5] bg-white">
              {weeks.map((week, index) => (
                <div key={index} style={{ width: `${colWidth}px` }} className="flex shrink-0 items-center justify-center border-r border-[#f1f1f5] text-[10px] font-bold uppercase text-[#9ca3af]">
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
              {groups.map((group) => (
                <div key={group.status}>
                  <div className="h-10 border-b border-[#f1f1f5] bg-[#fafafa]/60" />
                  {!collapsed[group.status] && group.tasks.map((task) => {
                    const left = toPct(task.start);
                    const width = Math.max(4, toPct(task.end) - left);
                    const isDone = group.status === "Completed";
                    return (
                      <div key={task.id || task._id} className="relative h-10 border-b border-[#f1f1f5]">
                        <button
                          type="button"
                          onClick={() => onOpenEdit(group.status, task)}
                          style={{ left: `${left}%`, width: `${width}%` }}
                          className={`absolute top-1.5 flex h-7 min-w-[90px] items-center gap-2 rounded-lg border px-2.5 text-left shadow-sm transition-all hover:brightness-105 ${
                            isDone ? "border-emerald-200 bg-emerald-100 text-emerald-800" : "border-[#C57E5B]/40 bg-[#fff1ec] text-[#884c2d]"
                          }`}
                        >
                          <span className="truncate text-[11px] font-bold">{task.title || task.taskName}</span>
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
  );
}

export default function ProjectTimeline() {
  const { companyId, projectId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { records: companies } = useCrmRecords("companies");
  const { records: projects } = useCrmRecords("projects");
  const { records: tasks, save: saveTask, remove: removeTask } = useCrmRecords("tasks");
  const [view, setView] = useState("kanban");
  const [taskEditor, setTaskEditor] = useState(null);

  const company = useMemo(() => companies.find((c) => String(c.id || c._id) === companyId), [companies, companyId]);
  const project = useMemo(
    () => projects.find((p) => String(p.id || p._id) === projectId && (String(p.companyId) === companyId || true)),
    [projects, companyId, projectId]
  );

  const projectTasks = useMemo(() => {
    if (!project) return [];
    const pid = String(project.id || project._id);
    return tasks.filter((task) => String(task.projectId) === pid || String(task.project) === pid || task.project === project.name);
  }, [tasks, project]);

  if (!company || !project) {
    return (
      <div className="rounded-xl border border-dashed border-[#E1E4EA] bg-white p-10 text-center">
        <p className="text-sm font-semibold text-[#6b7280]">We couldn't find that project for this company.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate("/admin/companies")}>Back to Companies</Button>
      </div>
    );
  }

  function handleShare() {
    navigator.clipboard?.writeText(`${window.location.origin}/admin/companies/${company.id || company._id}/projects/${project.id || project._id}/tasks`);
    showToast({ title: "Link copied", message: "Project timeline link copied to clipboard." });
  }

  function openNewTask(status = "Backlog") {
    setTaskEditor({
      mode: "create",
      status,
      task: {
        id: `task-${Date.now()}`,
        title: "",
        projectId: project.id || project._id,
        projectName: project.name,
        companyId: company.id || company._id,
        priority: "Medium",
        assignedTo: "",
        startDate: "",
        dueDate: "",
        description: "",
        comments: 0,
      },
    });
  }

  function openEditTask(status, task) {
    setTaskEditor({ mode: "edit", status, task });
  }

  async function handleSaveTask(form, status) {
    try {
      const isNew = !form._id;
      await saveTask({ ...form, status, projectId: project.id || project._id, projectName: project.name, companyId: company.id || company._id });
      setTaskEditor(null);
      showToast({ title: isNew ? "Task created" : "Task updated", message: `${form.title || "Task"} saved in ${status}.` });
    } catch (error) {
      showToast({ type: "error", title: "Could not save task", message: error.message });
    }
  }

  async function handleDeleteTask(task) {
    await removeTask(task);
    setTaskEditor(null);
    showToast({ title: "Task deleted", message: `${task.title || "Task"} removed.` });
  }

  async function handleDragEnd(columns, result) {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) {
      reorder(columns[source.droppableId], source.index, destination.index);
      return;
    }
    const movedTask = columns[source.droppableId][source.index];
    move(columns[source.droppableId], columns[destination.droppableId], source, destination);
    await saveTask({ ...movedTask, status: destination.droppableId });
  }

  return (
    <div className="space-y-6">
      <ProjectHeader
        company={company}
        project={project}
        activeTab="Timeline"
        onShare={handleShare}
        onNewTask={() => openNewTask()}
      />

      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#111827]">Project Timeline</h3>
        <div className="flex items-center gap-1 rounded-lg bg-[#F1F1F5] p-1">
          <button
            onClick={() => setView("kanban")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${view === "kanban" ? "bg-white text-[#C57E5B] shadow-sm" : "text-[#6b7280] hover:text-[#111827]"}`}
          >
            <Columns3 size={13} /> Kanban
          </button>
          <button
            onClick={() => setView("gantt")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${view === "gantt" ? "bg-white text-[#C57E5B] shadow-sm" : "text-[#6b7280] hover:text-[#111827]"}`}
          >
            <CalendarRange size={13} /> Gantt
          </button>
        </div>
      </div>

      {view === "kanban" ? (
        <KanbanView tasks={projectTasks} onDragEnd={handleDragEnd} onOpenNew={openNewTask} onOpenEdit={openEditTask} />
      ) : (
        <GanttView tasks={projectTasks} onOpenEdit={openEditTask} />
      )}

      {taskEditor && (
        <TaskEditorModal
          statuses={TASK_STATUSES}
          initialStatus={taskEditor.status}
          task={taskEditor.task}
          mode={taskEditor.mode}
          onClose={() => setTaskEditor(null)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}
