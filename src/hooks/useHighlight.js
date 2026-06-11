import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Scrolls to and flashes the card matching the ?highlight=<id> query param
 * (set by notification links). Cards must carry id={`hl-${item._id}`}.
 * The param is removed after the flash so back-navigation stays clean.
 *
 * @param {boolean} ready - pass true once the list has rendered (e.g. !loading)
 */
const useHighlight = (ready) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  useEffect(() => {
    if (!ready || !highlightId) return undefined;

    // Small delay so the list has painted before we scroll
    const scrollTimer = setTimeout(() => {
      const element = document.getElementById(`hl-${highlightId}`);
      if (!element) return;
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("highlight-flash");
    }, 150);

    const cleanupTimer = setTimeout(() => {
      document.getElementById(`hl-${highlightId}`)?.classList.remove("highlight-flash");
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("highlight");
          next.delete("t");
          return next;
        },
        { replace: true }
      );
    }, 2800);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(cleanupTimer);
    };
  }, [ready, highlightId, setSearchParams]);

  return highlightId;
};

export default useHighlight;
