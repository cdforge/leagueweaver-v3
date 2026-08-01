"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe phone-width check. Starts `false` (so server + first client render
 * agree — no hydration mismatch), then corrects on mount and on viewport change.
 */
export function useIsMobile(maxWidth = 560): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [maxWidth]);
  return isMobile;
}
