import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import {
  LayoutDashboard, GitBranch, Video, FileText,
  Receipt, Settings, LogOut, Bell, ChevronsLeft, ChevronsRight, Menu, X,
  FolderKanban, ChevronDown, Check, Plus,
} from "lucide-react";
import { ClientProjectProvider, useClientProject } from "../context/ClientProjectContext";
import { useToast } from "../components/useToast";

const QUICK_ACTIONS = [
  { icon: Video, label: "Request a meeting", to: "/client/meetings" },
  { icon: FileText, label: "View documents", to: "/client/documents" },
  { icon: Receipt, label: "View invoices", to: "/client/invoices" },
];

function ProjectSwitcher() {
  const { projects, selectedProject, selectedId, setSelectedId } = useClientProject();
  const [open, setOpen] = useState(false);

  if (!projects.length) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 max-w-[240px] items-center gap-2 rounded-lg border border-[#E1E4EA] bg-white px-3 text-sm text-[#111827] hover:bg-[#f9fafb] transition-colors"
        title="Switch project"
      >
        <FolderKanban size={15} className="shrink-0 text-[#8D3118]" />
        <span className="truncate font-medium">{selectedProject?.name || "Select a project"}</span>
        <ChevronDown size={14} className={`shrink-0 text-[#9ca3af] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-lg">
            <p className="px-3 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wide text-[#9ca3af]">Your Projects</p>
            <div className="max-h-80 overflow-y-auto pb-1">
              {projects.map((p) => {
                const id = String(p._id || p.id);
                const active = id === String(selectedId);
                return (
                  <button
                    key={id}
                    onClick={() => { setSelectedId(id); setOpen(false); }}
                    className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-[#f9fafb] ${active ? "bg-[#fff8f6]" : ""}`}
                  >
                    <FolderKanban size={15} className={`shrink-0 ${active ? "text-[#8D3118]" : "text-[#9ca3af]"}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-[#111827]">{p.name || "Untitled project"}</span>
                      {p.packageName && <span className="block truncate text-xs text-[#9ca3af]">{p.packageName}</span>}
                    </span>
                    {active && <Check size={15} className="shrink-0 text-[#8D3118]" />}
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
          active ? "bg-white border-[#E5E5E5] text-[#8D3118] shadow-sm" : "border-transparent text-[#374151] hover:bg-white/70"
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
        active ? "bg-white border border-[#E5E5E5] text-[#8D3118] shadow-sm" : "text-[#374151] hover:bg-white/70"
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
  // Match the admin shell: the sidebar stays collapsed (icon rail) until the
  // cursor enters it, then it expands automatically and collapses again once
  // the cursor leaves. The toggle button lets the user pin it open.
  const [pinned, setPinned] = useState(false);
  const [hovering, setHovering] = useState(false);
  const collapsed = !pinned && !hovering;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const quickAddRef = useRef(null);
  const notifRef = useRef(null);
  const { notifHistory, unreadCount, markAllRead, clearHistory } = useToast();

  useEffect(() => {
    function onOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (quickAddRef.current && !quickAddRef.current.contains(e.target)) setQuickAddOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

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
  // Content margin tracks the pinned (resting) rail width so hover-expansion
  // overlays the page instead of shoving it sideways.
  const baseW = pinned ? 264 : 66;

  return (
   <ClientProjectProvider>
    <div className="flex h-screen overflow-hidden bg-[#FFFFFF]">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-[#FAFAFA] border-r border-[#ECECEC] transition-all duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ width: mobileOpen ? 264 : sidebarW }}
      >
        {/* Logo */}
        <div className={`flex items-center justify-center border-b border-[#ECECEC] ${collapsed && !mobileOpen ? "px-1 py-3" : "px-4 py-5"}`}>
          <img
            src="/copper-studio-wordmark.png"
            alt="Copper Studio"
            className={`object-contain ${collapsed && !mobileOpen ? "h-8 w-auto" : "h-9 w-auto max-w-full"}`}
          />
          {mobileOpen && (
            <button className="ml-auto lg:hidden text-[#9ca3af] hover:text-[#111827]" onClick={() => setMobileOpen(false)}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className={`flex-1 overflow-y-auto py-3 ${collapsed && !mobileOpen ? "flex flex-col items-center gap-2.5" : "space-y-0.5 px-3"}`}>
          {(!collapsed || mobileOpen) && (
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">Navigation</p>
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
        <div className={`border-t border-[#ECECEC] ${collapsed && !mobileOpen ? "flex flex-col items-center gap-2 py-3" : "p-3 space-y-2"}`}>
          {(!collapsed || mobileOpen) && (
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
              <div className="h-8 w-8 shrink-0 rounded-full bg-[#8D3118] flex items-center justify-center text-white text-xs font-bold">{initials}</div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#111827] truncate">{name}</p>
                <p className="text-[10px] text-[#9ca3af] truncate">{auth.user?.email}</p>
              </div>
              <button onClick={handleLogout} className="text-[#9ca3af] hover:text-red-500 transition-colors" title="Log out">
                <LogOut size={14} />
              </button>
            </div>
          )}
          <button
            onClick={() => setPinned((v) => !v)}
            title={pinned ? "Unpin sidebar" : "Pin sidebar open"}
            className={`flex items-center gap-2 rounded-lg border border-[#E5E5E5] bg-white text-sm font-semibold text-[#525252] hover:bg-[#f9fafb] transition-colors ${collapsed && !mobileOpen ? "h-9 w-9 justify-center" : "w-full px-3 py-2"}`}
          >
            {collapsed && !mobileOpen ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
            {(!collapsed || mobileOpen) && "Collapse"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden" style={{ marginLeft: baseW }}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#E1E4EA] bg-white px-6 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden p-1.5 rounded-lg text-[#6b7280] hover:text-[#111827]" onClick={() => setMobileOpen(true)}>
              <Menu size={18} />
            </button>
            <h2 className="hidden sm:block text-sm font-semibold text-[#111827] truncate">{pageTitle}</h2>
            <span className="hidden sm:block h-5 w-px bg-[#E1E4EA]" />
            <ProjectSwitcher />
          </div>

          <div className="flex items-center gap-4">
            {/* Bell */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => { setNotifOpen((v) => !v); markAllRead(); }}
                className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[#E1E4EA] text-black hover:bg-[#f9fafb] transition-colors"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#DF120B] text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-[#e5e7eb] bg-white shadow-lg z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e7eb]">
                    <p className="font-semibold text-sm text-[#111827]">Notifications</p>
                    {notifHistory.length > 0 && (
                      <button onClick={clearHistory} className="text-[10px] font-semibold text-[#9ca3af] hover:text-red-500 transition-colors">
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-[#f3f4f6]">
                    {notifHistory.length ? (
                      notifHistory.map((n) => {
                        const dotColor = n.type === "error" ? "bg-red-400" : n.type === "info" ? "bg-blue-400" : "bg-emerald-400";
                        const timeStr = n.ts ? new Date(n.ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) + ", " + new Date(n.ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";
                        return (
                          <div key={n.id} className="flex gap-3 px-4 py-3 hover:bg-[#fafafa] transition-colors">
                            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-[#111827]">{n.title}</p>
                              {n.message && <p className="mt-0.5 text-xs text-[#6b7280] leading-relaxed">{n.message}</p>}
                              <p className="mt-1 text-[10px] text-[#9ca3af]">{timeStr}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="px-4 py-6 text-center text-xs text-[#9ca3af]">No notifications yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* + Quick actions */}
            <div ref={quickAddRef} className="relative">
              <button
                onClick={() => setQuickAddOpen((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8D3118] text-white shadow-[inset_0_0_0_1.8px_rgba(255,255,255,0.25)] hover:bg-[#8D3118] transition-colors"
              >
                <Plus size={16} />
              </button>
              {quickAddOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-lg z-50 py-1">
                  {QUICK_ACTIONS.map((item) => (
                    <button
                      key={item.to}
                      onClick={() => { setQuickAddOpen(false); go(item.to); }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[#374151] hover:bg-[#f9fafb]"
                    >
                      <item.icon size={14} className="text-[#9ca3af]" />
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E5E5] bg-white p-1">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8D3118] text-white text-xs font-medium">
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
