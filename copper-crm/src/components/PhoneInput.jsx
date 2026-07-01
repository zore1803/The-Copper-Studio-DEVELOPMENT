import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { COUNTRY_DIAL_CODES } from "../lib/countryDialCodes";
import { parsePhone, formatPhone } from "../lib/phone";

/**
 * Phone field used everywhere a phone/WhatsApp/mobile number is collected —
 * a searchable country-code dropdown next to a strict 10-digit number input.
 * Stores/returns a single "+<dial> <digits>" string so it's a drop-in
 * replacement for a plain text phone field.
 */
export default function PhoneInput({ label, value, onChange, error = "", span = false, disabled = false, hint }) {
  const { dialCode, number } = parsePhone(value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);

  useEffect(() => {
    function onClickAway(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  const selectedCountry = COUNTRY_DIAL_CODES.find((c) => c.dial === dialCode);
  const filtered = query.trim()
    ? COUNTRY_DIAL_CODES.filter((c) => `${c.name} ${c.dial}`.toLowerCase().includes(query.trim().toLowerCase()))
    : COUNTRY_DIAL_CODES;

  function pickCountry(country) {
    onChange(formatPhone(country.dial, number));
    setOpen(false);
    setQuery("");
  }

  function onNumberChange(event) {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 10);
    onChange(formatPhone(dialCode, digits));
  }

  return (
    <label className={`block ${span ? "sm:col-span-3" : ""}`} ref={rootRef}>
      {label && <span className="text-xs font-semibold text-[#374151]">{label}</span>}
      <div className="mt-1.5 flex gap-2">
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen((v) => !v)}
            className={`flex h-[38px] items-center gap-1 rounded-lg border px-2.5 text-sm outline-none transition-all ${
              error ? "border-red-300" : "border-[#e5e7eb] focus:border-[#C55418]"
            } ${disabled ? "bg-[#f9fafb] text-[#6b7280]" : "hover:bg-[#f9fafb]"}`}
          >
            <span className="font-semibold text-[#374151]">{selectedCountry?.dial || dialCode}</span>
            <ChevronDown size={13} className="text-[#9ca3af]" />
          </button>
          {open && !disabled && (
            <div className="absolute z-50 mt-1 w-64 overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-lg">
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search country…"
                className="w-full border-b border-[#e5e7eb] px-3 py-2 text-sm outline-none"
              />
              <div className="max-h-56 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-[#9ca3af]">No matches</p>
                ) : (
                  filtered.map((country) => (
                    <button
                      key={country.iso}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => pickCountry(country)}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[#fff1ec] ${
                        country.dial === dialCode ? "bg-[#fff1ec] font-semibold text-[#C55418]" : "text-[#374151]"
                      }`}
                    >
                      <span className="truncate">{country.name}</span>
                      <span className="shrink-0 text-[#9ca3af]">{country.dial}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <input
          type="tel"
          inputMode="numeric"
          value={number}
          disabled={disabled}
          placeholder="10-digit number"
          onChange={onNumberChange}
          maxLength={10}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all focus:ring-2 ${
            error ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-[#e5e7eb] focus:border-[#C55418] focus:ring-[#C55418]/20"
          } ${disabled ? "bg-[#f9fafb] text-[#6b7280]" : ""}`}
        />
      </div>
      {error ? (
        <span className="mt-1 block text-[11px] font-semibold text-red-500">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[11px] text-[#9ca3af]">{hint}</span>
      ) : null}
    </label>
  );
}
