// Shared UI primitives — premium Attio/Linear aesthetic

export function Badge({ children, color = "gray" }) {
  const colors = {
    gray:   "bg-[#E5E7EB] text-[#6B7280]",
    blue:   "bg-[#FFFFFF] text-[#8D3118]",
    green:  "bg-emerald-50 text-emerald-700",
    red:    "bg-red-50 text-red-600",
    orange: "bg-amber-50 text-amber-700",
    purple: "bg-violet-50 text-violet-700",
    teal:   "bg-[#E5E7EB] text-[#1A1A1A]",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${colors[color]}`}>
      {children}
    </span>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl border border-[#6B7280] shadow-sm shadow-[#8D3118]/5 ${className}`}>
      {children}
    </div>
  );
}

export function Button({ children, variant = "primary", size = "md", onClick, className = "", disabled = false, type = "button" }) {
  const base = "inline-flex items-center gap-1.5 font-semibold rounded-xl transition-all disabled:opacity-50";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-xs", lg: "px-5 py-2.5 text-sm" };
  const variants = {
    primary:   "bg-[#8D3118] text-white hover:bg-[#6B7280] shadow-sm shadow-[#8D3118]/20",
    secondary: "bg-white text-[#1A1A1A] border border-[#6B7280] hover:bg-[#E5E7EB]",
    ghost:     "text-[#6B7280] hover:bg-[#E5E7EB]",
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
      {label && <label className="text-xs font-semibold text-[#6B7280]">{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 text-sm border border-[#6B7280] rounded-xl outline-none focus:ring-2 focus:ring-[#E5E7EB] focus:border-[#8D3118] transition-all placeholder:text-[#6B7280]"
      />
    </div>
  );
}

export function Avatar({ name, size = "md" }) {
  const sizes = { sm: "w-7 h-7 text-[10px]", md: "w-8 h-8 text-xs", lg: "w-10 h-10 text-sm" };
  const colors = ["#8D3118","#8D3118","#1A1A1A","#8D3118","#6B7280","#1A1A1A"];
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
        <h1 className="font-display text-lg font-bold text-[#1A1A1A]">{title}</h1>
        {subtitle && <p className="text-xs text-[#6B7280] mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionCard({ title, action, children, className = "" }) {
  return (
    <div className={`border border-[#6B7280] rounded-xl bg-white shadow-sm shadow-[#8D3118]/5 overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 bg-[#FFFFFF] border-b border-[#E5E7EB]">
          {title && <p className="font-display text-sm font-bold text-[#1A1A1A]">{title}</p>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
