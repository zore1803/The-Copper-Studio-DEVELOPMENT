// Canonical Kanban columns, shared by the delivery board (KanbanBoard) and the
// admin workflows board (AdminWorkflows). Keep this list as the single source of
// truth so both boards — which read/write the same `tasks` collection — stay in sync.
export const TASK_STATUSES = ["To Do", "In Progress", "Review", "Done"];

// Map any incoming status (legacy task strings like "Backlog"/"Completed"/"Blocked",
// or a project stage status like "not_started"/"in_progress"/"completed") onto one
// of the canonical columns above. Anything unrecognised falls back to "To Do".
export function normalizeTaskStatus(status) {
  const s = String(status || "").trim().toLowerCase();
  if (s === "in progress" || s === "in_progress") return "In Progress";
  if (s === "review") return "Review";
  if (s === "done" || s === "completed" || s === "complete") return "Done";
  return "To Do"; // backlog, to do, not_started, blocked, "" → To Do
}

// Reverse mapping: a column name back to the status we persist on a project stage.
export const COLUMN_TO_STAGE_STATUS = {
  "To Do": "not_started",
  "In Progress": "in_progress",
  "Review": "review",
  "Done": "completed",
};
