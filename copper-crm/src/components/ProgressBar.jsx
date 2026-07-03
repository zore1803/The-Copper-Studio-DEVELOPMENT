// Shared progress bar look used everywhere a project/stage completion
// percentage is rendered as a bar: bordered pill track, a dark-brown →
// copper → bright-orange gradient fill (visible from a distance, not a
// flat block), and a white-ringed knob at the fill's leading edge while
// 0% < progress < 100% signalling the bar is still moving toward completion.
export default function ProgressBar({ progress = 0, height = 10, trackColor, borderColor }) {
  const pct = Math.min(100, Math.max(0, Number(progress) || 0));
  return (
    <div
      className="relative w-full rounded-full border"
      style={{ padding: 3, background: trackColor || "#f3f4f6", borderColor: borderColor || "#e5e7eb" }}
    >
      <div
        className="relative rounded-full transition-all duration-700"
        style={{
          height,
          width: `${pct}%`,
          minWidth: pct > 0 ? height : 0,
          background: "linear-gradient(90deg, #5c1f0f, #8D3118 45%, #e8734a)",
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.35), 0 1px 2px rgba(141,49,24,0.35)",
        }}
      >
        {pct > 0 && pct < 100 && (
          <span
            className="absolute top-1/2 rounded-full border-2"
            style={{
              height: height + 4,
              width: height + 4,
              right: "-3px",
              transform: "translateY(-50%)",
              background: "#e8734a",
              borderColor: "#fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            }}
          />
        )}
      </div>
    </div>
  );
}
