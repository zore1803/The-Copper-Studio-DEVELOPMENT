import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, Users,
  FolderKanban, FileText, FileSignature, Settings, Plus, Table2, Tag,
  Search, Zap, LogOut, ChevronRight, ShieldCheck, Command
} from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { companies, contacts, projects, leads, orders, invoices, coupons } from "../data/mockData";

const navGroups = [
  {
    label: "Admin",
    items: [
      { icon: LayoutDashboard, to: "/admin", label: "Home - Gantt", end: true },
      { icon: FileText, to: "/admin/analytics", label: "Analytics" },
      { icon: Building2, to: "/admin/companies", label: "Companies" },
      { icon: Users, to: "/admin/contacts", label: "Contacts" },
      { icon: FolderKanban, to: "/admin/projects", label: "Projects" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { icon: FileText, to: "/admin/folders", label: "Folders" },
      { icon: Table2, to: "/admin/database", label: "Database Tables" },
      { icon: Settings, to: "/admin/settings", label: "Settings" },
    ],
  },
  {
    label: "Services",
    items: [
      { icon: Tag, to: "/admin/services/coupon-generator", label: "Coupon Code Generator" },
      { icon: FileSignature, to: "/admin/services/proposal-generator", label: "Proposal Generator" },
    ],
  },
];

const pageNames = {
  "/admin": "Home - Gantt", "/admin/analytics": "Analytics", "/admin/companies": "Companies",
  "/admin/contacts": "Contacts", "/admin/leads": "Leads",
  "/admin/deals": "Deals", "/admin/projects": "Projects",
  "/admin/kanban": "Kanban Board", "/admin/tasks": "Tasks",
  "/admin/orders": "Orders", "/admin/invoices": "Invoices",
  "/admin/coupons": "Coupons", "/admin/email-templates": "Email Templates",
  "/admin/whatsapp": "WhatsApp Templates", "/admin/reports": "Reports",
  "/admin/services": "Services",
  "/admin/services/coupon-generator": "Coupon Code Generator",
  "/admin/services/proposal-generator": "Proposal Generator",
  "/admin/proposal-generator": "Proposal Generator",
  "/admin/folders": "Folders", "/admin/database": "Database Tables",
  "/admin/settings": "Settings",
};

const searchablePages = [
  { label: "Home - Gantt", to: "/admin", keywords: "dashboard home gantt chart projects timeline" },
  { label: "Analytics", to: "/admin/analytics", keywords: "revenue orders graph payment rate delayed status package tier" },
  { label: "Companies", to: "/admin/companies", keywords: "accounts gstin company industry client business" },
  { label: "Contacts", to: "/admin/contacts", keywords: "people email phone designation client contact" },
  { label: "Leads", to: "/admin/leads", keywords: "leads prospects sales pipeline enquiry" },
  { label: "Deals", to: "/admin/deals", keywords: "deals opportunity pipeline value stage" },
  { label: "Projects", to: "/admin/projects", keywords: "project delivery timeline active orders" },
  { label: "Kanban Board", to: "/admin/kanban", keywords: "tasks board drag status todo progress done" },
  { label: "Tasks", to: "/admin/tasks", keywords: "task owner priority deadline edit" },
  { label: "Orders", to: "/admin/orders", keywords: "payment portal purchase package checkout active orders" },
  { label: "Invoices", to: "/admin/invoices", keywords: "billing invoice gst payment" },
  { label: "Coupons", to: "/admin/coupons", keywords: "coupon discount code redeemed expired revoked" },
  { label: "Coupon Code Generator", to: "/admin/services/coupon-generator", keywords: "coupon code discount services redeemed expired revoked" },
  { label: "Proposal Generator", to: "/admin/services/proposal-generator", keywords: "proposal generator pdf client quote draft send" },
  { label: "Folders", to: "/admin/folders", keywords: "documents files proposal invoice folders" },
  { label: "Database Tables", to: "/admin/database", keywords: "mongo database tables collections records" },
  { label: "Settings", to: "/admin/settings", keywords: "profile password onboarding admin settings" },
];

const recordIndex = [
  ...companies.map((c) => ({ type: "Company", label: c.name, sublabel: c.industry, to: "/admin/companies", query: c.name })),
  ...contacts.map((c) => ({ type: "Contact", label: c.name, sublabel: c.company, to: "/admin/contacts", query: c.name })),
  ...projects.map((p) => ({ type: "Project", label: p.name, sublabel: p.client, to: "/admin/projects", query: p.name })),
  ...Object.values(leads).flat().map((l) => ({ type: "Lead", label: l.name, sublabel: l.company, to: "/admin/leads", query: l.name })),
  ...orders.map((o) => ({ type: "Order", label: o.id, sublabel: o.customer, to: "/admin/orders", query: o.customer })),
  ...invoices.map((i) => ({ type: "Invoice", label: i.id, sublabel: i.client, to: "/admin/invoices", query: i.client })),
  ...coupons.map((c) => ({ type: "Coupon", label: c.code, sublabel: c.value, to: "/admin/coupons", query: c.code })),
];

function SidebarLink({ item }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `group flex h-9 items-center gap-3 rounded-lg px-3 text-[13px] font-semibold transition-all ${
          isActive
            ? "bg-[#2563EB] text-white shadow-sm shadow-blue-200"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        }`
      }
    >
      <item.icon size={16} strokeWidth={1.9} className="shrink-0" />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const pageTitle = pageNames[location.pathname] || "Dashboard";
  const initials = auth.user?.name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "SA";
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    const recordMatches = recordIndex
      .filter((record) => `${record.label} ${record.sublabel || ""}`.toLowerCase().includes(query))
      .slice(0, 6);
    const pageMatches = searchablePages
      .filter((page) => `${page.label} ${page.keywords}`.toLowerCase().includes(query))
      .map((page) => ({ type: "Page", label: page.label, to: page.to }))
      .slice(0, 6 - recordMatches.length);
    return [...recordMatches, ...pageMatches];
  }, [searchQuery]);

  function openSearchResult(result) {
    if (!result) return;
    navigate(result.to, result.query ? { state: { query: result.query } } : undefined);
    setSearchQuery("");
    setSearchFocused(false);
  }

  return (
    <div className="flex h-screen bg-[#F5F7FA] overflow-hidden text-gray-950">
      <aside className="w-[248px] shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="h-16 px-4 flex items-center gap-3 border-b border-gray-100">
          <div className="h-10 w-10 rounded-xl bg-[#2563EB] text-white grid place-items-center shadow-lg shadow-blue-100">
            <Zap size={17} strokeWidth={2.4} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight text-gray-950">DataCircles CRM</p>
            <p className="text-[11px] font-medium text-gray-400">SuperAdmin console</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-5">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-300">{group.label}</p>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <SidebarLink key={item.to} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="border-t border-gray-100 p-3">
          <div className="mb-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gray-950 text-white grid place-items-center text-[10px] font-bold">{initials}</div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-gray-900">{auth.user?.name || "Super Admin"}</p>
                <p className="truncate text-[11px] text-gray-400">{auth.user?.email}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              auth.logout();
              navigate("/login", { replace: true });
            }}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg text-xs font-bold text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={14} />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center px-5 gap-4 border-b border-gray-200 bg-white/95 backdrop-blur shrink-0">
          <div className="min-w-[180px]">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <ShieldCheck size={12} className="text-emerald-500" />
              Authenticated workspace
            </p>
            <h1 className="text-base font-bold text-gray-950">{pageTitle}</h1>
          </div>

          <div className="relative flex-1 max-w-xl">
            <div className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
              <Search size={15} className="text-gray-400 shrink-0" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") openSearchResult(searchResults[0]);
                  if (event.key === "Escape") {
                    setSearchQuery("");
                    setSearchFocused(false);
                  }
                }}
                className="w-full bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
                placeholder="Search companies, contacts, projects, folders"
              />
              <div className="hidden md:flex items-center gap-1 rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-gray-400">
                <Command size={10} />
                K
              </div>
            </div>
            {searchFocused && searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl shadow-gray-200/70">
                {searchResults.length ? (
                  <div className="py-1.5">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result.label}`}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => openSearchResult(result)}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm font-semibold text-gray-700 transition-colors hover:bg-blue-50 hover:text-[#2563EB]"
                      >
                        <span className="min-w-0">
                          <span className="block truncate">{result.label}</span>
                          {result.sublabel && <span className="block truncate text-xs font-medium text-gray-400">{result.sublabel}</span>}
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">{result.type}</span>
                          <ChevronRight size={14} className="text-gray-300" />
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-3 text-xs font-semibold text-gray-400">No matching CRM page found.</div>
                )}
              </div>
            )}
          </div>

          <button onClick={() => navigate("/admin/orders")} className="hidden xl:flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 transition-colors hover:border-emerald-200 hover:bg-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-emerald-700">Payment to portal flow active</span>
            <span className="text-xs font-bold text-[#2563EB] flex items-center gap-1">
              Orders <ChevronRight size={13} />
            </span>
          </button>

          <button onClick={() => navigate("/admin/services/coupon-generator")} className="flex h-10 items-center gap-2 bg-[#2563EB] text-white text-xs font-bold px-4 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
            <Plus size={14} strokeWidth={2.5} />
            New Service
          </button>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto bg-[#F5F7FA]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
