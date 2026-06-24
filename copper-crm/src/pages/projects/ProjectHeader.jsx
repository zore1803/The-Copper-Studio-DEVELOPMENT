import { Link } from "react-router-dom";
import { FolderKanban, Plus, Share2, Calendar, Clock3, AlertCircle } from "lucide-react";
import { Badge, Button, Avatar } from "../../components/ui";
import { isRoadmapComplete } from "../../lib/stageProgress";

const statusColor = {
  "Requirement Gathering": "gray",
  Design: "purple",
  Development: "orange",
  "In Progress": "teal",
  Review: "blue",
  Completed: "green",
};

// Derive the project's status from its actual stages so the badge can never get
// stuck on a stale stored "Completed". Falls back to the stored status only when
// the project has no stages at all.
function liveProjectStatus(project) {
  const stages = Array.isArray(project.stages) ? project.stages : [];
  if (!stages.length) return project.status || "Requirement Gathering";
  if (isRoadmapComplete(stages)) return "Completed";
  const anyStarted = stages.some((s) => s?.status && s.status !== "not_started");
  return anyStarted ? "In Progress" : "Requirement Gathering";
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

export default function ProjectHeader({ company, project, activeTab, onShare, onNewTask, onAction, actionLabel, actionIcon: ActionIcon = Plus }) {
  const pill = priorityPill[project.priority] || priorityPill["on-track"];
  const tabs = tabsFor(company, project);
  const team = project.team || project.assignedTeam || [];
  const liveStatus = liveProjectStatus(project);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E1E4EA] bg-white shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
      <div className="px-6 py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#E1E4EA] bg-[#fff1ec]">
              <FolderKanban size={24} className="text-[#884c2d]" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-bold text-[#0E121B]">{project.name}</h2>
              <p className="mt-0.5 text-sm text-[#525866]">{company.name}</p>
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
            </div>
          </div>
          <div className="flex flex-wrap shrink-0 gap-3">
            <Button variant="secondary" size="lg" onClick={onShare}><Share2 size={15} /> Share Project</Button>
            <Button variant="primary" size="lg" onClick={actionLabel ? onAction : onNewTask}><ActionIcon size={15} /> {actionLabel || "New Task"}</Button>
          </div>
        </div>
      </div>

      <div className="flex gap-7 overflow-x-auto border-t border-[#f1f1f5] bg-[#FAFAFA] px-6">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            to={tab.to}
            className={`whitespace-nowrap border-b-[3px] py-3.5 text-sm font-semibold transition-colors ${
              tab.label === activeTab ? "border-[#C57E5B] text-[#C57E5B]" : "border-transparent text-[#525866] hover:text-[#111827]"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
