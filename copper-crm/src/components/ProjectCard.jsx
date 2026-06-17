import { Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, Badge } from "./ui";

const statusColor = {
  "Requirement Gathering": "gray",
  Design: "purple",
  Development: "orange",
  "In Progress": "teal",
  Review: "blue",
  Completed: "green",
};

export default function ProjectCard({ project, showClient = true }) {
  const projectId = project.id || project._id;
  const team = Array.isArray(project.team) ? project.team : [];
  const progress = Number(project.progress) || 0;
  const status = project.currentPhase || project.status || "Not Started";

  return (
    <Link
      to={`/admin/companies/${project.companyId}/projects/${projectId}`}
      className="block rounded-xl border border-[#e5e7eb] bg-white p-5 transition-all hover:border-[#c6aa9b] hover:shadow-sm"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#111827]">{project.name || "Untitled project"}</p>
          {showClient && <p className="mt-0.5 text-xs text-[#6c6355]">{project.client}</p>}
        </div>
        <Badge color={statusColor[status] || "gray"}>{status}</Badge>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex justify-between text-[11px] text-[#6c6355]">
          <span>Progress</span>
          <span className="font-bold text-[#211a17]">{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#ede0db]">
          <div className="h-full rounded-full bg-[#884c2d]" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex -space-x-1.5">
          {team.slice(0, 4).map((member, index) => (
            <div key={index} className="rounded-full ring-2 ring-[#fff8f6]">
              <Avatar name={member} size="sm" />
            </div>
          ))}
          {!team.length && <span className="text-[11px] text-[#9ca3af]">No team assigned</span>}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-[#6c6355]">
          <Calendar size={11} />
          {project.dueDate || project.expectedEndDate || "No due date"}
        </div>
      </div>
    </Link>
  );
}
