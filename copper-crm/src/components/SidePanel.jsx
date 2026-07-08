import { createPortal } from "react-dom";
import { X } from "lucide-react";

// Confined to the area below the top navbar + the page's own header strip
// (both ~56px tall) instead of covering the full viewport, so the nav and
// page header stay visible/reachable behind a dimmed backdrop — like a
// bottom sheet rather than a full-screen takeover.
export default function SidePanel({ title, subtitle, children, footer, onClose, width = "max-w-xl" }) {
  return createPortal(
    <div className="fixed inset-x-0 bottom-0 top-28 z-50 bg-gray-950/30">
      <div className={`mx-auto flex h-full w-full ${width} animate-[sheet-up_200ms_ease-out] flex-col rounded-t-2xl border border-b-0 border-gray-200 bg-white shadow-2xl`}>
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-950">{title}</h2>
            {subtitle && <p className="mt-1 text-xs leading-5 text-gray-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="border-t border-gray-100 p-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
