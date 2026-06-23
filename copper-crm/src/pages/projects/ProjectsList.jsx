import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Clock3, FolderKanban, AlertTriangle, Plus, Search } from "lucide-react";
import { Button } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { today, parseFullDate } from "../../lib/dates";
import { buildProjectPayload } from "../../lib/projectDefaults";
import ProjectFormPanel from "../../components/ProjectFormPanel";
import { useToast } from "../../components/useToast";

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
}

function KpiChip({ label, value, icon: Icon, tone = "default" }) {
  const toneStyles = {
    default: "bg-[#fff1ec] text-[#884c2d]",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
  };
  return (
    <div className="rounded-xl border border-[#ead9d0] bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneStyles[tone]}`}>
          <Icon size={16} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-[#6c6355]">{label}</p>
          <p className="mt-0.5 truncate text-base font-bold text-[#2b211c]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, action, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#ead9d0] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#f3e9e4] bg-[#fbf3ee] px-5 py-3.5">
        <div>
          <h3 className="text-sm font-bold text-[#2b211c]">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-[#6c6355]">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-0 overflow-x-auto">{children}</div>
    </section>
  );
}

const PROJECT_STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "delayed", label: "Delayed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function ProjectsList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const { records: projects, loading, save, update } = useCrmRecords("projects");
  const { records: companies } = useCrmRecords("companies");
  const { records: contacts } = useCrmRecords("contacts");
  const { records: invoices } = useCrmRecords("invoices");
  const { save: saveTask } = useCrmRecords("tasks");

  const [statusFilter, setStatusFilter] = useState("All");

  const computedProjects = useMemo(() => {
    return projects.map((p) => {
      const stages = Array.isArray(p.stages) ? p.stages : [];
      const totalStages = stages.length;
      const completedStages = stages.filter(s => s.status === "completed").length;
      const progress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : (p.progress || 0);
      
      let currentStage = "Setup phase";
      if (totalStages > 0) {
         const active = stages.find(s => s.status === "in_progress" || s.status === "review" || s.status === "not_started");
         if (active) currentStage = active.name;
         else if (completedStages === totalStages) currentStage = "All stages completed";
      } else {
         currentStage = p.currentPhase || "No stages defined";
      }

      // Automatically determine global project status based on progress unless overridden
      let effectiveStatus = p.status || "not_started";
      if (!p.status || p.status === "Requirement Gathering") { // Override legacy statuses
        if (progress === 100) effectiveStatus = "completed";
        else if (progress > 0) effectiveStatus = "in_progress";
        else effectiveStatus = "not_started";
      }

      return { ...p, computedProgress: progress, currentStage, effectiveStatus };
    });
  }, [projects]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return computedProjects.filter((project) => {
      const matchesQuery = !query || `${project.name} ${project.client} ${project.template}`.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All" || project.effectiveStatus === statusFilter;
      return matchesQuery && matchesStatus;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [computedProjects, search, statusFilter]);

  const kpis = useMemo(() => {
    const todayDate = today();
    const completed = computedProjects.filter((p) => p.effectiveStatus === "completed").length;
    const delayed = computedProjects.filter((p) => p.effectiveStatus === "delayed").length;
    const inProgress = computedProjects.filter((p) => p.effectiveStatus === "in_progress").length;
    return { total: computedProjects.length, inProgress, completed, delayed };
  }, [computedProjects]);

  async function handleCreate(company, form) {
    const { payload, starterTasks } = buildProjectPayload(form, company);
    const created = await save(payload);
    const realProjectId = created._id || created.id;
    await Promise.all(starterTasks.map((task) => saveTask({ ...task, projectId: realProjectId })));
    setCreating(false);
    showToast({ title: "Project workspace created", message: `${created.name} now has timeline, tasks, documents, and activity.` });
    navigate(`/admin/companies/${company.id || company._id}/projects/${created.id || created._id}`);
  }

  async function updateProjectStatus(project, newStatus) {
    await update(project.id || project._id, { status: newStatus });
    showToast({ title: "Status updated", message: `${project.name} is now ${newStatus.replace("_", " ")}.` });
  }

  const statusFilters = [
    { label: "All", value: "All" },
    { label: "Not Started", value: "not_started" },
    { label: "In Progress", value: "in_progress" },
    { label: "Completed", value: "completed" },
    { label: "Delayed", value: "delayed" },
    { label: "Cancelled", value: "cancelled" }
  ];

  return (
    <div className="min-h-full bg-[#faf6f3] p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-[#2b211c]">All Projects</h2>
          <p className="mt-1 text-sm text-[#6c6355]">{filtered.length} of {projects.length} projects across every company</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-full items-center gap-2 rounded-xl border border-[#ead9d0] bg-white px-3 sm:w-72 shadow-sm">
            <Search size={14} className="text-[#9b8c83]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search projects or clients"
              className="w-full bg-transparent text-sm text-[#2b211c] outline-none placeholder:text-[#9b8c83]"
            />
          </div>
          <Button onClick={() => setCreating(true)}><Plus size={14} /> New Project</Button>
        </div>
      </div>

      {!loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiChip label="Total Projects" value={kpis.total} icon={FolderKanban} />
          <KpiChip label="In Progress" value={kpis.inProgress} icon={Clock3} tone="default" />
          <KpiChip label="Completed" value={kpis.completed} icon={CheckCircle2} tone="success" />
          <KpiChip label="Delayed" value={kpis.delayed} icon={AlertTriangle} tone={kpis.delayed ? "danger" : "default"} />
        </div>
      )}

      <Section
        title="Project Portfolio"
        subtitle="Manage all active projects and workflows."
        action={
          <div className="flex gap-1.5 overflow-x-auto">
            {statusFilters.map((item) => (
              <button
                key={item.value}
                onClick={() => setStatusFilter(item.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  statusFilter === item.value ? "bg-[#884c2d] text-white" : "bg-[#f1e7e1] text-[#6c6355] hover:bg-[#ead9d0]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        }
      >
        <table className="w-full text-left text-sm text-[#6c6355]">
          <thead className="bg-[#fbf3ee] text-xs uppercase text-[#9b8c83]">
            <tr>
              <th className="px-5 py-3 font-semibold">Project Name</th>
              <th className="px-5 py-3 font-semibold">Company</th>
              <th className="px-5 py-3 font-semibold">Template</th>
              <th className="px-5 py-3 font-semibold">Current Stage</th>
              <th className="px-5 py-3 font-semibold">Progress</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Timeline</th>
              <th className="px-5 py-3 font-semibold text-right">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f3e9e4] bg-white">
            {filtered.length > 0 ? filtered.map((project) => {
              const start = project.startDate ? new Date(project.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-";
              const deadline = (project.dueDate || project.expectedEndDate) ? new Date(project.dueDate || project.expectedEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-";
              return (
                <tr key={project.id || project._id} className="hover:bg-[#fbf3ee] transition-colors">
                  <td className="px-5 py-4">
                    <Link
                      to={`/admin/companies/${project.companyId}/projects/${project.id || project._id}`}
                      className="font-bold text-[#884c2d] hover:underline"
                    >
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-5 py-4 font-medium text-[#2b211c]">{project.client}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                      {project.template || project.packageName || "Custom"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs font-medium text-[#2b211c] truncate max-w-[150px]">{project.currentStage}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-[#f1e7e1]">
                        <div
                          className={`h-full rounded-full ${project.computedProgress === 100 ? "bg-emerald-500" : "bg-[#884c2d]"}`}
                          style={{ width: `${project.computedProgress}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-[#2b211c]">{project.computedProgress}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={project.effectiveStatus}
                      onChange={(e) => updateProjectStatus(project, e.target.value)}
                      className={`rounded-md border-0 bg-transparent py-1 pl-1 pr-6 text-xs font-semibold focus:ring-0 ${
                        project.effectiveStatus === "completed" ? "text-emerald-700" :
                        project.effectiveStatus === "delayed" ? "text-red-700" :
                        "text-[#2b211c]"
                      }`}
                    >
                      {PROJECT_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#9b8c83]">Start: <span className="text-[#2b211c] font-medium">{start}</span></span>
                      <span className="text-[#9b8c83]">Due: <span className="text-[#2b211c] font-medium">{deadline}</span></span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-[#2b211c]">
                    {formatINR(project.finalAmount || project.budget || 0)}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center">
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[#fff1ec] text-[#884c2d]">
                    <FolderKanban size={20} />
                  </div>
                  <p className="text-sm font-semibold text-[#2b211c]">{search || statusFilter !== "All" ? "No projects match your filters." : "No projects yet."}</p>
                  <p className="mt-1 text-sm text-[#6c6355]">Create a project and link it to a company to get started.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>

      {creating && (
        <ProjectFormPanel
          companies={companies}
          contacts={contacts}
          invoices={invoices}
          onClose={() => setCreating(false)}
          onSave={handleCreate}
        />
      )}
    </div>
  );
}
