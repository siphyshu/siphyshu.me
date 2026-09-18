"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";

// Lives in the root layout, which is the whole point: a root layout is not
// remounted by a client-side navigation, so one component can close over a
// route change and open on the other side as a single continuous animation.
// The alternative — animating out on page A, stashing a flag in sessionStorage,
// animating in on page B — has a seam at the handoff and flashes the new page
// for a frame before the curtain re-covers it.

type Phase = "idle" | "closing" | "covered" | "opening";

interface CurtainApi {
  /** Close the curtain, navigate behind it, then open onto the new route. */
  draw: (href: string) => void;
  busy: boolean;
}

const CurtainContext = createContext<CurtainApi | null>(null);

export function useCurtain(): CurtainApi {
  const context = useContext(CurtainContext);
  if (!context) throw new Error("useCurtain must be used inside CurtainProvider");
  return context;
}

/** Strong ease-out. Both halves use it, so closing and opening mirror exactly. */
const EASE = [0.23, 1, 0.32, 1] as const;

const CLOSE_SECONDS = 0.42;
const OPEN_SECONDS = 0.55;

/**
 * How long to stay covered before opening regardless.
 *
 * /backstage renders dynamically, so the hold between "covered" and "arrived"
 * is real navigation time and the curtain is genuinely masking a load. If that
 * navigation fails outright the phase would never advance, and the failure mode
 * is a visitor sealed behind an opaque panel with no way out. Opening on a
 * wrong-but-visible page beats that.
 */
const MAX_HOLD_MS = 4000;

export function CurtainProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const destination = useRef<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();

  const draw = useCallback(
    (href: string) => {
      // Ignore a second trigger mid-run rather than restarting — the Konami
      // code is easy to fire twice and a restart would snap the panels back.
      if (phase !== "idle") return;
      destination.current = href;
      router.prefetch(href);
      setPhase("closing");
    },
    [phase, router]
  );

  // Navigate only once fully covered, so the swap is never visible.
  useEffect(() => {
    if (phase === "covered" && destination.current) {
      router.push(destination.current);
    }
  }, [phase, router]);

  // Open when the new route has actually committed. Waiting on the pathname
  // rather than a fixed delay is what makes the curtain hide the load instead
  // of guessing at it.
  useEffect(() => {
    if (phase === "covered" && pathname === destination.current) {
      setPhase("opening");
    }
  }, [phase, pathname]);

  useEffect(() => {
    if (phase !== "covered") return;
    const timer = setTimeout(() => setPhase("opening"), MAX_HOLD_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const covering = phase === "closing" || phase === "covered";

  return (
    <CurtainContext.Provider value={{ draw, busy: phase !== "idle" }}>
      {children}

      <div
        aria-hidden
        className={`fixed inset-0 z-[60] overflow-hidden ${
          covering ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {reduce ? (
          // Reduced motion keeps the beat — you still get a moment of cover, so
          // the jump to another page is explained — but drops the travel.
          <motion.div
            className="absolute inset-0 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: covering ? 1 : 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            onAnimationComplete={() => {
              setPhase((current) =>
                current === "closing"
                  ? "covered"
                  : current === "opening"
                    ? "idle"
                    : current
              );
            }}
          />
        ) : (
          <>
            <Panel
              side="left"
              covering={covering}
              // Only one panel reports, or every phase transition fires twice.
              onSettled={() =>
                setPhase((current) =>
                  current === "closing"
                    ? "covered"
                    : current === "opening"
                      ? "idle"
                      : current
                )
              }
            />
            <Panel side="right" covering={covering} />
          </>
        )}
      </div>
    </CurtainContext.Provider>
  );
}

function Panel({
  side,
  covering,
  onSettled,
}: {
  side: "left" | "right";
  covering: boolean;
  onSettled?: () => void;
}) {
  const offscreen = side === "left" ? "translateX(-100%)" : "translateX(100%)";

  return (
    <motion.div
      // calc(50% + 1px) so the two halves overlap by a hair. At fractional
      // viewport widths an exact 50/50 split leaves a one-pixel seam of the
      // page showing straight down the middle.
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        [side]: 0,
        width: "calc(50% + 1px)",
        background: "#000",
      }}
      // The full transform string, not Motion's x shorthand — the shorthand
      // isn't hardware accelerated and drops frames while the page is busy,
      // which is exactly when this runs (it is covering a navigation).
      initial={{ transform: offscreen }}
      animate={{ transform: covering ? "translateX(0%)" : offscreen }}
      transition={{
        duration: covering ? CLOSE_SECONDS : OPEN_SECONDS,
        ease: EASE,
      }}
      onAnimationComplete={onSettled}
    />
  );
}
