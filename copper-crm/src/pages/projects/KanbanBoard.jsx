import { useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Plus, MoreHorizontal, Calendar, MessageSquare, CheckSquare,
  Edit3, GripVertical, ListFilter, Save, Sparkles, Trash2
} from "lucide-react";
import { Button } from "../../components/ui";
import { kanbanTasks as initialTasks } from "../../data/mockData";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";

const colConfig = {
  "Backlog": { dot: "bg-gray-400", ring: "ring-gray-200", header: "bg-gray-50" },
  "Requirement Gathering": { dot: "bg-blue-500", ring: "ring-blue-100", header: "bg-blue-50" },
  "Design": { dot: "bg-violet-500", ring: "ring-violet-100", header: "bg-violet-50" },
  "Development": { dot: "bg-amber-500", ring: "ring-amber-100", header: "bg-amber-50" },
  "Testing": { dot: "bg-yellow-500", ring: "ring-yellow-100", header: "bg-yellow-50" },
  "Review": { dot: "bg-indigo-500", ring: "ring-indigo-100", header: "bg-indigo-50" },
  "Completed": { dot: "bg-emerald-500", ring: "ring-emerald-100", header: "bg-emerald-50" },
};

const priorityConfig = {
  High: "bg-red-50 text-red-600 border-red-100",
  Medium: "bg-amber-50 text-amber-700 border-amber-100",
  Low: "bg-gray-50 text-gray-500 border-gray-200",
};

const assigneeColor = ["bg-[#2563EB]", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
function assigneeIdx(letter) { return letter.charCodeAt(0) % assigneeColor.length; }

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

export default function KanbanBoard() {
  const [columns, setColumns] = useState(initialTasks);
  const [activeTaskId, setActiveTaskId] = useState("");
  const [taskEditor, setTaskEditor] = useState(null);
  const { showToast } = useToast();
  const fallbackTasks = useMemo(
    () => Object.entries(initialTasks).flatMap(([status, tasks]) => tasks.map((task) => ({ ...task, status }))),
    []
  );
  const { records: dbTasks, save: saveDbTask, remove: removeDbTask } = useCrmRecords("tasks", fallbackTasks);

  useEffect(() => {
    const nextColumns = Object.fromEntries(Object.keys(initialTasks).map((key) => [key, []]));
    dbTasks.forEach((task) => {
      const status = nextColumns[task.status] ? task.status : "Backlog";
      nextColumns[status].push(task);
    });
    queueMicrotask(() => setColumns(nextColumns));
  }, [dbTasks]);

  const totals = useMemo(() => {
    const tasks = Object.values(columns).flat();
    return {
      total: tasks.length,
      done: columns.Completed?.length || 0,
      high: tasks.filter((task) => task.priority === "High").length,
    };
  }, [columns]);

  function onDragStart(start) {
    setActiveTaskId(start.draggableId);
  }

  async function onDragEnd(result) {
    setActiveTaskId("");
    const { source, destination } = result;
    if (!destination) return;

    if (source.droppableId === destination.droppableId) {
      const reordered = reorder(columns[source.droppableId], source.index, destination.index);
      setColumns({ ...columns, [source.droppableId]: reordered });
      return;
    }

    const movedTask = columns[source.droppableId][source.index];
    setColumns({
      ...columns,
      ...move(columns[source.droppableId], columns[destination.droppableId], source, destination),
    });
    await saveDbTask({ ...movedTask, status: destination.droppableId });
  }

  function openNewTask(column = "Backlog") {
    setTaskEditor({
      mode: "create",
      column,
      task: {
        id: `t-${Date.now()}`,
        title: "",
        project: "",
        priority: "Medium",
        assignee: "A",
        deadline: "",
        description: "",
        subtasks: 0,
        comments: 0,
      },
    });
  }

  function openEditTask(column, task) {
    setTaskEditor({ mode: "edit", column, task });
  }

  async function saveTask(nextTask, nextColumn) {
    try {
      const isNew = !nextTask._id;
      const savedTask = await saveDbTask({ ...nextTask, status: nextColumn });
      setColumns((current) => {
        const cleaned = Object.fromEntries(
          Object.entries(current).map(([column, tasks]) => [
            column,
            tasks.filter((task) => task.id !== nextTask.id && task._id !== nextTask._id),
          ])
        );
        return {
          ...cleaned,
          [nextColumn]: [...(cleaned[nextColumn] || []), savedTask],
        };
      });
      setTaskEditor(null);
      showToast({
        title: isNew ? "Task created" : "Task updated",
        message: `${nextTask.title || "Task"} saved in ${nextColumn}.`,
      });
    } catch (error) {
      showToast({ type: "error", title: "Could not save task", message: error.message });
    }
  }

  async function deleteTask(task) {
    try {
      await removeDbTask(task);
      setColumns((current) => Object.fromEntries(
        Object.entries(current).map(([column, tasks]) => [
          column,
          tasks.filter((item) => item.id !== task.id && item._id !== task._id),
        ])
      ));
      setTaskEditor(null);
      showToast({ title: "Task deleted", message: `${task.title || "Task"} removed successfully.` });
    } catch (error) {
      showToast({ type: "error", title: "Could not delete task", message: error.message });
    }
  }

  return (
    <div className="flex h-full flex-col p-5 xl:p-6">
      <div className="mb-5 flex shrink-0 flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">Delivery pipeline</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">Kanban Board</h1>
          <p className="mt-1 text-sm text-gray-500">
            {totals.done}/{totals.total} completed - {totals.high} high priority tasks need attention
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-600 hover:bg-gray-50">
            <ListFilter size={14} />
            Filter
          </button>
          <div className="hidden sm:inline-flex h-10 items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 text-xs font-bold text-blue-700">
            <Sparkles size={14} />
            Drag tasks between stages
          </div>
          <Button className="h-10" onClick={() => openNewTask()}><Plus size={14} strokeWidth={2.5} /> Add Task</Button>
        </div>
      </div>

      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4" style={{ minHeight: 0 }}>
          {Object.entries(columns).map(([col, tasks]) => {
            const cfg = colConfig[col] || colConfig.Backlog;
            return (
              <section key={col} className="flex w-[270px] shrink-0 flex-col rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-100/70">
                <div className={`rounded-t-2xl border-b border-gray-100 px-3.5 py-3 ${cfg.header}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${cfg.dot}`} />
                      <h2 className="truncate text-sm font-bold text-gray-900">{col}</h2>
                      <span className="rounded-md bg-white/80 px-1.5 py-0.5 text-[11px] font-bold text-gray-500">{tasks.length}</span>
                    </div>
                    <button onClick={() => openNewTask(col)} className="grid h-7 w-7 place-items-center rounded-lg text-gray-400 hover:bg-white hover:text-gray-700">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <Droppable droppableId={col}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 overflow-y-auto p-2.5 transition-all duration-200 ${
                        snapshot.isDraggingOver
                          ? `bg-blue-50/70 ring-2 ring-inset ring-blue-200`
                          : "bg-white"
                      }`}
                      style={{ minHeight: 180 }}
                    >
                      <div className="space-y-2.5">
                        {tasks.map((task, index) => {
                          const isDone = col === "Completed";
                          const priority = priorityConfig[task.priority] || priorityConfig.Low;
                          return (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(prov, snap) => (
                                <article
                                  ref={prov.innerRef}
                                  {...prov.draggableProps}
                                  {...prov.dragHandleProps}
                                  className={`group/card cursor-grab rounded-xl border bg-white shadow-sm transition-[box-shadow,transform,border-color] duration-200 active:cursor-grabbing ${
                                    snap.isDragging
                                      ? "border-blue-200 shadow-2xl shadow-blue-950/10"
                                      : activeTaskId
                                        ? "border-gray-200"
                                        : "border-gray-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
                                  } ${isDone ? "opacity-80" : ""}`}
                                  style={{
                                    ...prov.draggableProps.style,
                                    transition: snap.isDropAnimating
                                      ? "transform 180ms cubic-bezier(.2,1,.2,1)"
                                      : prov.draggableProps.style?.transition,
                                  }}
                                >
                                  <div className={`p-3 ${snap.isDragging ? "kanban-card-lift" : ""}`}>
                                    <div className="mb-2.5 flex items-start gap-2">
                                      <button
                                        type="button"
                                        className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md text-gray-300 group-hover/card:bg-gray-50 group-hover/card:text-gray-500"
                                        aria-label={`Drag ${task.title}`}
                                      >
                                        <GripVertical size={12} />
                                      </button>
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-[10px] font-bold uppercase tracking-wide text-gray-400">{task.project}</p>
                                        <h3 className={`mt-0.5 text-[13px] font-bold leading-snug ${isDone ? "text-gray-400 line-through" : "text-gray-900"}`}>
                                          {task.title}
                                        </h3>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          openEditTask(col, task);
                                        }}
                                        className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-gray-300 opacity-0 hover:bg-gray-50 hover:text-gray-500 group-hover/card:opacity-100"
                                        title="Edit task"
                                      >
                                        <MoreHorizontal size={12} />
                                      </button>
                                    </div>

                                    <p className="mb-2.5 line-clamp-2 text-[11px] leading-4 text-gray-500">{task.description}</p>

                                    <div className="mb-2.5 flex items-center justify-between gap-2">
                                      <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${priority}`}>{task.priority}</span>
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400">
                                        <Calendar size={11} />
                                        {task.deadline}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-gray-100 pt-2.5">
                                      <div className="flex items-center gap-2.5 text-[10px] font-bold text-gray-400">
                                        <span className="inline-flex items-center gap-1">
                                          <CheckSquare size={11} />
                                          {task.subtasks}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                          <MessageSquare size={11} />
                                          {task.comments}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            openEditTask(col, task);
                                          }}
                                          className="grid h-6 w-6 place-items-center rounded-full text-gray-300 hover:bg-blue-50 hover:text-[#2563EB]"
                                          title="Edit task"
                                        >
                                          <Edit3 size={11} />
                                        </button>
                                        <div className={`grid h-6 w-6 place-items-center rounded-full text-[9px] font-bold text-white ${assigneeColor[assigneeIdx(task.assignee)]}`}>
                                          {task.assignee}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </article>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>

                      {tasks.length === 0 && (
                        <div className="grid h-28 place-items-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-xs font-bold text-gray-400">
                          Drop tasks here
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </section>
            );
          })}
        </div>
      </DragDropContext>
      {taskEditor && (
        <TaskEditorModal
          columns={Object.keys(columns)}
          initialColumn={taskEditor.column}
          task={taskEditor.task}
          mode={taskEditor.mode}
          onClose={() => setTaskEditor(null)}
          onSave={saveTask}
          onDelete={deleteTask}
        />
      )}
    </div>
  );
}

function TaskEditorModal({ columns, initialColumn, task, mode, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(task);
  const [column, setColumn] = useState(initialColumn);
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  function submit(event) {
    event.preventDefault();
    onSave(
      {
        ...form,
        title: form.title.trim() || "Untitled task",
        project: form.project.trim() || "General",
        assignee: (form.assignee || "A").slice(0, 1).toUpperCase(),
        subtasks: Number(form.subtasks) || 0,
        comments: Number(form.comments) || 0,
      },
      column
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-gray-950/35 px-4">
      <form onSubmit={submit} className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-gray-950">{mode === "create" ? "Create task" : "Edit task"}</h2>
            <p className="text-xs text-gray-400">Update task details, owner, priority, and workflow stage.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-xs font-bold text-gray-500 hover:bg-gray-100">Close</button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <TaskField label="Task title" value={form.title} onChange={set("title")} className="sm:col-span-2" />
          <TaskField label="Project" value={form.project} onChange={set("project")} />
          <label className="block">
            <span className="text-xs font-bold text-gray-600">Stage</span>
            <select value={column} onChange={(event) => setColumn(event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50">
              {columns.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-bold text-gray-600">Priority</span>
            <select value={form.priority} onChange={(event) => set("priority")(event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50">
              {["High", "Medium", "Low"].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <TaskField label="Assignee initial" value={form.assignee} onChange={set("assignee")} />
          <TaskField label="Deadline" value={form.deadline} onChange={set("deadline")} placeholder="26 Jun" />
          <TaskField label="Subtasks" type="number" value={form.subtasks} onChange={set("subtasks")} />
          <TaskField label="Comments" type="number" value={form.comments} onChange={set("comments")} />
          <label className="block sm:col-span-2">
            <span className="text-xs font-bold text-gray-600">Description</span>
            <textarea value={form.description} onChange={(event) => set("description")(event.target.value)} className="mt-1.5 min-h-24 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
          </label>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 p-4">
          {mode === "edit" ? (
            <button type="button" onClick={() => onDelete(task)} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">
              <Trash2 size={14} />
              Delete
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit"><Save size={14} /> Save task</Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function TaskField({ label, value, onChange, placeholder = "", type = "text", className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-bold text-gray-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
      />
    </label>
  );
}
