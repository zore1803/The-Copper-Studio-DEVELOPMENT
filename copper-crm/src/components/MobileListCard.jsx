import { ChevronLeft, ChevronRight } from "lucide-react";

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

// Mobile-only pagination footer matching the reference design — a
// Previous/Next button pair, then a centered "Showing X / Y" pill below.
// Desktop keeps its own numbered-page-buttons pagination unchanged.
export function MobileListPagination({ page, totalPages, onPrev, onNext }) {
  return (
    <div className="mt-3 rounded-xl border border-[#E1E4EA] bg-white p-4 sm:hidden">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onPrev}
          disabled={page <= 1}
          className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#f3f4f6] text-sm font-semibold text-[#374151] transition-colors hover:bg-[#e5e7eb] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={15} /> Previous
        </button>
        <button
          onClick={onNext}
          disabled={page >= totalPages}
          className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#111827] text-sm font-semibold text-white transition-colors hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next <ChevronRight size={15} />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-[#6b7280]">
        SHOWING
        <span className="flex h-7 min-w-[28px] items-center justify-center rounded-full bg-[#8D3118] px-2 text-xs font-bold text-white">
          {page} / {totalPages}
        </span>
      </div>
    </div>
  );
}
