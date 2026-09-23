"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Keeps a section switch from shrinking the page out from under the scroll
// position. Going from projects (tall) to articles (short) while scrolled
// down would otherwise make the browser clamp the scroll, and everything
// above the tabs would jump up.
//
// On each switch the wrapper holds the outgoing section's height, then gives
// it back as you scroll up — only ever the part that's below the viewport, so
// the footer rises into place without anything on screen moving. A section
// visited directly never carries a floor at all.
export default function HeldHeight({ children }) {
    const ref = useRef(null);
    const pathname = usePathname();
    const lastHeight = useRef(0);

    // What's on screen right now, held or not. ResizeObserver fires after
    // layout, so during the swap below this still has the outgoing height.
    useEffect(() => {
        const el = ref.current;
        const ro = new ResizeObserver(() => { lastHeight.current = el.offsetHeight; });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Layout effect: the floor has to be in place before the browser lays out
    // the shorter page, or the scroll clamps first.
    useLayoutEffect(() => {
        const el = ref.current;
        el.style.minHeight = lastHeight.current ? `${lastHeight.current}px` : "";

        const release = () => {
            const floor = parseFloat(el.style.minHeight) || 0;
            if (!floor) return;
            const belowViewport = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
            const next = floor - Math.max(0, belowViewport);
            el.style.minHeight = next > 0 ? `${next}px` : "";
        };

        release();
        window.addEventListener("scroll", release, { passive: true });
        return () => window.removeEventListener("scroll", release);
    }, [pathname]);

    return <div ref={ref}>{children}</div>;
}
