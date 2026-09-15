// Shared between useCanvasPlacement (which positions the form) and
// HandprintForm (which lays itself out). These have to agree: the placement
// math assumes a floating panel above the breakpoint and a bottom sheet below
// it, and the form has to pick the matching layout. They previously disagreed
// (640 vs 500), so between those widths the form rendered as a bottom sheet
// while placement was still positioning it as a floating panel.
export const MOBILE_BREAKPOINT = 640; // Tailwind's sm

export const FORM_WIDTH = 280;
export const FORM_HEIGHT = 260;
export const VIEWPORT_PADDING = 10;

// Swatch fills for the colour picker. Shared by the sheet and the in-frame
// panel; these are the flat fills only, matched by eye to the SVGs in
// public/handprints/ rather than extracted from them.
export const COLOR_SWATCHES: Record<string, string> = {
  blue: "#8AC3FF",
  aqua: "#62DDBD",
  red: "#F096A4",
  green: "#C3E798",
  yellow: "#FADFA4",
  skin: "#F4D0B5",
};

/**
 * How much of the canvas width the in-frame panel occupies, and which side it
 * takes. It sits opposite the print you just placed, so a fresh hand is never
 * hidden behind the form that created it.
 */
export const PANEL_WIDTH_PCT = 48;

/**
 * Rendered marker size in px at a given viewport width, mirroring the
 * responsive classes on the marker in HandprintMarker.
 *
 * Duplicated out of Tailwind on purpose: the canvas hit-test runs in JS and
 * has to agree with what CSS actually painted. The two used to disagree — the
 * test was a flat 15px from centre against a marker that is only 12px from
 * centre below `sm`, so across those widths the placement cursor vanished in
 * a ring where a click would still have placed a print perfectly well.
 *
 * Viewport width, not container width: the marker uses plain `sm:`/`md:`/`lg:`
 * prefixes, which are media queries, even though the canvas around it is a
 * container-query context.
 */
export function markerSize(viewportWidth: number): number {
  if (viewportWidth >= 1024) return 30; // lg
  if (viewportWidth >= 768) return 28; // md
  if (viewportWidth >= 640) return 26; // sm
  return 24;
}

/**
 * The share of the marker box that actually answers to a mouse, as a circle
 * inscribed in the box and pulled in by this factor.
 *
 * The hands are splayed and the SVGs fill their box edge to edge, so the
 * corners of that box are transparent. They never looked clickable, but they
 * still swallowed clicks meant for the wall — and at 82 prints on a 950px
 * canvas the square boxes rejected placement across ~28% of it. A circle at
 * this scale brings that to ~12% without changing a rendered pixel.
 *
 * Mouse only. Touch keeps the whole box: 24px is already under any reasonable
 * tap target, and with no hover to fall back on, that tap is the only way to
 * read who a print belongs to.
 *
 * Kept in sync by hand with the inset on the hit layer in HandprintMarker:
 * inset = (1 - MARKER_HIT_SCALE) / 2, so 0.72 here is `inset-[14%]` there.
 */
export const MARKER_HIT_SCALE = 0.72;
