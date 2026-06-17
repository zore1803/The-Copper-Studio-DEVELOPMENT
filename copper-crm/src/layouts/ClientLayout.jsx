import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const navItems = [
  { icon: "dashboard", label: "Dashboard", to: "/client", end: true },
  { icon: "timeline", label: "Project Timeline", to: "/client/projects" },
  { icon: "video_chat", label: "Meetings", to: "/client/meetings" },
  { icon: "description", label: "Documents", to: "/client/documents" },
  { icon: "receipt_long", label: "Billing & Invoices", to: "/client/invoices" },
  { icon: "settings", label: "Settings", to: "/client/profile" },
];

const pageTitles = {
  "/client": "Dashboard",
  "/client/projects": "Project Timeline",
  "/client/meetings": "Meetings",
  "/client/documents": "Documents & Deliverables",
  "/client/invoices": "Billing & Invoices",
  "/client/profile": "Settings",
};

export default function ClientLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const name = auth.user?.name || "Client";
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const pageTitle = pageTitles[location.pathname] || "Portal";

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  function handleLogout() {
    auth.logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--cs-background)", color: "var(--cs-on-surface)" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: 256, background: "var(--cs-surface)", borderColor: "var(--cs-outline-variant)" }}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b" style={{ borderColor: "var(--cs-outline-variant)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold leading-tight" style={{ color: "var(--cs-primary)", fontFamily: "Inter, sans-serif" }}>
                The Copper Studio
              </h1>
              <p className="text-xs mt-0.5" style={{ color: "var(--cs-secondary)" }}>Client Portal</p>
            </div>
            <button
              className="lg:hidden p-1 rounded-lg"
              style={{ color: "var(--cs-secondary)" }}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                  isActive
                    ? "border-l-2 border-primary font-bold"
                    : "hover:bg-surface-container"
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? "var(--cs-primary)" : "var(--cs-secondary)",
                background: isActive ? "var(--cs-surface-container-low)" : "transparent",
                borderColor: isActive ? "var(--cs-primary)" : "transparent",
                borderLeftWidth: isActive ? 2 : 0,
              })}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, letterSpacing: "0.01em" }}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom: user + logout */}
        <div className="p-4 border-t" style={{ borderColor: "var(--cs-outline-variant)" }}>
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: "var(--cs-primary)" }}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--cs-on-surface)" }}>{name}</p>
              <p className="text-xs truncate" style={{ color: "var(--cs-secondary)" }}>{auth.user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-red-50"
            style={{ color: "var(--cs-secondary)", fontFamily: "Inter, sans-serif" }}
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header
          className="flex-shrink-0 h-16 flex items-center justify-between px-4 md:px-8 border-b z-20"
          style={{ background: "var(--cs-surface)", borderColor: "var(--cs-outline-variant)" }}
        >
          <div className="flex items-center gap-3">
            {/* Hamburger (mobile only) */}
            <button
              className="lg:hidden p-2 rounded-lg transition-colors"
              style={{ color: "var(--cs-on-surface)" }}
              onClick={() => setSidebarOpen(true)}
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>
            <h2 className="text-lg font-semibold hidden sm:block" style={{ color: "var(--cs-on-surface)", fontFamily: "Inter, sans-serif" }}>
              {pageTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <button
                className="p-2 rounded-full transition-all"
                style={{ color: "var(--cs-on-surface)" }}
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "var(--cs-error)" }} />
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border shadow-xl z-50"
                  style={{ background: "var(--cs-surface-container-lowest)", borderColor: "var(--cs-outline-variant)" }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: "var(--cs-outline-variant)" }}>
                    <p className="font-semibold text-sm" style={{ color: "var(--cs-on-surface)" }}>Notifications</p>
                  </div>
                  <div className="p-3 space-y-2">
                    {[
                      { icon: "calendar_month", text: "Meeting scheduled for tomorrow", time: "2h ago" },
                      { icon: "description", text: "New document available for review", time: "1d ago" },
                    ].map((n, i) => (
                      <div key={i} className="flex gap-3 p-2 rounded-lg transition-colors hover:bg-surface-container"
                        style={{ background: i === 0 ? "var(--cs-surface-container-low)" : "transparent" }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: "var(--cs-primary-fixed)", color: "var(--cs-primary)" }}>
                          <span className="material-symbols-outlined text-[16px]">{n.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium" style={{ color: "var(--cs-on-surface)" }}>{n.text}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--cs-secondary)" }}>{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white border"
              style={{ background: "var(--cs-primary)", borderColor: "var(--cs-outline-variant)" }}>
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ background: "var(--cs-background)" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
