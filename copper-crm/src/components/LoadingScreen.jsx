// Branded full-screen loader shown while a lazily-loaded route chunk is being
// fetched (Suspense fallback) and as a generic "page is working" indicator.
export default function LoadingScreen({ label = "Loading…" }) {
  return (
    <div className="flex h-full min-h-[60vh] w-full flex-col items-center justify-center gap-5 bg-[#F0EDE4]">
      <div className="relative grid h-16 w-16 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-2xl bg-[#8D3118]/20" />
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#1A1A1A] text-lg font-bold tracking-tight text-white shadow-[0_10px_30px_rgba(79,39,16,0.25)]">
          CS
        </span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="h-1 w-32 overflow-hidden rounded-full bg-[#E5E7EB]">
          <span className="block h-full w-1/3 animate-[loadbar_1.1s_ease-in-out_infinite] rounded-full bg-[#8D3118]" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B7280]">{label}</p>
      </div>
    </div>
  );
}
