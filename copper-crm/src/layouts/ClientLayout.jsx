import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ShoppingBag, FolderOpen, FileText,
  Receipt, Headphones, User, LogOut
} from "lucide-react";
import { useAuth } from "../auth/useAuth";

const navItems = [
  { icon: LayoutDashboard, label: "Home", to: "/client" },
  { icon: ShoppingBag, label: "My Purchases", to: "/client/purchases" },
  { icon: FolderOpen, label: "Projects Timeline", to: "/client/projects" },
  { icon: FileText, label: "Documents", to: "/client/documents" },
  { icon: Receipt, label: "Billing & History", to: "/client/invoices" },
  { icon: Headphones, label: "Support", to: "/client/support" },
  { icon: User, label: "Settings", to: "/client/profile" },
];

export default function ClientLayout() {
  const navigate = useNavigate();
  const auth = useAuth();
  const name = auth.user?.name || "Client";
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0ede4] text-[#211a17]">
      <aside className="w-64 flex-shrink-0 bg-[#eee1cf] border-r border-[#d8c2b9] flex flex-col">
        <div className="px-4 py-4 border-b border-[#d8c2b9]">
          <div className="studio-gradient overflow-hidden rounded-xl border border-black/10">
            <img src="/copper-studio-logo.jpeg" alt="Copper Studio" className="h-24 w-full object-cover" />
          </div>
          <div className="mt-3">
            <p className="text-sm font-bold leading-none text-[#211a17]">Client Portal</p>
            <p className="studio-logo-text mt-1 text-[13px] text-[#6c6355]">The Copper Studio</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/client"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#884c2d] text-white shadow-sm shadow-[#884c2d]/20"
                    : "text-[#6c6355] hover:bg-[#fff8f6]/70 hover:text-[#211a17]"
                }`
              }
            >
              <item.icon size={15} strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-[#d8c2b9]">
          <div className="mb-3 rounded-xl border border-[#d8c2b9] bg-[#fff8f6]/70 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#85736c]">Signed in as</p>
            <p className="mt-1 truncate text-xs font-bold text-[#211a17]">{name}</p>
            <p className="truncate text-[11px] text-[#6c6355]">{auth.user?.email}</p>
          </div>
          <button
            onClick={() => {
              auth.logout();
              navigate("/login", { replace: true });
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#6c6355] hover:bg-[#fff1ec] hover:text-[#884c2d] transition-all"
          >
            <LogOut size={13} />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-[#fff8f6]/90 backdrop-blur border-b border-[#d8c2b9] px-8 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#6c6355]">Authenticated portal</p>
            <p className="font-display text-lg font-bold text-[#211a17]">Welcome back, {name}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#d8c2b9] bg-white px-2 py-1">
            <div className="w-8 h-8 bg-[#884c2d] rounded-full flex items-center justify-center text-white text-[10px] font-bold">{initials}</div>
            <span className="max-w-32 truncate text-xs font-semibold text-[#211a17]">{name}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-[#f0ede4]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
