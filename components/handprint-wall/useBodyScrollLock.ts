"use client";

import { useEffect } from "react";

/**
 * Freezes the page behind a modal surface.
 *
 * `overflow: hidden` on the body is the usual reflex and does not hold on iOS
 * Safari — the page still scrolls. That matters more than it sounds, because
 * iOS positions `fixed` elements against the *layout* viewport while the
 * *visual* viewport moves independently when the keyboard opens. Let the page
 * scroll and the two fall out of alignment: measured on an iPhone with the
 * keyboard up, the document had scrolled 559px, so the visible region was
 * layout-y 559-936 while the sheet sat correctly pinned at layout-y 26-377 —
 * entirely off-screen above. Every value Vaul computed was right; the page had
 * simply moved out from under it.
 *
 * Pinning the body with a compensating offset is what actually holds on iOS.
 * Restoring on cleanup keeps it symmetric: state lives in the closure rather
 * than in a module-level variable, so a missed reset can't leak into the next
 * open and silently skip the lock.
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const { body } = document;
    const scrollY = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    // !important defensively. Nothing in the tree currently competes for this,
    // but a stylesheet rule at any specificity beats a plain inline value, and
    // this failing is silent — the styles apply, `position` just never takes.
    // That cost an afternoon once, when a dialog library injected
    // `body[data-scroll-locked] { position: relative !important }`.
    body.style.setProperty("position", "fixed", "important");
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      // removeProperty first — assigning "" over an !important declaration
      // doesn't clear it.
      body.style.removeProperty("position");
      Object.assign(body.style, previous);
      // Pinning the body loses the scroll position, so put it back. Without
      // this, dismissing the sheet jumps the visitor to the top of the page.
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}
