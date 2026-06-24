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
    <div className="min-h-[calc(100vh-64px)] flex flex-col space-y-5 bg-[#faf6f3] p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-[#2b211c]">Global Timeline</h2>
          <p className="mt-1 text-sm text-[#6c6355]">All project stages plotted on a master Gantt chart.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-[#ead9d0] bg-white px-3 py-1.5 shadow-sm">
            <Search size={16} className="text-[#9b8c83]" />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search projects..." 
              className="w-48 bg-transparent text-sm text-[#2b211c] outline-none" 
            />
          </div>
          
          <select
            value={selectedPackage}
            onChange={(e) => setSelectedPackage(e.target.value)}
            className="rounded-lg border border-[#ead9d0] bg-white px-3 py-1.5 text-sm font-medium text-[#2b211c] shadow-sm outline-none focus:ring-2 focus:ring-[#884c2d]"
          >
            {packages.map(pkg => (
              <option key={pkg} value={pkg}>{pkg === "All" ? "All Packages" : pkg}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-sm text-[#6c6355]">Loading timeline...</div>
      ) : !filteredProjects.length ? (
        <div className="rounded-xl border border-dashed border-[#ead9d0] bg-white p-16 text-center">
          <FolderKanban size={28} className="mx-auto mb-3 text-[#884c2d]" />
          <p className="text-sm font-semibold text-[#2b211c]">No projects found.</p>
          <p className="mt-1 text-sm text-[#6c6355]">Try adjusting your search or package filter.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden rounded-xl border border-[#ead9d0] bg-white shadow-sm flex flex-col">
           <GanttView stages={stages} onOpenEdit={handleOpenEdit} groupBy="project" groupCategories={projectCategories} />
        </div>
      )}
    </div>
  );
}
