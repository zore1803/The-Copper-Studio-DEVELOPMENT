import { useCallback, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FolderKanban, Search, ChevronLeft } from "lucide-react";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { GanttView } from "./ProjectTimeline";

export default function TimelinePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { records: projects, loading } = useCrmRecords("projects");
  const { records: companies } = useCrmRecords("companies");
  const [search, setSearch] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
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
    if (task.projectId) {
      navigate(`/admin/projects/${task.projectId}`, { state: { backgroundLocation: location } });
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-[#FFFFFF]">
      <div className="flex flex-col gap-2 border-b border-[#E1E4EA] bg-white px-4 py-2 sm:gap-4 sm:px-6 sm:py-3 lg:h-14 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:py-0 min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => navigate(-1)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#525866] hover:bg-[#f9fafb] sm:hidden">
              <ChevronLeft size={18} />
            </button>
            <div className="min-w-0">
              <h1 className="text-base font-medium text-[#0E121B]">Global Timeline</h1>
              <p className="hidden text-xs text-[#525866] mt-0.5 sm:block">All project stages plotted on a master Gantt chart.</p>
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
          </div>
        </div>

        {/* Mobile search bar — drops down only when the icon above is tapped */}
        {mobileSearchOpen && (
          <div className="flex h-9 w-full items-center gap-2 rounded-full border border-[#8D3118] bg-[#fff8f6] px-3 sm:hidden">
            <Search size={14} className="text-[#8D3118] shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#525866]"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <div className="hidden h-8 items-center gap-2 rounded-full border border-[#E1E4EA] bg-white px-3 sm:flex transition-colors focus-within:border-[#8D3118] focus-within:bg-[#fff8f6]">
            <Search size={14} className="text-[#525866] shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-44 bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#525866]"
            />
          </div>
          <select
            value={selectedPackage}
            onChange={(e) => setSelectedPackage(e.target.value)}
            className="h-8 rounded-lg border border-[#E1E4EA] bg-white px-3 text-sm font-medium text-[#111827] outline-none focus:ring-2 focus:ring-[#8D3118]"
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
          <FolderKanban size={28} className="mx-auto mb-3 text-[#8D3118]" />
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
