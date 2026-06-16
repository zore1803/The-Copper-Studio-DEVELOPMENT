// Shared UI primitives — premium Attio/Linear aesthetic

export function Badge({ children, color = "gray" }) {
  const colors = {
    gray:   "bg-gray-100 text-gray-600",
    blue:   "bg-blue-50 text-blue-700",
    green:  "bg-emerald-50 text-emerald-700",
    red:    "bg-red-50 text-red-600",
    orange: "bg-amber-50 text-amber-700",
    purple: "bg-violet-50 text-violet-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${colors[color]}`}>
      {children}
    </span>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

export function Button({ children, variant = "primary", size = "md", onClick, className = "", disabled = false, type = "button" }) {
  const base = "inline-flex items-center gap-1.5 font-semibold rounded-xl transition-all disabled:opacity-50";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-xs", lg: "px-5 py-2.5 text-sm" };
  const variants = {
    primary:   "bg-[#2563EB] text-white hover:bg-blue-700 shadow-sm shadow-blue-200",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
    ghost:     "text-gray-500 hover:bg-gray-100",
    danger:    "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100",
  };
  return (
    <button type={type} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Input({ label, placeholder, value, onChange, type = "text", className = "" }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-xs font-semibold text-gray-600">{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder-gray-300"
      />
    </div>
  );
}

export function Avatar({ name, size = "md" }) {
  const sizes = { sm: "w-7 h-7 text-[10px]", md: "w-8 h-8 text-xs", lg: "w-10 h-10 text-sm" };
  const colors = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ec4899","#6366f1"];
  const idx = name ? name.charCodeAt(0) % colors.length : 0;
  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`} style={{ background: colors[idx] }}>
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    Paid: "green", Pending: "orange", Failed: "red", Unpaid: "orange", Overdue: "red",
    Active: "green", Inactive: "gray", Prospect: "blue", Expired: "red",
    Won: "green", Lost: "red", "New Lead": "blue", Contacted: "purple",
    Qualified: "blue", "Proposal Sent": "orange", Negotiation: "purple",
  };
  return <Badge color={map[status] || "gray"}>{status}</Badge>;
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h1 className="text-base font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionCard({ title, action, children, className = "" }) {
  return (
    <div className={`border border-gray-200 rounded-2xl bg-white ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          {title && <p className="text-sm font-semibold text-gray-900">{title}</p>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
