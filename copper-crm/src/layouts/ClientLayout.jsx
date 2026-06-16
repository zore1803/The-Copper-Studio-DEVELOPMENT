import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ShoppingBag, FolderOpen, FileText,
  Receipt, Headphones, User, Zap, LogOut
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
    <div className="flex h-screen bg-[#F6F8FB] overflow-hidden">
      <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
          <div className="w-9 h-9 bg-[#2563EB] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
            <Zap size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">Client Portal</p>
            <p className="text-[11px] text-gray-400 mt-1">The Copper Studio</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/client"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#2563EB] text-white shadow-sm shadow-blue-200"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`
              }
            >
              <item.icon size={15} strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <div className="mb-3 rounded-2xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Signed in as</p>
            <p className="mt-1 truncate text-xs font-bold text-gray-800">{name}</p>
            <p className="truncate text-[11px] text-gray-400">{auth.user?.email}</p>
          </div>
          <button
            onClick={() => {
              auth.logout();
              navigate("/login", { replace: true });
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut size={13} />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/95 backdrop-blur border-b border-gray-200 px-6 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Authenticated portal</p>
            <p className="text-sm font-semibold text-gray-900">Welcome back, {name}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">{initials}</div>
            <span className="max-w-32 truncate text-xs font-semibold text-gray-700">{name}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
