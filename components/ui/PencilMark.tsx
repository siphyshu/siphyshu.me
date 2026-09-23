"use client";

import { useEffect, useState, type RefObject } from "react";

const MARK_MS = 2600;

/**
 * Whether the URL's #hash points at this element, and if so, brings it into
 * view. Returns a counter rather than a boolean so a repeat visit to the same
 * hash re-keys the mark and draws it again.
 *
 * Next navigates with history.pushState, which neither fires `hashchange` nor
 * updates CSS `:target`, so neither can be relied on. Instead: arriving from
 * another route mounts the element fresh and the hash is read on mount; the
 * search palette, when it links to the page you're already on, dispatches a
 * `hashchange` itself after pushing the URL.
 */
export function useHashMark(id: string | undefined, ref: RefObject<HTMLElement | null>) {
  const [mark, setMark] = useState(0);

  useEffect(() => {
    if (!id) return;
    const check = () => {
      if (decodeURIComponent(window.location.hash.slice(1)) !== id) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // inline "start" so a card in the phone's swipe row lands on the
      // gutter the way a swipe would (the row sets scroll-pl-4).
      ref.current?.scrollIntoView({
        block: "center",
        inline: "start",
        behavior: reduce ? "auto" : "smooth",
      });
      setMark((m) => m + 1);
    };
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, [id, ref]);

  useEffect(() => {
    if (!mark) return;
    const t = setTimeout(() => setMark(0), MARK_MS);
    return () => clearTimeout(t);
  }, [mark]);

  return mark;
}

/**
 * A quick pencil loop drawn around whatever you were sent to, the way you'd
 * circle the entry in a book's index — then it fades. The parent must be
 * positioned. Two passes that don't quite meet, because nobody circles
 * something once.
 */
export function PencilMark() {
  return (
    <svg className="pencil-mark" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d="M8 9 C32 2 74 1 95 7 C100 30 99 72 94 94 C68 99 30 100 5 95 C0 70 1 34 5 12 C9 6 16 4 22 4" />
      <path d="M12 5 C40 1 80 3 97 10 C99 40 98 76 92 97 C60 100 24 97 3 91 C2 62 2 30 7 8" />
    </svg>
  );
}
