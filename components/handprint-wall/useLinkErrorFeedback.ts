"use client";

import { useEffect, useRef } from "react";
import { useAnimate, useReducedMotion } from "motion/react";

/** Decaying shake. Settles rather than stopping dead, so it reads as a
 *  physical recoil instead of a stutter. */
const SHAKE_KEYFRAMES = [0, -6, 6, -4, 4, -2, 2, 0];
const SHAKE_DURATION = 0.42;

/**
 * How a rejected link announces itself: the field recoils, then hands the bad
 * value back selected so the next keystroke replaces it. A wrong link is
 * usually easier to retype than to repair.
 *
 * Shared by the sheet and the panel. They lay the form out very differently
 * but this has to feel identical in both, and it's the kind of detail that
 * silently drifts once it exists in two places.
 *
 * Driven by a counter rather than the message, because resubmitting the same
 * bad link produces identical state — nothing re-renders, and the field would
 * sit there looking like it ignored you.
 *
 * Attach `shakeScope` to the whole field including its label, so it recoils as
 * a unit rather than the text sliding out from under its own heading.
 */
export function useLinkErrorFeedback(linkErrorAt: number) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [shakeScope, animate] = useAnimate();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!linkErrorAt) return;
    inputRef.current?.focus();
    inputRef.current?.select();
    // Reduced motion keeps the focus and selection — those carry the meaning;
    // the shake only makes it quicker to notice.
    if (reduceMotion) return;
    animate(
      shakeScope.current,
      { x: SHAKE_KEYFRAMES },
      { duration: SHAKE_DURATION, ease: "easeInOut" }
    );
  }, [linkErrorAt, reduceMotion, animate, shakeScope]);

  return { inputRef, shakeScope };
}
