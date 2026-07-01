import { Link } from "react-router-dom";
import { FolderKanban, Calendar, Clock3, AlertCircle, CalendarCheck, Package } from "lucide-react";
import { Badge, Button, Avatar } from "../../components/ui";
import { isRoadmapComplete } from "../../lib/stageProgress";

const statusColor = {
  "Not Started": "gray",
  "In Progress": "teal",
  Completed: "green",
};

// Derive the project's status from its actual stages so the badge can never get
// stuck on a stale stored "Completed". Falls back to the stored status only when
// the project has no stages at all.
function liveProjectStatus(project) {
  const stages = Array.isArray(project.stages) ? project.stages : [];
  if (!stages.length) return project.status || "Not Started";
  if (isRoadmapComplete(stages)) return "Completed";
  const anyStarted = stages.some((s) => s?.status && s.status !== "not_started");
  return anyStarted ? "In Progress" : "Not Started";
}

const priorityPill = {
  urgent: { label: "Urgent", color: "red", icon: AlertCircle },
  upcoming: { label: "Due Soon", color: "orange", icon: Clock3 },
  "on-track": { label: "On Time", color: "teal", icon: Calendar },
};

function tabsFor(company, project) {
  const base = `/admin/companies/${company.id || company._id}/projects/${project.id || project._id}`;
  return [
    { label: "Overview", to: base },
    { label: "Timeline", to: `${base}/tasks` },
    { label: "Files", to: `${base}/files` },
  ];
}

export default function ProjectHeader({ company, project, activeTab, actionLabel, actionIcon: ActionIcon, onAction }) {
  const pill = priorityPill[project.priority] || priorityPill["on-track"];
  const tabs = tabsFor(company, project);
  const team = project.team || project.assignedTeam || [];
  const liveStatus = liveProjectStatus(project);

  // Key project metadata shown as small chips beside the title/tags (moved here
  // from the old side "Project Metadata" box).
  const fmtDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "—");
  const startDate = project.startDate ? fmtDate(project.startDate) : "—";
  const expectedRaw = project.dueDate || project.expectedEndDate || project.expectedCompletion || project.expectedCompletionDate;
  const expectedDate = expectedRaw ? fmtDate(expectedRaw) : "—";
  const packageName = project.packagePurchased || project.packageName || "";

  return (
    <div className="border-b border-[#e5e7eb] bg-white">
      <div className="px-6 py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#e5e7eb] bg-[#fff8f6]">
              <FolderKanban size={24} className="text-[#884c2d]" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-bold text-[#111827]">{project.name}</h2>
              {project.clientProjectName && project.clientProjectName !== project.name && (
                <p className="mt-0.5 truncate text-sm text-[#6b7280]">“{project.clientProjectName}”</p>
              )}
              <p className="mt-0.5 text-sm text-[#6b7280]">{company.name}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Badge color={statusColor[liveStatus] || "gray"}>{liveStatus}</Badge>
                <Badge color={pill.color}>
                  <pill.icon size={12} className="mr-1 inline" />{pill.label}
                </Badge>
                {team.length > 0 && (
                  <div className="ml-1 flex -space-x-2">
                    {team.slice(0, 3).map((member, index) => (
                      <div key={index} className="rounded-full ring-2 ring-white">
                        <Avatar name={member} size="sm" />
                      </div>
                    ))}
                    {team.length > 3 && (
                      <div className="grid h-7 w-7 place-items-center rounded-full bg-[#525866] text-[10px] font-bold text-white ring-2 ring-white">
                        +{team.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[#6b7280]">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#884c2d]" /> Start: <span className="font-semibold text-[#111827]">{startDate}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarCheck size={13} className="text-[#884c2d]" /> Expected: <span className="font-semibold text-[#111827]">{expectedDate}</span>
                </span>
                {packageName && (
                  <span className="flex items-center gap-1.5">
                    <Package size={13} className="text-[#884c2d]" /> Package: <span className="font-semibold text-[#111827]">{packageName}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap shrink-0 gap-2">
            {onAction && (
              <Button onClick={onAction}>
                {ActionIcon && <ActionIcon size={14} />}
                {actionLabel}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto px-6 pb-5">
        <div className="inline-flex items-center gap-1 rounded-full border border-[#e5e7eb] bg-white p-1">
          {tabs.map((tab) => (
            <Link
              key={tab.label}
              to={tab.to}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                tab.label === activeTab ? "bg-[#884c2d] text-white" : "text-[#6b7280] hover:bg-[#f9fafb]"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
