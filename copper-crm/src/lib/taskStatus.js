// Canonical Kanban columns for the delivery board.
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

// Reverse mapping for plain tasks: keep "Completed" (not "Done") in storage so the
// client-facing Gantt views (ProjectTimeline.jsx, ClientPages.jsx), which still key
// off the older 6-status vocabulary, keep counting finished tasks correctly.
export const COLUMN_TO_TASK_STATUS = {
  "To Do": "To Do",
  "In Progress": "In Progress",
  "Review": "Review",
  "Done": "Completed",
};
