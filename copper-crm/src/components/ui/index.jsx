// Shared UI primitives — premium Attio/Linear aesthetic

export function Badge({ children, color = "gray" }) {
  const colors = {
    gray:   "bg-[#ede0db] text-[#6c6355]",
    blue:   "bg-[#fff1ec] text-[#C55418]",
    green:  "bg-emerald-50 text-emerald-700",
    red:    "bg-red-50 text-red-600",
    orange: "bg-amber-50 text-amber-700",
    purple: "bg-violet-50 text-violet-700",
    teal:   "bg-[#d7efeb] text-[#026769]",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${colors[color]}`}>
      {children}
    </span>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl border border-[#d8c2b9] shadow-sm shadow-[#C55418]/5 ${className}`}>
      {children}
    </div>
  );
}

export function Button({ children, variant = "primary", size = "md", onClick, className = "", disabled = false, type = "button" }) {
  const base = "inline-flex items-center gap-1.5 font-semibold rounded-xl transition-all disabled:opacity-50";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-xs", lg: "px-5 py-2.5 text-sm" };
  const variants = {
    primary:   "bg-[#C55418] text-white hover:bg-[#9A4113] shadow-sm shadow-[#C55418]/20",
    secondary: "bg-white text-[#211a17] border border-[#d8c2b9] hover:bg-[#fff1ec]",
    ghost:     "text-[#6c6355] hover:bg-[#fff1ec]",
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
      {label && <label className="text-xs font-semibold text-[#6c6355]">{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 text-sm border border-[#d8c2b9] rounded-xl outline-none focus:ring-2 focus:ring-[#F5D5C6] focus:border-[#C55418] transition-all placeholder:text-[#b49f96]"
      />
    </div>
  );
}

export function Avatar({ name, size = "md" }) {
  const sizes = { sm: "w-7 h-7 text-[10px]", md: "w-8 h-8 text-xs", lg: "w-10 h-10 text-sm" };
  const colors = ["#C55418","#9A4113","#026769","#C55418","#665d50","#362f2c"];
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
        <h1 className="font-display text-lg font-bold text-[#211a17]">{title}</h1>
        {subtitle && <p className="text-xs text-[#6c6355] mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionCard({ title, action, children, className = "" }) {
  return (
    <div className={`border border-[#d8c2b9] rounded-xl bg-white shadow-sm shadow-[#C55418]/5 overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 bg-[#fff1ec] border-b border-[#f3e5e0]">
          {title && <p className="font-display text-sm font-bold text-[#211a17]">{title}</p>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
