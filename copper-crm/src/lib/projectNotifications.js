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
// and reports anything the client would want to know about in real time: a
// new roadmap stage, a stage starting/finishing, or a stage deadline coming
// up within a few days. Called from ClientProjectContext right after every
// revalidation.
//
// `notify(title, message)` always fires — this is what feeds the in-app
// notification bell (ClientLayout), independent of the OS-level browser
// permission. `browserEnabled` additionally fires a native OS notification
// on top of that, only when the client has granted permission for it.
export function checkProjectNotifications(prevProjects, nextProjects, browserEnabled, notify) {
  if (!Array.isArray(prevProjects) || !Array.isArray(nextProjects)) return;

  const seen = loadSeen();
  let seenChanged = false;
  const prevById = new Map(prevProjects.map((p) => [String(p._id || p.id), p]));

  function fire(title, body, tag) {
    if (notify) notify(title, body);
    if (browserEnabled) sendBrowserNotification(title, { body, tag });
  }

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
        fire(`New phase added — ${project.name}`, `"${stage.name}" was added to the roadmap.`, `stage-created-${eventId}`);
      } else if (prevStage && prevStage.status !== stage.status) {
        if (stage.status === "in_progress") {
          fire(`Phase started — ${projectName}`, `"${stage.name}" is now in progress.`, `stage-status-${eventId}`);
        } else if (stage.status === "review") {
          fire(`Phase in review — ${projectName}`, `"${stage.name}" is now in review.`, `stage-status-${eventId}`);
        } else if (stage.status === "completed") {
          fire(`Phase completed — ${projectName}`, `"${stage.name}" has been marked complete.`, `stage-status-${eventId}`);
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
            fire(
              `Deadline approaching — ${projectName}`,
              `"${stage.name}" is due in ${Math.max(1, Math.ceil(daysLeft))} day${daysLeft <= 1 ? "" : "s"}.`,
              `stage-deadline-${eventId}`
            );
            seen[deadlineKey] = true;
            seenChanged = true;
          }
        }
      }
    });
  }

  if (seenChanged) saveSeen(seen);
}

// Same idea as checkProjectNotifications, but for the client's meetings list —
// a request getting confirmed/cancelled, or the admin booking a new meeting on
// the client's behalf. Called from ClientLayout right after every revalidation.
export function checkMeetingNotifications(prevMeetings, nextMeetings, browserEnabled, notify) {
  if (!Array.isArray(prevMeetings) || !Array.isArray(nextMeetings)) return;

  const hadAny = prevMeetings.length > 0;
  const prevById = new Map(prevMeetings.map((m) => [String(m._id || m.id), m]));

  function fire(title, body, tag) {
    if (notify) notify(title, body);
    if (browserEnabled) sendBrowserNotification(title, { body, tag });
  }

  for (const meeting of nextMeetings) {
    const meetingId = String(meeting._id || meeting.id);
    const prevMeeting = prevById.get(meetingId);
    const title = meeting.title || "Meeting";

    // Skip "new meeting" noise on the very first load (empty cache) — only
    // flag genuinely new meetings once we've already seen this client's list.
    if (hadAny && !prevMeeting) {
      fire(`New meeting scheduled — ${title}`, meeting.scheduledAt ? `Set for ${new Date(meeting.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}.` : "Details to be confirmed.", `meeting-new-${meetingId}`);
    } else if (prevMeeting && prevMeeting.status !== meeting.status) {
      if (meeting.status === "confirmed") {
        fire(`Meeting confirmed — ${title}`, meeting.scheduledAt ? `${new Date(meeting.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}.` : "", `meeting-status-${meetingId}`);
      } else if (meeting.status === "cancelled") {
        fire(`Meeting cancelled — ${title}`, "This meeting was cancelled.", `meeting-status-${meetingId}`);
      } else if (meeting.status === "completed") {
        fire(`Meeting completed — ${title}`, "This meeting has concluded.", `meeting-status-${meetingId}`);
      }
    }
  }
}
