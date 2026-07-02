import { useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";

/**
 * Dropdown that behaves like a native <select> but lets the user type to
 * filter long option lists (companies, contacts, invoices, …) instead of
 * scrolling through every record.
 */
export default function SearchableSelectField({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select…",
  span = false,
  error = "",
  hint,
  disabled = false,
  // When true, typing a value with no matching option keeps the typed text
  // as the value on blur/close instead of forcing a pick from the list —
  // for fields like city/industry where the list is a helpful shortlist,
  // not the full set of valid values.
  allowCustom = false,
}) {
  const normalized = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option
  );
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);

  useEffect(() => {
    function onClickAway(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        if (allowCustom && open && query.trim()) onChange(query.trim());
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [allowCustom, open, query, onChange]);

  const selected = normalized.find((option) => String(option.value) === String(value || ""));
  const filtered = query.trim()
    ? normalized.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()))
    : normalized;

  function pick(option) {
    onChange(option.value);
    setOpen(false);
    setQuery("");
  }

  return (
    <label className={`block ${span ? "sm:col-span-3" : ""}`} ref={rootRef}>
      {label && <span className="text-xs font-semibold text-[#374151]">{label}</span>}
      <div className="relative mt-1.5">
        <input
          type="text"
          disabled={disabled}
          value={open ? query : selected?.label || (allowCustom ? value || "" : "")}
          placeholder={selected ? selected.label : placeholder}
          onFocus={() => { setOpen(true); setQuery(""); }}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-lg border px-3 py-2 pr-8 text-sm outline-none transition-all focus:ring-2 ${
            error ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-[#e5e7eb] focus:border-[#8D3118] focus:ring-[#8D3118]/20"
          } ${disabled ? "bg-[#f9fafb] text-[#6b7280]" : ""}`}
        />
        {(selected || (allowCustom && value)) && !disabled ? (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => { onChange(""); setQuery(""); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280]"
          >
            <X size={14} />
          </button>
        ) : (
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
        )}
        {open && !disabled && (
          <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-[#e5e7eb] bg-white shadow-lg">
            {allowCustom && query.trim() && !normalized.some((o) => o.label.toLowerCase() === query.trim().toLowerCase()) && (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => { onChange(query.trim()); setOpen(false); setQuery(""); }}
                className="block w-full truncate border-b border-[#f3f4f6] px-3 py-2 text-left text-sm text-[#8D3118] hover:bg-[#fff1ec]"
              >
                Use "{query.trim()}"
              </button>
            )}
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-[#9ca3af]">No matches</p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pick(option)}
                  className={`block w-full truncate px-3 py-2 text-left text-sm hover:bg-[#fff1ec] ${
                    String(option.value) === String(value || "") ? "bg-[#fff1ec] font-semibold text-[#8D3118]" : "text-[#374151]"
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {error ? (
        <span className="mt-1 block text-[11px] font-semibold text-red-500">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[11px] text-[#9ca3af]">{hint}</span>
      ) : null}
    </label>
  );
}
