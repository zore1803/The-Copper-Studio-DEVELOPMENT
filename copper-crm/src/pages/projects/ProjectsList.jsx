import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Clock3, FolderKanban, AlertTriangle, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { apiGet } from "../../lib/api";
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
    <div className="rounded-xl border border-[#e5e7eb] bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneStyles[tone]}`}>
          <Icon size={16} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-[#6b7280]">{label}</p>
          <p className="mt-0.5 truncate text-base font-bold text-[#111827]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, action, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#f3e5e0] bg-[#fff1ec] px-5 py-3.5">
        <div>
          <h3 className="text-sm font-bold text-[#111827]">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-[#6b7280]">{subtitle}</p>}
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
  const location = useLocation();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(() => Boolean(location.state?.openCreate));
  // When returning from "New company", reopen the form with that company preselected.
  const [preselectCompanyId] = useState(() => location.state?.newCompanyId || "");
  const { records: projects, loading, save, update, remove } = useCrmRecords("projects");
  const { records: companies } = useCrmRecords("companies");
  const { records: contacts } = useCrmRecords("contacts");
  const { records: invoices } = useCrmRecords("invoices");
  const { save: saveTask } = useCrmRecords("tasks");

  useEffect(() => {
    if (location.state?.openCreate) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      // When stages exist, completion is driven by the stages (all done = completed),
      // never by a possibly-stale stored status. Only fall back to the stored status
      // for projects that have no stages defined at all.
      let effectiveStatus;
      if (totalStages > 0) {
        if (progress === 100) effectiveStatus = "completed";
        else if (progress > 0) effectiveStatus = "in_progress";
        else effectiveStatus = "not_started";
      } else {
        effectiveStatus = p.status || "not_started";
      }

      const company = companies.find(c => c.id === p.companyId || c._id === p.companyId);
      const companyName = company ? company.name || company.companyName : p.clientCompany || p.company || p.client || "-";

      return { ...p, computedProgress: progress, currentStage, effectiveStatus, computedCompanyName: companyName };
    });
  }, [projects, companies]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return computedProjects.filter((project) => {
      const matchesQuery = !query || `${project.name} ${project.client} ${project.template}`.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All" || project.effectiveStatus === statusFilter;
      return matchesQuery && matchesStatus;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [computedProjects, search, statusFilter]);

  const kpis = useMemo(() => {
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
    // A project linked to a company with a value is a "standalone" project: the
    // backend mints an invoice for it on the next invoices fetch
    // (syncStandaloneProjectInvoices). Fetching here generates it immediately so
    // the invoice exists by the time the admin lands on the project.
    let invoiced = false;
    if (company && Number(form.finalAmount || form.budget) > 0) {
      invoiced = await apiGet("/api/crm/invoices").then(() => true).catch(() => false);
    }
    setCreating(false);
    showToast({
      title: "Project workspace created",
      message: invoiced
        ? `${created.name} is linked to ${company.name} and an invoice has been generated.`
        : `${created.name} now has timeline, tasks, documents, and activity.`,
    });
    navigate(`/admin/companies/${company.id || company._id}/projects/${created.id || created._id}`);
  }

  async function updateProjectStatus(project, newStatus) {
    await update(project.id || project._id, { status: newStatus });
    showToast({ title: "Status updated", message: `${project.name} is now ${newStatus.replace("_", " ")}.` });
  }

  async function handleDeleteProject(project) {
    if (!window.confirm(`Delete "${project.name || "this project"}"? This cannot be undone.`)) return;
    await remove(project);
    showToast({ title: "Project deleted", message: `${project.name || "Project"} removed.` });
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
    <div className="flex flex-col min-h-full bg-[#F1F1F5]">
      <div className="flex flex-col gap-4 border-b border-[#E1E4EA] bg-white px-6 py-3 lg:h-14 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:py-0">
        <div>
          <h1 className="text-base font-medium text-[#0E121B]">All Projects</h1>
          <p className="text-xs text-[#525866] mt-0.5">{filtered.length} of {projects.length} projects across every company</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-full items-center gap-2 rounded-lg border border-[#E1E4EA] bg-white px-3 sm:w-64">
            <Search size={14} className="text-[#9ca3af]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search projects or clients"
              className="w-full bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#9ca3af]"
            />
          </div>
          <Button onClick={() => setCreating(true)}><Plus size={14} /> New Project</Button>
        </div>
      </div>
      <div className="p-5 xl:p-6 space-y-6">

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
                  statusFilter === item.value ? "bg-[#884c2d] text-white" : "bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        }
      >
        <table className="w-full text-left text-sm text-[#6b7280]">
          <thead className="bg-[#fff1ec] text-xs uppercase text-[#9ca3af]">
            <tr>
              <th className="px-5 py-3 font-semibold">Project Name</th>
              <th className="px-5 py-3 font-semibold">Company</th>
              <th className="px-5 py-3 font-semibold">Template</th>
              <th className="px-5 py-3 font-semibold">Current Stage</th>
              <th className="px-5 py-3 font-semibold">Progress</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Timeline</th>
              <th className="px-5 py-3 font-semibold text-right">Value</th>
              <th className="px-5 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f3e5e0] bg-white">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center">
                  <div className="mx-auto flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#884c2d]"></div>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-[#111827]">Loading projects...</p>
                </td>
              </tr>
            ) : filtered.length > 0 ? filtered.map((project) => {
              const start = project.startDate ? new Date(project.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-";
              const deadline = (project.dueDate || project.expectedEndDate) ? new Date(project.dueDate || project.expectedEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-";
              return (
                <tr key={project.id || project._id} className="hover:bg-[#fff1ec] transition-colors">
                  <td className="px-5 py-4">
                    <Link
                      to={`/admin/companies/${project.companyId}/projects/${project.id || project._id}`}
                      className="font-bold text-[#884c2d] hover:underline"
                    >
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-5 py-4 font-medium text-[#111827]">{project.computedCompanyName}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                      {project.template || project.packageName || "Custom"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs font-medium text-[#111827] truncate max-w-[150px]">{project.currentStage}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-[#f3f4f6]">
                        <div
                          className={`h-full rounded-full ${project.computedProgress === 100 ? "bg-emerald-500" : "bg-[#884c2d]"}`}
                          style={{ width: `${project.computedProgress}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-[#111827]">{project.computedProgress}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={project.effectiveStatus}
                      onChange={(e) => updateProjectStatus(project, e.target.value)}
                      className={`rounded-md border-0 bg-transparent py-1 pl-1 pr-6 text-xs font-semibold focus:ring-0 ${
                        project.effectiveStatus === "completed" ? "text-emerald-700" :
                        project.effectiveStatus === "delayed" ? "text-red-700" :
                        "text-[#111827]"
                      }`}
                    >
                      {PROJECT_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#9ca3af]">Start: <span className="text-[#111827] font-medium">{start}</span></span>
                      <span className="text-[#9ca3af]">Due: <span className="text-[#111827] font-medium">{deadline}</span></span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-[#111827]">
                    {formatINR(project.finalAmount || project.budget || 0)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => handleDeleteProject(project)} className="rounded-lg p-2 text-[#9ca3af] hover:bg-red-50 hover:text-red-600" title="Delete project">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center">
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[#fff1ec] text-[#884c2d]">
                    <FolderKanban size={20} />
                  </div>
                  <p className="text-sm font-semibold text-[#111827]">{search || statusFilter !== "All" ? "No projects match your filters." : "No projects yet."}</p>
                  <p className="mt-1 text-sm text-[#6b7280]">Create a project and link it to a company to get started.</p>
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
          projects={projects}
          preselectCompanyId={preselectCompanyId}
          onCreateCompany={() => navigate("/admin/companies", { state: { openCreate: true, returnTo: "/admin/projects" } })}
          onClose={() => setCreating(false)}
          onSave={handleCreate}
        />
      )}
      </div>
    </div>
  );
}
