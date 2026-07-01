import { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import {
  LayoutDashboard, GitBranch, Video, FileText,
  Receipt, Settings, LogOut, Bell, ChevronsLeft, ChevronsRight, Menu, X,
  FolderKanban, ChevronDown, Check
} from "lucide-react";
import { ClientProjectProvider, useClientProject } from "../context/ClientProjectContext";

function ProjectSwitcher() {
  const { projects, selectedProject, selectedId, setSelectedId } = useClientProject();
  const [open, setOpen] = useState(false);

  if (!projects.length) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 max-w-[240px] items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-[#1A1A1A] hover:bg-[#E5E7EB] transition-colors"
        title="Switch project"
      >
        <FolderKanban size={15} className="shrink-0 text-[#C55418]" />
        <span className="truncate font-medium">{selectedProject?.name || "Select a project"}</span>
        <ChevronDown size={14} className={`shrink-0 text-[#6B7280] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-lg">
            <p className="px-3 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">Your Projects</p>
            <div className="max-h-80 overflow-y-auto pb-1">
              {projects.map((p) => {
                const id = String(p._id || p.id);
                const active = id === String(selectedId);
                return (
                  <button
                    key={id}
                    onClick={() => { setSelectedId(id); setOpen(false); }}
                    className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-[#E5E7EB] ${active ? "bg-[#FFFFFF]" : ""}`}
                  >
                    <FolderKanban size={15} className={`shrink-0 ${active ? "text-[#C55418]" : "text-[#6B7280]"}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-[#1A1A1A]">{p.name || "Untitled project"}</span>
                      {p.packageName && <span className="block truncate text-xs text-[#6B7280]">{p.packageName}</span>}
                    </span>
                    {active && <Check size={15} className="shrink-0 text-[#C55418]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/client", end: true },
  { icon: GitBranch, label: "Project Timeline", to: "/client/projects" },
  { icon: Video, label: "Meetings", to: "/client/meetings" },
  { icon: FileText, label: "Documents", to: "/client/documents" },
  { icon: Receipt, label: "Billing & Invoices", to: "/client/invoices" },
  { icon: Settings, label: "Settings", to: "/client/profile" },
];

const pageTitles = {
  "/client": "Dashboard",
  "/client/projects": "Project Timeline",
  "/client/meetings": "Meetings",
  "/client/documents": "Documents",
  "/client/invoices": "Billing & Invoices",
  "/client/profile": "Settings",
};

function isActive(item, pathname) {
  return item.end ? pathname === item.to : pathname.startsWith(item.to);
}

function NavItem({ item, collapsed, active, onNavigate }) {
  if (collapsed) {
    return (
      <button
        onClick={() => onNavigate(item.to)}
        title={item.label}
        className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
          active ? "bg-white border-[#E5E7EB] text-[#C55418] shadow-sm" : "border-transparent text-[#1A1A1A] hover:bg-white/70"
        }`}
      >
        <item.icon size={20} strokeWidth={1.8} className="shrink-0" />
      </button>
    );
  }
  return (
    <button
      onClick={() => onNavigate(item.to)}
      className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
        active ? "bg-white border border-[#E5E7EB] text-[#C55418] shadow-sm" : "text-[#1A1A1A] hover:bg-white/70"
      }`}
    >
      <item.icon size={16} strokeWidth={1.8} className="shrink-0" />
      <span className="truncate text-sm font-medium">{item.label}</span>
    </button>
  );
}

export default function ClientLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  // Match the admin shell: start collapsed; expand only on explicit toggle.
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const name = auth.user?.name || "Client";
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const pageTitle = pageTitles[location.pathname] || "Portal";

  function go(to) {
    navigate(to);
    setMobileOpen(false);
  }

  function handleLogout() {
    auth.logout();
    navigate("/login", { replace: true });
  }

  const sidebarW = collapsed ? 66 : 264;

  return (
   <ClientProjectProvider>
    <div className="flex h-screen overflow-hidden bg-[#FFFFFF]">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-[#FFFFFF] border-r border-[#E5E7EB] transition-all duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ width: mobileOpen ? 264 : sidebarW }}
      >
        {/* Logo */}
        <div className={`flex items-center justify-center border-b border-[#E5E7EB] ${collapsed && !mobileOpen ? "px-1 py-3" : "px-4 py-5"}`}>
          <img
            src="/copper-studio-wordmark.png"
            alt="Copper Studio"
            className={`object-contain ${collapsed && !mobileOpen ? "h-8 w-auto" : "h-9 w-auto max-w-full"}`}
          />
          {mobileOpen && (
            <button className="ml-auto lg:hidden text-[#6B7280] hover:text-[#1A1A1A]" onClick={() => setMobileOpen(false)}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className={`flex-1 overflow-y-auto py-3 ${collapsed && !mobileOpen ? "flex flex-col items-center gap-2.5" : "space-y-0.5 px-3"}`}>
          {(!collapsed || mobileOpen) && (
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">Navigation</p>
          )}
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              item={item}
              collapsed={collapsed && !mobileOpen}
              active={isActive(item, location.pathname)}
              onNavigate={go}
            />
          ))}
        </nav>

        {/* Bottom: user + collapse */}
        <div className={`border-t border-[#E5E7EB] ${collapsed && !mobileOpen ? "flex flex-col items-center gap-2 py-3" : "p-3 space-y-2"}`}>
          {(!collapsed || mobileOpen) && (
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
              <div className="h-8 w-8 shrink-0 rounded-full bg-[#C55418] flex items-center justify-center text-white text-xs font-bold">{initials}</div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#1A1A1A] truncate">{name}</p>
                <p className="text-[10px] text-[#6B7280] truncate">{auth.user?.email}</p>
              </div>
              <button onClick={handleLogout} className="text-[#6B7280] hover:text-red-500 transition-colors" title="Log out">
                <LogOut size={14} />
              </button>
            </div>
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white text-sm font-semibold text-[#6B7280] hover:bg-[#E5E7EB] transition-colors ${collapsed && !mobileOpen ? "h-9 w-9 justify-center" : "w-full px-3 py-2"}`}
          >
            {collapsed && !mobileOpen ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
            {(!collapsed || mobileOpen) && "Collapse"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden" style={{ marginLeft: sidebarW }}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#E5E7EB] bg-white px-6 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden p-1.5 rounded-lg text-[#6b7280] hover:text-[#1A1A1A]" onClick={() => setMobileOpen(true)}>
              <Menu size={18} />
            </button>
            <h2 className="hidden sm:block text-sm font-semibold text-[#1A1A1A] truncate">{pageTitle}</h2>
            <span className="hidden sm:block h-5 w-px bg-[#E5E7EB]" />
            <ProjectSwitcher />
          </div>

          <div className="flex items-center gap-4">
            {/* Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] text-black hover:bg-[#E5E7EB] transition-colors"
              >
                <Bell size={16} />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#C55418]" />
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-[#e5e7eb] bg-white shadow-lg z-50">
                  <div className="px-4 py-3 border-b border-[#e5e7eb]">
                    <p className="font-semibold text-sm text-[#1A1A1A]">Notifications</p>
                  </div>
                  <div className="p-3 space-y-1.5">
                    {[
                      { text: "Meeting scheduled for tomorrow", time: "2h ago" },
                      { text: "New document available for review", time: "1d ago" },
                    ].map((n, i) => (
                      <div key={i} className="flex gap-3 p-2.5 rounded-lg bg-[#FFFFFF] hover:bg-[#E5E7EB] transition-colors cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#1A1A1A]">{n.text}</p>
                          <p className="text-xs mt-0.5 text-[#6b7280]">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white p-1">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C55418] text-white text-xs font-medium">
                {initials}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-white">
          <Outlet />
        </main>
      </div>
    </div>
   </ClientProjectProvider>
  );
}
