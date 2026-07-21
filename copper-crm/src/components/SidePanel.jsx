import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useIsMobile } from "../hooks/useIsMobile";

// On desktop this docks to the right edge as a slide-in sidebar (full height,
// flush with the right side). On mobile it falls back to the floating,
// centered sheet — a full-width dock would leave no room to see/dismiss it.
export default function SidePanel({ title, subtitle, headerAction, children, footer, onClose, width = "max-w-xl" }) {
  const isMobile = useIsMobile();

  // Without this, scrolling the page behind the panel on mobile can hide the
  // browser's address bar, growing the viewport and making this fixed,
  // bottom-anchored panel visibly grow/shift with it. Locking body scroll
  // keeps the underlying page (and viewport) still while the panel is open.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  const panel = (
    <div className={`flex h-full w-full ${width} flex-col border-gray-200 bg-white shadow-2xl ${isMobile ? "animate-[sheet-up_200ms_ease-out] rounded-2xl border" : "animate-[panel-in_200ms_ease-out] rounded-l-2xl border-l"}`}>
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="text-base font-bold text-gray-950">{title}</h2>
          {subtitle && <p className="mt-1 text-xs leading-5 text-gray-500">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {headerAction}
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5">{children}</div>
      {footer && <div className="border-t border-gray-100 p-4">{footer}</div>}
    </div>
  );

  if (isMobile) {
    return createPortal(
      <div className="fixed inset-x-0 bottom-0 top-28 z-50 flex justify-center bg-gray-950/30 p-4">
        {panel}
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-gray-950/30">
      {panel}
    </div>,
    document.body
  );
}
