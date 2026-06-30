import { useState, useEffect, Suspense } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import LoadingScreen from "../components/LoadingScreen";
import {
  LayoutDashboard, GitBranch, Video, FileText,
  Receipt, Settings, LogOut, Bell, ChevronLeft, ChevronRight, Menu, X
} from "lucide-react";

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

function NavItem({ item, collapsed }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-lg transition-all duration-150 ${
          collapsed ? "justify-center px-0 py-2.5 mx-1" : "px-3 py-2 mx-2"
        } ${
          isActive
            ? "bg-[#884c2d]/15 text-[#884c2d]"
            : "text-[#9ca3af] hover:bg-white/6 hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[#884c2d]" />
          )}
          <item.icon size={17} strokeWidth={1.8} className="shrink-0" />
          {!collapsed && <span className="truncate text-[13px] font-medium">{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}

export default function ClientLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const name = auth.user?.name || "Client";
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const pageTitle = pageTitles[location.pathname] || "Portal";

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  function handleLogout() {
    auth.logout();
    navigate("/login", { replace: true });
  }

  const sidebarW = collapsed ? 64 : 240;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f6fa]">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-[#111827] transition-all duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ width: mobileOpen ? 240 : sidebarW }}
      >
        {/* Logo */}
        <div className={`flex items-center border-b border-white/8 ${collapsed && !mobileOpen ? "justify-center px-0 py-5" : "px-5 py-5"}`}>
          {collapsed && !mobileOpen ? (
            <div className="h-8 w-8 rounded-lg bg-[#884c2d] flex items-center justify-center text-white font-bold text-sm">CS</div>
          ) : (
            <div className="flex items-center gap-2 min-w-0 w-full">
              <div className="h-8 w-8 shrink-0 rounded-lg bg-[#884c2d] flex items-center justify-center text-white font-bold text-sm">CS</div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-bold truncate">The Copper Studio</p>
                <p className="text-[#6b7280] text-[10px] truncate">Client Portal</p>
              </div>
              <button className="lg:hidden text-[#6b7280] hover:text-white" onClick={() => setMobileOpen(false)}>
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5">
          {!collapsed || mobileOpen ? (
            <div className="px-2 py-1.5 mb-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Navigation</p>
            </div>
          ) : null}
          {navItems.map((item) => (
            <NavItem key={item.to} item={item} collapsed={collapsed && !mobileOpen} />
          ))}
        </nav>

        {/* Bottom */}
        <div className={`border-t border-white/8 py-3 ${collapsed && !mobileOpen ? "px-1" : "px-3"}`}>
          {(!collapsed || mobileOpen) && (
            <div className="flex items-center gap-2.5 px-2 py-2 mb-2 rounded-lg">
              <div className="h-8 w-8 shrink-0 rounded-full bg-[#884c2d] flex items-center justify-center text-white text-xs font-bold">{initials}</div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-semibold truncate">{name}</p>
                <p className="text-[#6b7280] text-[10px] truncate">{auth.user?.email}</p>
              </div>
              <button onClick={handleLogout} className="text-[#6b7280] hover:text-white transition-colors" title="Log out">
                <LogOut size={14} />
              </button>
            </div>
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className={`hidden lg:flex items-center justify-center w-full rounded-lg py-2 text-[#6b7280] hover:bg-white/8 hover:text-white transition-all ${collapsed ? "" : "gap-2"}`}
          >
            {collapsed ? <ChevronRight size={16} /> : (
              <>
                <ChevronLeft size={14} />
                <span className="text-xs font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden" style={{ marginLeft: sidebarW }}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#e5e7eb] bg-white px-6 gap-4">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5 rounded-lg text-[#6b7280] hover:text-[#111827]" onClick={() => setMobileOpen(true)}>
              <Menu size={18} />
            </button>
            <h2 className="text-sm font-semibold text-[#111827]">{pageTitle}</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#6b7280] hover:text-[#111827] transition-colors"
              >
                <Bell size={16} />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#884c2d]" />
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-[#e5e7eb] bg-white shadow-lg z-50">
                  <div className="px-4 py-3 border-b border-[#e5e7eb]">
                    <p className="font-semibold text-sm text-[#111827]">Notifications</p>
                  </div>
                  <div className="p-3 space-y-1.5">
                    {[
                      { text: "Meeting scheduled for tomorrow", time: "2h ago" },
                      { text: "New document available for review", time: "1d ago" },
                    ].map((n, i) => (
                      <div key={i} className="flex gap-3 p-2.5 rounded-lg bg-[#f9fafb] hover:bg-[#f3f4f6] transition-colors cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#111827]">{n.text}</p>
                          <p className="text-xs mt-0.5 text-[#6b7280]">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="h-9 w-9 rounded-full bg-[#884c2d] flex items-center justify-center text-white text-xs font-bold cursor-pointer">
              {initials}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-[#f5f6fa]">
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
