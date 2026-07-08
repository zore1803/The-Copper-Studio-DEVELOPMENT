import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpDown, Check, CheckCircle2, ChevronLeft, Clock3, Eye, FolderKanban, AlertTriangle, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { apiGet } from "../../lib/api";
import { buildProjectPayload } from "../../lib/projectDefaults";
import ProjectFormPanel from "../../components/ProjectFormPanel";
import { useToast } from "../../components/useToast";
import FilterButton from "../../components/FilterButton";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import MobileListCard, { CARD_TONES } from "../../components/MobileListCard";

const SORT_OPTIONS = [
  { value: "created_desc", label: "Newest first" },
  { value: "created_asc", label: "Oldest first" },
  { value: "name_asc", label: "Name (A–Z)" },
  { value: "value_desc", label: "Value (high–low)" }
];

// Closes the sort dropdown when clicking outside its trigger/menu.
function useClickOutside(ref, onOutside, active) {
  useEffect(() => {
    if (!active) return;
    function onDown(event) {
      if (ref.current && ref.current.contains(event.target)) return;
      onOutside();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [active, onOutside, ref]);
}

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
}

function KpiChip({ label, value, icon: Icon, tone = "default" }) {
  const toneStyles = {
    default: "bg-[#fff1ec] text-[#8D3118]",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
  };
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toneStyles[tone]}`}>
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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
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
      setCreating(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // Re-run whenever a fresh navigation lands here (e.g. the navbar quick-add
    // firing while this page is already mounted) — location.key changes per nav.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const [statusFilter, setStatusFilter] = useState("All");
  const [companyFilter, setCompanyFilter] = useState("All");
  const [templateFilter, setTemplateFilter] = useState("All");
  const [deletingProject, setDeletingProject] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [sortBy, setSortBy] = useState("created_desc");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);
  useClickOutside(sortRef, () => setSortOpen(false), sortOpen);

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
      const templateName = p.template || p.packageName || "Custom";

      return { ...p, computedProgress: progress, currentStage, effectiveStatus, computedCompanyName: companyName, computedTemplateName: templateName };
    });
  }, [projects, companies]);

  const companyFilterOptions = useMemo(
    () => ["All", ...Array.from(new Set(computedProjects.map((p) => p.computedCompanyName).filter((n) => n && n !== "-"))).sort((a, b) => String(a).localeCompare(String(b)))],
    [computedProjects]
  );
  const templateFilterOptions = useMemo(
    () => ["All", ...Array.from(new Set(computedProjects.map((p) => p.computedTemplateName).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b)))],
    [computedProjects]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const arr = computedProjects.filter((project) => {
      const matchesQuery = !query || `${project.name} ${project.client} ${project.template} ${project.computedCompanyName || ""} ${project.computedTemplateName || ""} ${project.effectiveStatus || ""} ${project.projectId || ""} ${project.manager || ""}`.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All" || project.effectiveStatus === statusFilter;
      const matchesCompany = companyFilter === "All" || project.computedCompanyName === companyFilter;
      const matchesTemplate = templateFilter === "All" || project.computedTemplateName === templateFilter;
      return matchesQuery && matchesStatus && matchesCompany && matchesTemplate;
    });
    const byCreated = (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    const byValue = (a, b) => (Number(b.finalAmount || b.budget) || 0) - (Number(a.finalAmount || a.budget) || 0);
    const byName = (a, b) => String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" });
    switch (sortBy) {
      case "created_asc": return arr.sort(byCreated);
      case "name_asc": return arr.sort(byName);
      case "value_desc": return arr.sort(byValue);
      case "created_desc":
      default: return arr.sort((a, b) => byCreated(b, a));
    }
  }, [computedProjects, search, statusFilter, companyFilter, templateFilter, sortBy]);

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
    navigate(`/admin/projects/${created.id || created._id}`);
  }

  async function updateProjectStatus(project, newStatus) {
    await update(project.id || project._id, { status: newStatus });
    showToast({ title: "Status updated", message: `${project.name} is now ${newStatus.replace("_", " ")}.` });
  }

  async function handleDeleteProject() {
    const project = deletingProject;
    if (!project) return;
    setDeleting(true);
    await remove(project);
    setDeleting(false);
    setDeletingProject(null);
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
    <div className="flex flex-col min-h-full bg-[#FFFFFF]">
      <div className="flex flex-col gap-2 border-b border-[#E1E4EA] bg-white px-4 py-2 sm:gap-4 sm:px-6 sm:py-3 lg:h-14 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:py-0 min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => navigate(-1)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#525866] hover:bg-[#f9fafb] sm:hidden">
              <ChevronLeft size={18} />
            </button>
            <div className="min-w-0">
              <h1 className="text-base font-medium text-[#0E121B]">All Projects</h1>
              <p className="hidden text-xs text-[#525866] mt-0.5 sm:block">{filtered.length} of {projects.length} projects across every company</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile-only search icon toggle */}
            <button
              onClick={() => setMobileSearchOpen((v) => !v)}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors sm:hidden ${mobileSearchOpen ? "border-[#8D3118] bg-[#fff8f6] text-[#8D3118]" : "border-[#E1E4EA] text-[#525866]"}`}
            >
              <Search size={15} />
            </button>
            {/* Compact "+ New" button (mobile, compact — desktop copy lives below) */}
            <button
              onClick={() => setCreating(true)}
              className="flex h-8 items-center gap-1 rounded-full bg-[#8D3118] px-3 text-xs font-medium text-white hover:bg-[#8D3118] transition-colors shadow-sm sm:hidden"
            >
              <Plus size={14} /> New
            </button>
          </div>
        </div>

        {/* Mobile search bar — drops down only when the icon above is tapped */}
        {mobileSearchOpen && (
          <div className="flex h-9 w-full items-center gap-2 rounded-full border border-[#8D3118] bg-[#fff8f6] px-3 sm:hidden">
            <Search size={14} className="text-[#8D3118] shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search projects or clients"
              className="w-full bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#525866]"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <div className="hidden h-8 w-full items-center gap-2 rounded-full border border-[#E1E4EA] bg-white px-3 sm:flex sm:w-64 min-w-0 transition-colors focus-within:border-[#8D3118] focus-within:bg-[#fff8f6]">
            <Search size={14} className="text-[#525866] shrink-0" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search projects or clients"
              className="w-full bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#525866]"
            />
          </div>
          {/* Sort (desktop only) */}
          <div className="relative hidden sm:block" ref={sortRef}>
            <button
              onClick={() => setSortOpen((value) => !value)}
              className={`flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors ${sortOpen ? "border-[#8D3118] bg-[#fff8f6] text-[#8D3118]" : "border-[#E1E4EA] bg-white text-[#1F2937] hover:bg-[#f9fafb]"}`}
            >
              <ArrowUpDown size={14} />
              <span className="hidden sm:inline">{SORT_OPTIONS.find((o) => o.value === sortBy)?.label || "Sort"}</span>
            </button>
            {sortOpen && (
              <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-[#e5e7eb] bg-white p-1 shadow-lg">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                    className={`flex w-full items-center justify-between rounded-full px-3 py-2 text-left text-sm hover:bg-[#f9fafb] ${sortBy === opt.value ? "font-semibold text-[#8D3118]" : "text-[#374151]"}`}
                  >
                    {opt.label}
                    {sortBy === opt.value && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="hidden sm:block">
            <FilterButton
              onReset={() => { setStatusFilter("All"); setCompanyFilter("All"); setTemplateFilter("All"); }}
              buttonClassName="h-8 w-8"
              fields={[
                { key: "status", label: "Status", type: "select", value: statusFilter, onChange: setStatusFilter, options: statusFilters },
                { key: "company", label: "Company", type: "select", value: companyFilter, onChange: setCompanyFilter, options: companyFilterOptions },
                { key: "template", label: "Template", type: "select", value: templateFilter, onChange: setTemplateFilter, options: templateFilterOptions }
              ]}
            />
          </div>
          <Button onClick={() => setCreating(true)} className="hidden sm:inline-flex"><Plus size={14} /> New Project</Button>
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

      {/* Mobile: one card per project */}
      <div className="flex flex-col gap-3 sm:hidden">
        {loading ? (
          <p className="py-10 text-center text-sm text-[#6b7280]">Loading projects...</p>
        ) : filtered.length > 0 ? filtered.map((project) => {
          const statusLabel = PROJECT_STATUS_OPTIONS.find((o) => o.value === project.effectiveStatus)?.label || project.effectiveStatus;
          const statusTone = project.effectiveStatus === "completed"
            ? "bg-emerald-50 text-emerald-700"
            : project.effectiveStatus === "delayed"
              ? "bg-red-50 text-red-700"
              : "bg-[#f3f4f6] text-[#374151]";
          return (
            <MobileListCard
              key={project.id || project._id}
              title={project.name}
              subtitle={project.template || project.packageName || "Custom"}
              badge={<span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusTone}`}>{statusLabel}</span>}
              onClick={() => navigate(`/admin/projects/${project.id || project._id}`)}
              fields={[
                { label: "Company", value: project.computedCompanyName },
                { label: "Progress · Value", value: `${project.computedProgress}% · ${formatINR(project.finalAmount || project.budget || 0)}` },
              ]}
              actions={[
                { label: "View", icon: <Eye size={13} />, tone: CARD_TONES.view, onClick: () => navigate(`/admin/projects/${project.id || project._id}`) },
                { label: "Timeline", icon: <Clock3 size={13} />, tone: CARD_TONES.edit, onClick: () => navigate(`/admin/projects/${project.id || project._id}/tasks`) },
                { label: "Delete", icon: <Trash2 size={13} />, tone: CARD_TONES.delete, onClick: () => setDeletingProject(project) },
              ]}
            />
          );
        }) : (
          <div className="rounded-xl border border-dashed border-[#e5e7eb] bg-white p-8 text-center">
            <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff1ec] text-[#8D3118]">
              <FolderKanban size={20} />
            </div>
            <p className="text-sm font-semibold text-[#111827]">{search || statusFilter !== "All" ? "No projects match your filters." : "No projects yet."}</p>
            <p className="mt-1 text-sm text-[#6b7280]">Create a project and link it to a company to get started.</p>
          </div>
        )}
      </div>

      <section className="hidden sm:block overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-[#6b7280]">
          <thead className="bg-[#8D3118] text-xs uppercase text-white">
            <tr>
              <th className="px-5 py-3 font-bold text-white">Project Name</th>
              <th className="px-5 py-3 font-bold text-white">Company</th>
              <th className="px-5 py-3 font-bold text-white">Template</th>
              <th className="px-5 py-3 font-bold text-white">Current Stage</th>
              <th className="px-5 py-3 font-bold text-white">Progress</th>
              <th className="px-5 py-3 font-bold text-white">Status</th>
              <th className="px-5 py-3 font-bold text-white">Timeline</th>
              <th className="px-5 py-3 font-bold text-right text-white">Value</th>
              <th className="px-5 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f3e5e0] bg-white">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center">
                  <div className="mx-auto flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8D3118]"></div>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-[#111827]">Loading projects...</p>
                </td>
              </tr>
            ) : filtered.length > 0 ? filtered.map((project) => {
              const start = project.startDate ? new Date(project.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-";
              const deadline = (project.dueDate || project.expectedEndDate) ? new Date(project.dueDate || project.expectedEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-";
              return (
                <tr key={project.id || project._id} className="hover:bg-[#fafafa] transition-colors">
                  <td className="px-5 py-4">
                    <Link
                      to={`/admin/projects/${project.id || project._id}`}
                      className="font-bold text-[#8D3118] hover:underline"
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
                          className={`h-full rounded-full ${project.computedProgress === 100 ? "bg-emerald-500" : "bg-[#8D3118]"}`}
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
                    <button onClick={() => setDeletingProject(project)} className="rounded-full p-2 text-[#9ca3af] hover:bg-red-50 hover:text-red-600" title="Delete project">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center">
                  <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff1ec] text-[#8D3118]">
                    <FolderKanban size={20} />
                  </div>
                  <p className="text-sm font-semibold text-[#111827]">{search || statusFilter !== "All" ? "No projects match your filters." : "No projects yet."}</p>
                  <p className="mt-1 text-sm text-[#6b7280]">Create a project and link it to a company to get started.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </section>

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
      {deletingProject && (
        <ConfirmDeleteModal
          title="Delete project?"
          name={deletingProject.name || "this project"}
          loading={deleting}
          onCancel={() => setDeletingProject(null)}
          onConfirm={handleDeleteProject}
        />
      )}
      </div>
    </div>
  );
}
