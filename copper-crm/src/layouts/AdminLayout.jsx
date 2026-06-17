import { useMemo, useState, useRef, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart2, Bell, Building2, ChevronDown, ChevronLeft, ChevronRight,
  FileSignature, FileText, FolderKanban, LayoutDashboard, Layers,
  LogOut, MessageCircle, Plus, ReceiptText, Search, Settings,
  ShoppingCart, Tag, UserRound, Users, Wallet, BookOpen,
  TrendingUp
} from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { companies, contacts, coupons, invoices, leads, orders, projects } from "../data/mockData";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, to: "/admin", label: "Dashboard", end: true },
    ],
  },
  {
    label: "CRM",
    items: [
      { icon: Building2, to: "/admin/companies", label: "Companies" },
      { icon: Users, to: "/admin/contacts", label: "Contacts" },
      { icon: UserRound, to: "/admin/leads", label: "Leads" },
      { icon: TrendingUp, to: "/admin/deals", label: "Deals" },
    ],
  },
  {
    label: "Projects",
    items: [
      { icon: FolderKanban, to: "/admin/projects", label: "Projects" },
      { icon: Layers, to: "/admin/client-projects", label: "Client Projects" },
      { icon: LayoutDashboard, to: "/admin/kanban", label: "Kanban Board" },
    ],
  },
  {
    label: "Finance",
    items: [
      { icon: ShoppingCart, to: "/admin/orders", label: "Orders" },
      { icon: ReceiptText, to: "/admin/invoices", label: "Invoices" },
      { icon: Wallet, to: "/admin/coupons", label: "Coupons" },
    ],
  },
  {
    label: "Services",
    items: [
      { icon: Tag, to: "/admin/services/coupon-generator", label: "Coupon Codes" },
      { icon: FileSignature, to: "/admin/services/proposal-generator", label: "Proposals" },
      { icon: MessageCircle, to: "/admin/services/communications", label: "Communication" },
    ],
  },
  {
    label: "System",
    items: [
      { icon: BarChart2, to: "/admin/analytics", label: "Analytics" },
      { icon: BookOpen, to: "/admin/reports", label: "Reports" },
      { icon: Settings, to: "/admin/settings", label: "Settings" },
    ],
  },
];

const pageNames = {
  "/admin": "Dashboard",
  "/admin/analytics": "Analytics",
  "/admin/companies": "Companies",
  "/admin/contacts": "Contacts",
  "/admin/leads": "Leads",
  "/admin/deals": "Deals",
  "/admin/projects": "Projects",
  "/admin/client-projects": "Client Projects",
  "/admin/kanban": "Kanban Board",
  "/admin/tasks": "Tasks",
  "/admin/orders": "Orders",
  "/admin/invoices": "Invoices",
  "/admin/coupons": "Coupons",
  "/admin/reports": "Reports",
  "/admin/services/coupon-generator": "Coupon Generator",
  "/admin/services/proposal-generator": "Proposal Generator",
  "/admin/services/communications": "Communication",
  "/admin/database": "Database",
  "/admin/settings": "Settings",
};

const searchablePages = [
  { label: "Dashboard", to: "/admin", keywords: "dashboard overview revenue projects" },
  { label: "Analytics", to: "/admin/analytics", keywords: "revenue orders graph payment analytics" },
  { label: "Companies", to: "/admin/companies", keywords: "accounts gstin company industry client business" },
  { label: "Contacts", to: "/admin/contacts", keywords: "people email phone designation client contact" },
  { label: "Leads", to: "/admin/leads", keywords: "leads prospects sales pipeline enquiry" },
  { label: "Deals", to: "/admin/deals", keywords: "deals opportunity pipeline value stage" },
  { label: "Projects", to: "/admin/projects", keywords: "project delivery timeline active orders" },
  { label: "Kanban Board", to: "/admin/kanban", keywords: "tasks board drag status todo progress done" },
  { label: "Orders", to: "/admin/orders", keywords: "payment portal purchase package checkout" },
  { label: "Invoices", to: "/admin/invoices", keywords: "billing invoice gst payment" },
  { label: "Coupon Generator", to: "/admin/services/coupon-generator", keywords: "coupon code discount" },
  { label: "Proposal Generator", to: "/admin/services/proposal-generator", keywords: "proposal pdf client" },
  { label: "Communication", to: "/admin/services/communications", keywords: "email whatsapp templates" },
  { label: "Settings", to: "/admin/settings", keywords: "profile password admin settings" },
];

const recordIndex = [
  ...companies.map((c) => ({ type: "Company", label: c.name, sublabel: c.industry, to: `/admin/companies/${c.id}` })),
  ...contacts.map((c) => ({ type: "Contact", label: c.name, sublabel: c.company, to: "/admin/contacts" })),
  ...projects.map((p) => ({ type: "Project", label: p.name, sublabel: p.client, to: `/admin/companies/${p.companyId}/projects/${p.id}` })),
  ...orders.map((o) => ({ type: "Order", label: o.id, sublabel: o.customer, to: "/admin/orders" })),
  ...invoices.map((i) => ({ type: "Invoice", label: i.id, sublabel: i.client, to: "/admin/invoices" })),
];

function getBreadcrumbs(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = [{ label: "Dashboard", to: "/admin" }];
  let path = "";
  for (const seg of segments.slice(1)) {
    path += "/" + seg;
    const fullPath = "/admin" + path;
    const name = pageNames[fullPath] || (seg.length > 8 ? seg.slice(0, 8) + "…" : seg.charAt(0).toUpperCase() + seg.slice(1));
    crumbs.push({ label: name, to: fullPath });
  }
  return crumbs;
}

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

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef(null);

  const name = auth.user?.name || "Admin";
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    const recordMatches = recordIndex
      .filter((r) => `${r.label} ${r.sublabel || ""}`.toLowerCase().includes(query))
      .slice(0, 5);
    const pageMatches = searchablePages
      .filter((p) => `${p.label} ${p.keywords}`.toLowerCase().includes(query))
      .map((p) => ({ type: "Page", label: p.label, to: p.to }))
      .slice(0, 5 - recordMatches.length);
    return [...recordMatches, ...pageMatches];
  }, [searchQuery]);

  function openResult(result) {
    navigate(result.to);
    setSearchQuery("");
    setSearchFocused(false);
  }

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sidebarW = collapsed ? 64 : 240;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f6fa]">
      {/* Sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-40 flex flex-col bg-[#111827] transition-all duration-200"
        style={{ width: sidebarW }}
      >
        {/* Logo */}
        <div className={`flex items-center border-b border-white/8 ${collapsed ? "justify-center px-0 py-5" : "px-5 py-5"}`}>
          {collapsed ? (
            <div className="h-8 w-8 rounded-lg bg-[#884c2d] flex items-center justify-center text-white font-bold text-sm">CS</div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 shrink-0 rounded-lg bg-[#884c2d] flex items-center justify-center text-white font-bold text-sm">CS</div>
              <div className="min-w-0">
                <p className="text-white text-sm font-bold truncate">The Copper Studio</p>
                <p className="text-[#6b7280] text-[10px] truncate">Creative Atelier</p>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-5 mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem key={item.to} item={item} collapsed={collapsed} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom: user + logout + collapse toggle */}
        <div className={`border-t border-white/8 py-3 ${collapsed ? "px-1" : "px-3"}`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-2 py-2 mb-2 rounded-lg hover:bg-white/6 cursor-default">
              <div className="h-8 w-8 shrink-0 rounded-full bg-[#884c2d] flex items-center justify-center text-white text-xs font-bold">{initials}</div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-semibold truncate">{name}</p>
                <p className="text-[#6b7280] text-[10px] truncate">{auth.user?.role || "Admin"}</p>
              </div>
              <button
                onClick={() => { auth.logout(); navigate("/login", { replace: true }); }}
                className="text-[#6b7280] hover:text-white transition-colors"
                title="Log out"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className={`flex items-center justify-center w-full rounded-lg py-2 text-[#6b7280] hover:bg-white/8 hover:text-white transition-all ${collapsed ? "" : "gap-2"}`}
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
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#e5e7eb] bg-white px-6 gap-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-sm min-w-0 flex-shrink-0">
            {breadcrumbs.map((crumb, i) => (
              <div key={crumb.to} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight size={13} className="text-[#9ca3af] shrink-0" />}
                {i < breadcrumbs.length - 1 ? (
                  <button
                    onClick={() => navigate(crumb.to)}
                    className="text-[#6b7280] hover:text-[#111827] font-medium transition-colors whitespace-nowrap"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-[#111827] font-semibold whitespace-nowrap">{crumb.label}</span>
                )}
              </div>
            ))}
          </nav>

          {/* Right: Search + actions */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            {/* Search */}
            <div className="relative w-64">
              <div className="flex h-9 items-center gap-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 focus-within:border-[#884c2d] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#884c2d]/20 transition-all">
                <Search size={14} className="text-[#9ca3af] shrink-0" />
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") openResult(searchResults[0]);
                    if (e.key === "Escape") { setSearchQuery(""); setSearchFocused(false); }
                  }}
                  placeholder="Search Companies, Deals, Contacts"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#9ca3af]"
                />
                <span className="hidden md:flex items-center gap-0.5 rounded border border-[#e5e7eb] bg-white px-1 py-0.5 text-[10px] font-bold text-[#9ca3af]">⌘K</span>
              </div>
              {searchFocused && searchQuery.trim() && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-lg">
                  {searchResults.length ? (
                    <div className="py-1">
                      {searchResults.map((r) => (
                        <button
                          key={`${r.type}-${r.label}`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => openResult(r)}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-[#f9fafb]"
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-[#111827] truncate">{r.label}</span>
                            {r.sublabel && <span className="block text-xs text-[#6b7280] truncate">{r.sublabel}</span>}
                          </span>
                          <span className="shrink-0 rounded bg-[#f3f4f6] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#6b7280]">{r.type}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-3 text-xs text-[#6b7280]">No results found.</div>
                  )}
                </div>
              )}
            </div>

            {/* Bell */}
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#6b7280] hover:text-[#111827] hover:bg-[#f9fafb] transition-colors">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#884c2d]" />
            </button>

            {/* + New */}
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[#884c2d] text-white hover:bg-[#6f381a] transition-colors shadow-sm">
              <Plus size={16} />
            </button>

            {/* Avatar */}
            <div className="h-9 w-9 rounded-full bg-[#884c2d] flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:ring-2 hover:ring-[#884c2d]/30 transition-all">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[#f5f6fa]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
