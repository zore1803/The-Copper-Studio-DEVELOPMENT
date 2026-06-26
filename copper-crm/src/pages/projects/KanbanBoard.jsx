import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  MoreHorizontal, Calendar, MessageSquare, CheckSquare,
  GripVertical, ListFilter, Sparkles, Search, ChevronDown
} from "lucide-react";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import { TASK_STATUSES, normalizeTaskStatus, COLUMN_TO_STAGE_STATUS } from "../../lib/taskStatus";
import { KanbanView, StageEditorModal } from "./ProjectTimeline";
import { projectRollup } from "../../lib/stageProgress";
import { today, DAY_MS } from "../../lib/dates";

const colConfig = {
  "To Do": { dot: "bg-sky-500", ring: "ring-sky-100", header: "bg-sky-50" },
  "In Progress": { dot: "bg-amber-500", ring: "ring-amber-100", header: "bg-amber-50" },
  "Review": { dot: "bg-violet-500", ring: "ring-violet-100", header: "bg-violet-50" },
  "Done": { dot: "bg-emerald-500", ring: "ring-emerald-100", header: "bg-emerald-50" },
};

const priorityConfig = {
  High: "bg-red-50 text-red-600 border-red-100",
  Medium: "bg-amber-50 text-amber-700 border-amber-100",
  Low: "bg-gray-50 text-gray-500 border-gray-200",
};

const assigneeColor = ["bg-[#2563EB]", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
function assigneeIdx(letter = "A") { return String(letter || "A").charCodeAt(0) % assigneeColor.length; }

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
  const navigate = useNavigate();
  const [columns, setColumns] = useState(() => Object.fromEntries(TASK_STATUSES.map((key) => [key, []])));
  const [activeTaskId, setActiveTaskId] = useState("");
  const { showToast } = useToast();
  const { records: projects, save: saveProject } = useCrmRecords("projects");

  const [mode, setMode] = useState("projects"); // "projects" or "stages"
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [stageEditor, setStageEditor] = useState(null);

  const selectedProject = useMemo(() => projects.find(p => String(p.id || p._id) === selectedProjectId), [projects, selectedProjectId]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    const lower = searchQuery.toLowerCase();
    return projects.filter(p => (p.name || "").toLowerCase().includes(lower));
  }, [projects, searchQuery]);

  const stageCards = useMemo(() => {
    if (!selectedProject || !Array.isArray(selectedProject.stages)) return [];
    const pid = String(selectedProject.id || selectedProject._id);
    return selectedProject.stages.map((stage, idx) => ({
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
  }, [selectedProject]);

  function openNewStage(status = "To Do") {
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
    const pStartStr = selectedProject?.startDate ? new Date(selectedProject.startDate).toISOString().slice(0, 10) : null;
    const pEndStr = (selectedProject?.expectedEndDate || selectedProject?.endDate) ? new Date(selectedProject.expectedEndDate || selectedProject.endDate).toISOString().slice(0, 10) : null;

    if (form.startDate && pStartStr && form.startDate < pStartStr) {
      return showToast({ type: "error", title: "Invalid Date", message: `Stage start date cannot be before project start (${pStartStr}).` });
    }
    if (form.dueDate && pEndStr && form.dueDate > pEndStr) {
      return showToast({ type: "error", title: "Invalid Date", message: `Stage due date cannot be after project end (${pEndStr}).` });
    }

    try {
      const stageStatus = COLUMN_TO_STAGE_STATUS[status] || "not_started";
      const stages = [...(selectedProject.stages || [])];
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
      await saveProject(projectRollup(selectedProject, stages));
      setStageEditor(null);
      showToast({ title: isNew ? "Stage created" : "Stage updated", message: `${stageData.name} saved in ${status}.` });
    } catch (error) {
      showToast({ type: "error", title: "Could not save stage", message: error.message });
    }
  }

  async function handleDeleteStage(card) {
    try {
      const stages = [...(selectedProject.stages || [])];
      if (card.stageIndex >= 0 && stages[card.stageIndex]) {
        stages.splice(card.stageIndex, 1);
        await saveProject(projectRollup(selectedProject, stages));
      }
      setStageEditor(null);
      showToast({ title: "Stage deleted", message: `${card.title || "Stage"} removed.` });
    } catch (error) {
      showToast({ type: "error", title: "Could not delete stage", message: error.message });
    }
  }

  async function handleStageDragEnd(stageColumns, result) {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const movedCard = stageColumns[source.droppableId][source.index];
    const newStageStatus = COLUMN_TO_STAGE_STATUS[destination.droppableId] || "not_started";
    try {
      const stages = [...(selectedProject.stages || [])];
      if (stages[movedCard.stageIndex]) {
        stages[movedCard.stageIndex] = {
          ...stages[movedCard.stageIndex],
          status: newStageStatus,
          completedAt: newStageStatus === "completed" ? new Date().toISOString() : null,
        };
        await saveProject(projectRollup(selectedProject, stages));
        showToast({ title: "Success", message: `Stage "${movedCard.title}" moved to ${destination.droppableId}` });
      }
    } catch (err) {
      console.error(err);
      showToast({ type: "error", title: "Error", message: "Failed to move stage" });
    }
  }

  useEffect(() => {
    const nextColumns = Object.fromEntries(TASK_STATUSES.map((key) => [key, []]));

    if (projects && projects.length > 0) {
      projects.forEach((p) => {
        const mappedStatus = normalizeTaskStatus(p.status);

        nextColumns[mappedStatus].push({
          isProject: true,
          projectId: String(p.id || p._id || "unknown"),
          companyId: p.companyId,
          id: String(p.id || p._id || "unknown"),
          title: p.name || "Unknown Project",
          project: p.clientName || p.packageName || "Unknown Client",
          status: mappedStatus,
          priority: p.priority || "Medium",
          dueDate: p.expectedEndDate || p.endDate || "",
          subtasks: Array.isArray(p.stages) ? p.stages.length : 0,
          comments: 0,
          description: p.currentPhase || p.adminNotes || "Delivery Pipeline Project",
          assignedTo: p.assignedTeam?.[0]?.name || "Unassigned"
        });
      });
    }

    queueMicrotask(() => setColumns(nextColumns));
  }, [projects]);

  const totals = useMemo(() => {
    const tasks = Object.values(columns).flat();
    return {
      total: tasks.length,
      done: columns.Done?.length || 0,
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
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    
    if (source.droppableId === destination.droppableId) {
      setColumns((prev) => ({
        ...prev,
        [source.droppableId]: reorder(prev[source.droppableId], source.index, destination.index)
      }));
      return;
    }
    
    const movedTask = columns[source.droppableId][source.index];
    
    if (movedTask.isProject) {
      const proj = projects.find(p => String(p.id || p._id) === movedTask.projectId);
      
      // Strict Validation: Prevent dragging incomplete projects to "Done"
      if (destination.droppableId === "Done" && proj && (proj.progress || 0) < 100) {
        showToast({ 
          type: "error", 
          title: "Cannot mark as Done", 
          message: "Not all project stages are completed." 
        });
        return; // Reject drop, UI bounces back
      }

      // Optimistic update
      setColumns((prev) => {
        const next = move(prev[source.droppableId], prev[destination.droppableId], source, destination);
        return { ...prev, ...next };
      });

      const newStatus = COLUMN_TO_STAGE_STATUS[destination.droppableId] || "not_started";
      if (proj) {
        const updatedProj = { ...proj, status: newStatus };
        try {
          await saveProject(updatedProj);
          showToast({ title: "Success", message: `Project "${movedTask.title}" moved to ${destination.droppableId}` });
        } catch (err) {
          console.error(err);
          showToast({ type: "error", title: "Error", message: "Failed to update project status" });
        }
      }
    } else {
      // Optimistic update for non-projects
      setColumns((prev) => {
        const next = move(prev[source.droppableId], prev[destination.droppableId], source, destination);
        return { ...prev, ...next };
      });
    }
  }



  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-4 border-b border-[#E1E4EA] bg-white px-6 py-3 lg:h-14 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:py-0">
        <div>
          <h1 className="text-base font-medium text-[#0E121B]">Kanban Board</h1>
          <p className="text-xs text-[#525866] mt-0.5">{totals.done}/{totals.total} completed · {totals.high} high priority tasks</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle buttons */}
          <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => setMode("projects")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                mode === "projects" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Projects Kanban
            </button>
            <button
              onClick={() => setMode("stages")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                mode === "stages" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Project Stages
            </button>
          </div>

          <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-600 hover:bg-gray-50">
            <ListFilter size={14} />
            Filter
          </button>
          <div className="hidden sm:inline-flex h-10 items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 text-xs font-bold text-blue-700">
            <Sparkles size={14} />
            {mode === "projects" ? "Drag projects between stages" : "Manage project stages"}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden p-5 xl:p-6">
      {mode === "stages" && (
        <div className="mb-5 relative z-10 w-full max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="Search or select a project..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </div>
          
          {isDropdownOpen && (
            <div className="absolute top-full mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-lg py-1 z-50">
              {filteredProjects.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">No projects found.</div>
              ) : (
                filteredProjects.map((p) => (
                  <button
                    key={p.id || p._id}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 font-medium text-gray-700"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSelectedProjectId(String(p.id || p._id));
                      setSearchQuery(p.name);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {p.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {mode === "projects" ? (
        <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4" style={{ minHeight: 0 }}>
          {Object.entries(columns).map(([col, tasks]) => {
            const cfg = colConfig[col] || colConfig["To Do"];
            return (
              <section key={col} className="flex w-[270px] shrink-0 flex-col rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-100/70">
                <div className={`rounded-t-2xl border-b border-gray-100 px-3.5 py-3 ${cfg.header}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${cfg.dot}`} />
                      <h2 className="truncate text-sm font-bold text-gray-900">{col}</h2>
                      <span className="rounded-md bg-white/80 px-1.5 py-0.5 text-[11px] font-bold text-gray-500">{tasks.length}</span>
                    </div>
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
                          const isDone = col === "Done";
                          const priority = priorityConfig[task.priority] || priorityConfig.Low;
                          return (
                            <Draggable key={task.id || task._id} draggableId={String(task.id || task._id)} index={index}>
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
                                        <p className="truncate text-[10px] font-bold uppercase tracking-wide text-gray-400">{task.project || "No project linked"}</p>
                                        <h3 className={`mt-0.5 text-[13px] font-bold leading-snug ${isDone ? "text-gray-400 line-through" : "text-gray-900"}`}>
                                          {task.title || task.taskName || "Untitled task"}
                                        </h3>
                                      </div>
                                      {!task.isStage && (
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            if (task.companyId && task.projectId) {
                                              navigate(`/admin/companies/${task.companyId}/projects/${task.projectId}`);
                                            }
                                          }}
                                          className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-gray-300 opacity-0 hover:bg-gray-50 hover:text-gray-500 group-hover/card:opacity-100"
                                          title="View Project"
                                        >
                                          <MoreHorizontal size={12} />
                                        </button>
                                      )}
                                    </div>

                                    <p className="mb-2.5 line-clamp-2 text-[11px] leading-4 text-gray-500">{task.description || "No description added."}</p>

                                    <div className="mb-2.5 flex items-center justify-between gap-2">
                                      <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${priority}`}>{task.priority}</span>
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400">
                                        <Calendar size={11} />
                                        {task.deadline || task.dueDate || "No due date"}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-gray-100 pt-2.5">
                                      <div className="flex items-center gap-2.5 text-[10px] font-bold text-gray-400">
                                        <span className="inline-flex items-center gap-1">
                                          <CheckSquare size={11} />
                                          {task.subtasks || 0}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                          <MessageSquare size={11} />
                                          {task.comments || 0}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        {!task.isStage ? (
                                          <div className="flex -space-x-1">
                                            <div title={task.assignedTo || task.assignee || "Unassigned"} className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow-sm ${assigneeColor[assigneeIdx(task.assignedTo || task.assignee)]}`}>
                                              {(task.assignedTo || task.assignee || "U")[0].toUpperCase()}
                                            </div>
                                          </div>
                                        ) : null}
                                        <div className="flex items-center gap-2"></div>
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
      ) : (
        selectedProject ? (
          <KanbanView stages={stageCards} onDragEnd={handleStageDragEnd} onOpenNew={openNewStage} onOpenEdit={openEditStage} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <Search className="h-8 w-8 text-gray-400 mb-3" />
            <h3 className="text-sm font-bold text-gray-900">No project selected</h3>
            <p className="mt-1 text-xs text-gray-500">Search and select a project to view its stages</p>
          </div>
        )
      )}

      {stageEditor && (
        <StageEditorModal
          statuses={TASK_STATUSES}
          initialStatus={stageEditor.status}
          stage={stageEditor.card}
          mode={stageEditor.mode}
          projectDates={{
            startDate: selectedProject?.startDate ? new Date(selectedProject.startDate).toISOString().slice(0, 10) : undefined,
            endDate: (selectedProject?.expectedEndDate || selectedProject?.endDate) ? new Date(selectedProject.expectedEndDate || selectedProject.endDate).toISOString().slice(0, 10) : undefined,
          }}
          onClose={() => setStageEditor(null)}
          onSave={(form) => handleSaveStage(form, stageEditor.status)}
          onDelete={() => handleDeleteStage(stageEditor.card)}
        />
      )}
      </div>
    </div>
  );
}
