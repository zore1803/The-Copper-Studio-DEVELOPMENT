// Shared mobile card for every admin list page — desktop keeps its table,
// this is the sm:hidden replacement so a row's details read as a simple
// stacked card instead of a cramped horizontal-scrolling table on a phone.
export const CARD_TONES = {
  view: "bg-blue-50 text-blue-700 hover:bg-blue-100",
  edit: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  delete: "bg-red-50 text-red-600 hover:bg-red-100",
  neutral: "bg-[#f3f4f6] text-[#374151] hover:bg-[#e5e7eb]",
};

export default function MobileListCard({ title, subtitle, badge, fields = [], actions = [], onClick }) {
  return (
    <div
      className={`rounded-xl border border-[#E1E4EA] bg-white p-4 ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#111827] truncate">{title}</p>
          {subtitle && <p className="text-xs text-[#6b7280] truncate mt-0.5">{subtitle}</p>}
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>

      {fields.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[#f3f4f6] pt-3">
          {fields.map((f) => (
            <div key={f.label} className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af]">{f.label}</p>
              <p className="mt-0.5 text-sm font-semibold text-[#111827] truncate">{f.value ?? "—"}</p>
            </div>
          ))}
        </div>
      )}

      {actions.length > 0 && (
        <div className="mt-3 grid gap-2 border-t border-[#f3f4f6] pt-3" style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}>
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={(e) => { e.stopPropagation(); a.onClick(); }}
              className={`flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors ${a.tone || CARD_TONES.neutral}`}
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
