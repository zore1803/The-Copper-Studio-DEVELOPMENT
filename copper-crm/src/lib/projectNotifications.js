import { sendBrowserNotification } from "./browserNotifications";

const SEEN_KEY = "cs_notified_stage_events";
const DEADLINE_WARNING_DAYS = 3;

function loadSeen() {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveSeen(seen) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  } catch {
    // ignore (private browsing / storage full)
  }
}

// Compares the previously-cached project list against a freshly-fetched one
// and fires a browser notification for anything the client would want to
// know about in real time: a new roadmap stage, a stage starting/finishing,
// or a stage deadline coming up within a few days. Called from
// ClientProjectContext right after every revalidation.
export function checkProjectNotifications(prevProjects, nextProjects, enabled) {
  if (!enabled || !Array.isArray(prevProjects) || !Array.isArray(nextProjects)) return;

  const seen = loadSeen();
  let seenChanged = false;
  const prevById = new Map(prevProjects.map((p) => [String(p._id || p.id), p]));

  for (const project of nextProjects) {
    const projectId = String(project._id || project.id);
    const projectName = project.name || "Your project";
    const prevProject = prevById.get(projectId);
    const stages = Array.isArray(project.stages) ? project.stages : [];
    const prevStages = Array.isArray(prevProject?.stages) ? prevProject.stages : [];
    const prevStageByKey = new Map(prevStages.map((s, i) => [String(s._id || i), s]));

    stages.forEach((stage, index) => {
      const stageKey = String(stage._id || index);
      const prevStage = prevStageByKey.get(stageKey);
      const eventId = `${projectId}:${stageKey}`;

      // A brand-new stage — but only once we've already seen this project
      // before (an initial load with a full roadmap shouldn't spam "new
      // stage" for every stage that's simply new to the client's session).
      if (prevProject && !prevStage) {
        sendBrowserNotification(`New phase added — ${project.name}`, {
          body: `"${stage.name}" was added to the roadmap.`,
          tag: `stage-created-${eventId}`,
        });
      } else if (prevStage && prevStage.status !== stage.status) {
        if (stage.status === "in_progress") {
          sendBrowserNotification(`Phase started — ${projectName}`, {
            body: `"${stage.name}" is now in progress.`,
            tag: `stage-status-${eventId}`,
          });
        } else if (stage.status === "completed") {
          sendBrowserNotification(`Phase completed — ${projectName}`, {
            body: `"${stage.name}" has been marked complete.`,
            tag: `stage-status-${eventId}`,
          });
        }
      }

      // Deadline approaching — checked once per stage (not diffed against the
      // previous snapshot, since a due date doesn't itself "change" as it
      // approaches) and deduped via a persisted ledger so it only fires once.
      if (stage.endDate && stage.status !== "completed") {
        const end = new Date(stage.endDate);
        if (!Number.isNaN(end.getTime())) {
          const daysLeft = (end.getTime() - Date.now()) / 86_400_000;
          const deadlineKey = `deadline:${eventId}`;
          if (daysLeft >= 0 && daysLeft <= DEADLINE_WARNING_DAYS && !seen[deadlineKey]) {
            sendBrowserNotification(`Deadline approaching — ${projectName}`, {
              body: `"${stage.name}" is due in ${Math.max(1, Math.ceil(daysLeft))} day${daysLeft <= 1 ? "" : "s"}.`,
              tag: `stage-deadline-${eventId}`,
            });
            seen[deadlineKey] = true;
            seenChanged = true;
          }
        }
      }
    });
  }

  if (seenChanged) saveSeen(seen);
}
