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
