import { useEffect, useRef } from "react";

// Re-runs `callback` whenever the tab regains focus/visibility, plus on a
// slow background interval, so admin-side edits (stages, progress, new
// documents/meetings/invoices, etc.) show up on the client portal without
// the user having to hard-refresh the page. Kept separate from the initial
// mount fetch each page already does — this only adds revalidation on top.
export function useRevalidate(callback, intervalMs = 45000) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    function run() {
      callbackRef.current();
    }
    function onVisibilityChange() {
      if (document.visibilityState === "visible") run();
    }
    window.addEventListener("focus", run);
    document.addEventListener("visibilitychange", onVisibilityChange);
    const interval = setInterval(run, intervalMs);
    return () => {
      window.removeEventListener("focus", run);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearInterval(interval);
    };
  }, [intervalMs]);
}
