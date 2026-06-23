// Shared roll-up logic for a project's stages. Used by both the roadmap
// (ProjectDetail) and the Kanban/Gantt board (ProjectTimeline) so that editing
// stages in either place keeps the project's progress, phase and status in sync.

export function roadmapProgress(stages = []) {
  if (!stages.length) return 0;
  const completed = stages.filter((stage) => stage?.status === "completed").length;
  return Math.round((completed / stages.length) * 100);
}

export function isRoadmapComplete(stages = []) {
  return stages.length > 0 && stages.every((stage) => stage?.status === "completed");
}

// The stage the project is currently "on": the first in-progress stage, else the
// first stage in review, else the first stage that isn't finished.
export function nextPhaseForStages(stages = []) {
  if (isRoadmapComplete(stages)) return "Completed";
  const active =
    stages.find((stage) => stage?.status === "in_progress") ||
    stages.find((stage) => stage?.status === "review") ||
    stages.find((stage) => stage?.status !== "completed");
  return active?.name || "Not Started";
}

// Returns the project fields to patch whenever its stages change, so progress,
// phase and (on completion) status follow the stages automatically.
export function projectRollup(project, stages) {
  const complete = isRoadmapComplete(stages);
  const phase = complete ? "Completed" : nextPhaseForStages(stages);
  // Always drive status/phase from the stages so a project can never be left flagged
  // "Completed" once a stage is reopened or an unfinished stage is added.
  const patch = {
    stages,
    progress: roadmapProgress(stages),
    currentPhase: phase,
    status: phase,
  };
  if (complete) {
    patch.clientStatus = "completed";
  } else if (project.clientStatus === "completed") {
    // Re-opened: a project that was marked done but now has unfinished stages.
    patch.clientStatus = "in_progress";
  }
  return { ...project, ...patch };
}
