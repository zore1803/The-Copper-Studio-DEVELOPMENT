import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderKanban, Search } from "lucide-react";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { GanttView } from "./ProjectTimeline";

export default function TimelinePage() {
  const navigate = useNavigate();
  const { records: projects, loading } = useCrmRecords("projects");
  const { records: companies } = useCrmRecords("companies");
  const [search, setSearch] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("All");

  const companyName = useCallback((project) => {
    const cid = project.companyId;
    const found = companies.find((c) => String(c._id) === String(cid) || String(c.id) === String(cid));
    return found?.name || project.companyName || project.client || "Unknown company";
  }, [companies]);

  // Extract unique packages
  const packages = useMemo(() => {
    const allPackages = projects
      .map(p => p.packageName || p.packagePurchased || p.package)
      .filter(Boolean);
    return ["All", ...Array.from(new Set(allPackages))].sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      const pName = `${p.name} ${companyName(p)}`.toLowerCase();
      const matchesSearch = !q || pName.includes(q);
      const pkg = p.packageName || p.packagePurchased || p.package;
      const matchesPackage = selectedPackage === "All" || pkg === selectedPackage;
      return matchesSearch && matchesPackage;
    });
  }, [projects, search, companyName, selectedPackage]);

  const projectCategories = useMemo(() => {
    return filteredProjects.map(p => ({
      id: String(p.id || p._id),
      title: p.name,
    }));
  }, [filteredProjects]);

  const stages = useMemo(() => {
    // Collect all stages for the filtered projects
    const allStages = [];
    filteredProjects.forEach(project => {
      const pId = String(project.id || project._id);
      
      // Get stages from project.stages
      const projectStages = project.stages?.length ? project.stages : [];
      projectStages.forEach((m, index) => {
        allStages.push({
          ...m,
          id: m.id || m._id || `${pId}-${m.name}-${index}`,
          title: m.name || m.title || "Untitled Stage",
          projectName: project.name,
          projectId: pId,
          companyId: project.companyId,
          status: m.status || "To Do",
        });
      });
    });
    return allStages;
  }, [filteredProjects]);

  const handleOpenEdit = (groupId, task) => {
    if (task.companyId && task.projectId) {
      navigate(`/admin/companies/${task.companyId}/projects/${task.projectId}`);
    } else if (task.projectId) {
       const p = projects.find(proj => String(proj.id || proj._id) === String(task.projectId));
       if (p && p.companyId) {
         navigate(`/admin/companies/${p.companyId}/projects/${task.projectId}`);
       }
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-[#FFFFFF]">
      <div className="flex flex-col gap-4 border-b border-[#E1E4EA] bg-white px-6 py-3 lg:h-14 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:py-0">
        <div>
          <h1 className="text-base font-medium text-[#0E121B]">Global Timeline</h1>
          <p className="text-xs text-[#525866] mt-0.5">All project stages plotted on a master Gantt chart.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-9 items-center gap-2 rounded-lg border border-[#E1E4EA] bg-white px-3">
            <Search size={14} className="text-[#9ca3af]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-44 bg-transparent text-sm text-[#111827] outline-none"
            />
          </div>
          <select
            value={selectedPackage}
            onChange={(e) => setSelectedPackage(e.target.value)}
            className="h-9 rounded-lg border border-[#E1E4EA] bg-white px-3 text-sm font-medium text-[#111827] outline-none focus:ring-2 focus:ring-[#C55418]"
          >
            {packages.map(pkg => (
              <option key={pkg} value={pkg}>{pkg === "All" ? "All Packages" : pkg}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="p-5 xl:p-6 space-y-5">

      {loading ? (
        <div className="flex justify-center py-20 text-sm text-[#6b7280]">Loading timeline...</div>
      ) : !filteredProjects.length ? (
        <div className="rounded-xl border border-dashed border-[#e5e7eb] bg-white p-16 text-center">
          <FolderKanban size={28} className="mx-auto mb-3 text-[#C55418]" />
          <p className="text-sm font-semibold text-[#111827]">No projects found.</p>
          <p className="mt-1 text-sm text-[#6b7280]">Try adjusting your search or package filter.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm flex flex-col">
           <GanttView stages={stages} onOpenEdit={handleOpenEdit} groupBy="project" groupCategories={projectCategories} />
        </div>
      )}
      </div>
    </div>
  );
}
