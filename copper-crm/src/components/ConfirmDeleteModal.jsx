import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "./ui";

export default function ConfirmDeleteModal({
  title = "Delete item?",
  eyebrow = "Destructive action",
  name,
  message = "This action cannot be undone.",
  confirmLabel = "Delete",
  onCancel,
  onConfirm,
  loading = false,
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#111827]/45 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#f3d2c7] bg-white shadow-[0_24px_80px_rgba(17,24,39,0.28)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#fde8df] bg-[#fff8f6] px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C55418]">{eyebrow}</p>
              <h2 className="mt-1 text-lg font-bold text-[#111827]">{title}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#6b7280] transition-colors hover:bg-white hover:text-[#111827] disabled:opacity-50"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-5">
          <p className="text-sm leading-6 text-[#525866]">
            You are about to delete {name ? <span className="font-bold text-[#111827]">"{name}"</span> : "this item"}.
            {" "}{message}
          </p>
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium leading-5 text-red-700">
            Related workspace data may also be removed or unlinked. Review before continuing.
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#f3f4f6] bg-[#fafafa] px-5 py-4">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={14} />
            {loading ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
