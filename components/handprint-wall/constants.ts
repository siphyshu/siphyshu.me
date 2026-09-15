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
export const PANEL_WIDTH_PCT = 54;
