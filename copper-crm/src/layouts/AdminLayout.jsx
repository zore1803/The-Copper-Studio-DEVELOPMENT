import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell, Building2, ChevronRight, Command, FileSignature, FileText,
  FolderKanban, LayoutDashboard, LogOut, MessageCircle, ReceiptText,
  Search, Settings, ShieldCheck, ShoppingCart, Tag, UserRound, Users,
  Wallet
} from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { companies, contacts, coupons, invoices, leads, orders, projects } from "../data/mockData";

const financeItems = [
  { icon: ShoppingCart, to: "/admin/orders", label: "Orders" },
  { icon: ReceiptText, to: "/admin/invoices", label: "Invoices" },
];

const serviceItems = [
  { icon: Tag, to: "/admin/services/coupon-generator", label: "Coupon Codes" },
  { icon: FileSignature, to: "/admin/services/proposal-generator", label: "Proposals" },
  { icon: MessageCircle, to: "/admin/services/communications", label: "Communication" },
];

const navItems = [
  { icon: LayoutDashboard, to: "/admin", label: "Overview", end: true },
  { icon: FileText, to: "/admin/analytics", label: "Analytics" },
  { icon: Building2, to: "/admin/companies", label: "Companies" },
  { icon: Users, to: "/admin/contacts", label: "Contacts" },
  { icon: FolderKanban, to: "/admin/projects", label: "Projects" },
  { icon: Wallet, to: "/admin/orders", label: "Finance", children: financeItems },
  { icon: Tag, to: "/admin/services/coupon-generator", label: "Services", children: serviceItems },
  { icon: FileSignature, to: "/admin/reports", label: "Reports" },
  { icon: Settings, to: "/admin/settings", label: "Settings" },
];

const pageNames = {
  "/admin": "Overview",
  "/admin/analytics": "Analytics",
  "/admin/companies": "Companies",
  "/admin/contacts": "Contacts",
  "/admin/leads": "Leads",
  "/admin/deals": "Deals",
  "/admin/projects": "Projects",
  "/admin/kanban": "Kanban Board",
  "/admin/tasks": "Tasks",
  "/admin/orders": "Orders",
  "/admin/invoices": "Invoices",
  "/admin/coupons": "Coupons",
  "/admin/reports": "Reports",
  "/admin/services": "Services",
  "/admin/services/coupon-generator": "Coupon Code Generator",
  "/admin/services/proposal-generator": "Proposal Generator",
  "/admin/services/communications": "Communication",
  "/admin/proposal-generator": "Proposal Generator",
  "/admin/database": "Database Tables",
  "/admin/settings": "Settings",
};

const customHeaderRoutes = new Set([
  "/admin",
  "/admin/contacts",
  "/admin/projects",
  "/admin/kanban",
  "/admin/orders",
  "/admin/invoices",
  "/admin/settings",
]);

// Nested company/project detail routes render their own breadcrumb + hero
// header, so they need a pattern match instead of an exact path lookup.
const customHeaderPatterns = [/^\/admin\/companies\/[^/]+/];

function hasCustomHeader(pathname) {
  return customHeaderRoutes.has(pathname) || customHeaderPatterns.some((pattern) => pattern.test(pathname));
}

const searchablePages = [
  { label: "Overview", to: "/admin", keywords: "dashboard overview gantt chart projects timeline" },
  { label: "Analytics", to: "/admin/analytics", keywords: "revenue orders graph payment rate delayed status package tier" },
  { label: "Companies", to: "/admin/companies", keywords: "accounts gstin company industry client business" },
  { label: "Contacts", to: "/admin/contacts", keywords: "people email phone designation client contact" },
  { label: "Leads", to: "/admin/leads", keywords: "leads prospects sales pipeline enquiry" },
  { label: "Deals", to: "/admin/deals", keywords: "deals opportunity pipeline value stage" },
  { label: "Projects", to: "/admin/projects", keywords: "project delivery timeline active orders" },
  { label: "Kanban Board", to: "/admin/kanban", keywords: "tasks board drag status todo progress done" },
  { label: "Orders", to: "/admin/orders", keywords: "payment portal purchase package checkout active orders" },
  { label: "Invoices", to: "/admin/invoices", keywords: "billing invoice gst payment" },
  { label: "Coupon Code Generator", to: "/admin/services/coupon-generator", keywords: "coupon code discount services redeemed expired revoked" },
  { label: "Proposal Generator", to: "/admin/services/proposal-generator", keywords: "proposal generator pdf client quote draft send" },
  { label: "Communication", to: "/admin/services/communications", keywords: "email whatsapp templates welcome reminder proposal payment notification" },
  { label: "Reports", to: "/admin/reports", keywords: "reports export sales revenue delivery" },
  { label: "Settings", to: "/admin/settings", keywords: "profile password onboarding admin settings" },
];

const recordIndex = [
  ...companies.map((c) => ({ type: "Company", label: c.name, sublabel: c.industry, to: `/admin/companies/${c.id}` })),
  ...contacts.map((c) => ({ type: "Contact", label: c.name, sublabel: c.company, to: "/admin/contacts", query: c.name })),
  ...projects.map((p) => ({ type: "Project", label: p.name, sublabel: p.client, to: `/admin/companies/${p.companyId}/projects/${p.id}` })),
  ...Object.values(leads).flat().map((l) => ({ type: "Lead", label: l.name, sublabel: l.company, to: "/admin/leads", query: l.name })),
  ...orders.map((o) => ({ type: "Order", label: o.id, sublabel: o.customer, to: "/admin/orders", query: o.customer })),
  ...invoices.map((i) => ({ type: "Invoice", label: i.id, sublabel: i.client, to: "/admin/invoices", query: i.client })),
  ...coupons.map((c) => ({ type: "Coupon", label: c.code, sublabel: c.value, to: "/admin/coupons", query: c.code })),
];

function SidebarLink({ item, compact = false }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-lg px-4 py-2 text-[13px] font-semibold transition-all ${
          isActive
            ? "bg-[#fff8f6] text-[#884c2d] after:absolute after:left-0 after:h-4 after:w-1 after:rounded-full after:bg-[#884c2d]"
            : "text-[#6c6355] hover:bg-[#fff8f6]/60 hover:text-[#211a17]"
        } ${compact ? "ml-8 py-1.5 text-xs" : ""}`
      }
    >
      <item.icon size={compact ? 13 : 16} strokeWidth={1.9} className="shrink-0" />
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
  const pageTitle = pageNames[location.pathname] || "Overview";
  const usesCustomHeader = hasCustomHeader(location.pathname);
  const name = auth.user?.name || "Rohit Kumar";
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

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
    <div className="flex h-screen overflow-hidden bg-[#f0ede4] text-[#211a17]">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col border-r border-[#d8c2b9] bg-[#eee1cf] py-8">
        <div className="mb-10 px-8">
          <p className="studio-logo-text text-xl text-[#211a17]">The Copper Studio</p>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6c6355]/70">Creative Atelier</p>
        </div>

        <nav className="flex-1 space-y-1 px-4">
          {navItems.map((item) => {
            const childActive = item.children?.some((child) => location.pathname === child.to || location.pathname.startsWith(`${child.to}/`));
            return (
              <div key={item.to}>
                <SidebarLink item={item} />
                {item.children && childActive && (
                  <div className="mt-1 space-y-1">
                    {item.children.map((child) => <SidebarLink key={child.to} item={child} compact />)}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="mt-8 border-t border-[#d8c2b9] px-8 pt-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[#884c2d] text-sm font-bold text-white">{initials}</div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-[#211a17]">{name}</p>
              <p className="truncate text-[11px] text-[#6c6355]">Creative Director</p>
            </div>
          </div>
          <button
            onClick={() => {
              auth.logout();
              navigate("/login", { replace: true });
            }}
            className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-lg text-xs font-bold text-[#6c6355] transition-colors hover:bg-[#fff8f6] hover:text-[#884c2d]"
          >
            <LogOut size={14} />
            Log out
          </button>
        </div>
      </aside>

      <div className="ml-[280px] flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#d8c2b9] bg-[#f0ede4]/80 px-10 backdrop-blur-md">
          <div className="relative w-full max-w-md">
            <div className="flex h-11 items-center gap-3 rounded-lg border border-[#d8c2b9]/70 bg-[#fff1ec] px-4 transition-all focus-within:border-[#884c2d] focus-within:bg-[#fff8f6] focus-within:ring-1 focus-within:ring-[#884c2d]">
              <Search size={16} className="text-[#6c6355]" />
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
                className="w-full border-none bg-transparent text-sm outline-none placeholder:text-[#85736c]/60"
                placeholder="Search projects, clients..."
              />
              <span className="hidden items-center gap-1 rounded-md border border-[#d8c2b9] bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#85736c] md:flex">
                <Command size={10} /> K
              </span>
            </div>
            {searchFocused && searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-13 z-40 mt-2 overflow-hidden rounded-xl border border-[#d8c2b9] bg-[#fff8f6] shadow-[0_20px_40px_rgba(51,20,5,0.10)]">
                {searchResults.length ? (
                  <div className="py-1.5">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result.label}`}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => openSearchResult(result)}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm font-semibold text-[#211a17] transition-colors hover:bg-[#fff1ec] hover:text-[#884c2d]"
                      >
                        <span className="min-w-0">
                          <span className="block truncate">{result.label}</span>
                          {result.sublabel && <span className="block truncate text-xs font-medium text-[#6c6355]">{result.sublabel}</span>}
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          <span className="rounded-md bg-[#ede0db] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6c6355]">{result.type}</span>
                          <ChevronRight size={14} />
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-3 text-xs font-semibold text-[#6c6355]">No matching CRM page found.</div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-5">
            <button className="relative rounded-full p-2 text-[#211a17] transition-colors hover:bg-[#fff8f6] hover:text-[#884c2d]">
              <Bell size={19} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#884c2d]" />
            </button>
            <div className="h-6 w-px bg-[#d8c2b9]" />
            <button className="flex items-center gap-2 rounded-full border border-[#d8c2b9] bg-[#fff8f6] px-2 py-1 text-xs font-bold text-[#211a17]">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-[#884c2d] text-[10px] text-white">{initials}</div>
              <UserRound size={14} className="text-[#6c6355]" />
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-[#f0ede4] p-10">
          {!usesCustomHeader && (
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6c6355]">
                <ShieldCheck size={12} className="mr-1 inline text-[#026769]" />
                Authenticated workspace
              </p>
              <h1 className="font-display text-3xl font-bold tracking-tight text-[#211a17]">{pageTitle}</h1>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
