"use client";

import { useEffect, useRef } from "react";
import { useCurtain } from "@/components/backstage/Curtain";

// ↑ ↑ ↓ ↓ ← → ← → B A
const SEQUENCE = [
  "arrowup",
  "arrowup",
  "arrowdown",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "arrowleft",
  "arrowright",
  "b",
  "a",
] as const;

/**
 * Finding the door, not opening it.
 *
 * This navigates to /backstage; the password still has to be typed. Unlocking
 * here instead would mean the gate could be bypassed by anyone who tried the
 * most famous key sequence in existence, which would make the password
 * decorative.
 */
export default function KonamiCode({ href = "/backstage" }: { href?: string }) {
  const { draw } = useCurtain();
  const progress = useRef(0);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // The homepage has a search box. Arrow keys move a caret there and "b"
      // and "a" are just letters someone is typing — none of it is a cheat code.
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        progress.current = 0;
        return;
      }

      // Modifier combinations are shortcuts for something else.
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const key = event.key.toLowerCase();

      if (key === SEQUENCE[progress.current]) {
        progress.current += 1;
        if (progress.current === SEQUENCE.length) {
          progress.current = 0;
          draw(href);
        }
        return;
      }

      // A wrong key resets — but it may itself be a fresh first key, so that
      // "↑ ↑ ↑ ↓ ↓ …" still works rather than needing a clean restart.
      progress.current = key === SEQUENCE[0] ? 1 : 0;
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [draw, href]);

  return null;
}
