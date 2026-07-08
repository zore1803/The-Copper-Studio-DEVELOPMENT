import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";

// Shared mobile card for every admin list page — desktop keeps its table,
// this is the sm:hidden replacement so a row's details read as a simple
// stacked card instead of a cramped horizontal-scrolling table on a phone.
export const CARD_TONES = {
  view: "bg-blue-50 text-blue-700 hover:bg-blue-100",
  edit: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  delete: "bg-red-50 text-red-600 hover:bg-red-100",
  neutral: "bg-[#f3f4f6] text-[#374151] hover:bg-[#e5e7eb]",
};

// Optional "..." menu next to the action buttons — e.g. jumping straight to
// a specific detail tab (Projects/Contacts/Invoices/...) instead of opening
// the record and hunting for the tab switcher on a narrow screen.
function CardMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#f3f4f6]"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white py-1 shadow-lg">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={(e) => { e.stopPropagation(); setOpen(false); item.onClick(); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#374151] hover:bg-[#f9fafb]"
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MobileListCard({ title, subtitle, badge, fields = [], actions = [], menuItems = [], onClick }) {
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

      {(actions.length > 0 || menuItems.length > 0) && (
        <div className="mt-3 flex items-center gap-2 border-t border-[#f3f4f6] pt-3">
          {actions.length > 0 && (
            <div className="grid flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}>
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
          {menuItems.length > 0 && <CardMenu items={menuItems} />}
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
