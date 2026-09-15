"use client";

import { useEffect, useState } from "react";
import { MOBILE_BREAKPOINT } from "./constants";

/**
 * Whether the viewport is narrow enough for the bottom sheet rather than the
 * in-frame panel.
 *
 * Read during the first render rather than in an effect. Initialising to false
 * meant a phone painted one frame of desktop layout before correcting itself,
 * and it made autoFocus impossible to gate — the flag was still false at the
 * moment React applied focus.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT
  );

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return isMobile;
}
