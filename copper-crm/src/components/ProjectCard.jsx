import { Calendar, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, Badge } from "./ui";
import { today, parseFullDate, daysBetween } from "../lib/dates";

const statusColor = {
  "Requirement Gathering": "gray",
  Design: "purple",
  Development: "orange",
  "In Progress": "teal",
  Review: "blue",
  Completed: "green",
};

function dueMeta(project) {
  const raw = project.dueDate || project.expectedEndDate;
  if (!raw) return { label: "No due date", tone: "text-[#9b8c83]" };
  const due = parseFullDate(raw);
  if (Number.isNaN(due.getTime())) return { label: String(raw), tone: "text-[#6c6355]" };
  const isDone = String(project.status || project.clientStatus || "").toLowerCase() === "completed";
  const left = daysBetween(today(), due);
  const label = due.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (isDone) return { label, tone: "text-emerald-600", note: "Done" };
  if (left < 0) return { label, tone: "text-red-600", note: `${Math.abs(left)}d overdue` };
  if (left <= 7) return { label, tone: "text-amber-600", note: `${left}d left` };
  return { label, tone: "text-[#6c6355]", note: `${left}d left` };
}

export default function ProjectCard({ project, showClient = true }) {
  const projectId = project.id || project._id;
  const team = Array.isArray(project.team) ? project.team : Array.isArray(project.assignedTeam) ? project.assignedTeam : [];
  const progress = Number(project.progress) || 0;
  const status = project.currentPhase || project.status || "Not Started";
  const isDone = String(status).toLowerCase() === "completed";
  const due = dueMeta(project);

  return (
    <Link
      to={`/admin/companies/${project.companyId}/projects/${projectId}`}
      className="group block rounded-xl border border-[#ead9d0] bg-white p-5 transition-all hover:border-[#c98a63] hover:shadow-md hover:shadow-[#884c2d]/5"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#2b211c] group-hover:text-[#884c2d]">{project.name || "Untitled project"}</p>
          {showClient && <p className="mt-0.5 truncate text-xs text-[#6c6355]">{project.client || "Unassigned client"}</p>}
        </div>
        <Badge color={statusColor[status] || "gray"}>{status}</Badge>
      </div>

      <div className="mb-4">
        <div className="mb-1.5 flex justify-between text-[11px] text-[#6c6355]">
          <span>Progress</span>
          <span className="font-bold text-[#2b211c]">{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#f1e7e1]">
          <div className={`h-full rounded-full ${isDone ? "bg-emerald-500" : "bg-[#884c2d]"}`} style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#f3e9e4] pt-3">
        <div className="flex items-center">
          {team.length ? (
            <div className="flex -space-x-1.5">
              {team.slice(0, 4).map((member, index) => (
                <div key={index} className="rounded-full ring-2 ring-white">
                  <Avatar name={member} size="sm" />
                </div>
              ))}
              {team.length > 4 && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1e7e1] text-[10px] font-bold text-[#884c2d] ring-2 ring-white">+{team.length - 4}</div>
              )}
            </div>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-[#9b8c83]"><Users size={11} /> No team</span>
          )}
        </div>
        <div className={`flex items-center gap-1 text-[11px] font-semibold ${due.tone}`}>
          <Calendar size={11} />
          {due.note ? <span>{due.note}</span> : <span>{due.label}</span>}
        </div>
      </div>
    </Link>
  );
}
