"use client";

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { HANDPRINT_COLORS, type Handprint, type HandprintColor } from "@/lib/schemas/handprint";
import type { AgedHandprint } from "./age";
import {
  FORM_HEIGHT,
  FORM_WIDTH,
  MARKER_HIT_SCALE,
  MOBILE_BREAKPOINT,
  PINNED_SCALE,
  VIEWPORT_PADDING,
  markerSize,
} from "./constants";

export interface TempHandprint {
  x: number;
  y: number;
  color: HandprintColor;
  angle: number;
}

interface TempHandprintPosition {
  x: number;
  y: number;
  angle: number;
}

interface FormPosition {
  x: number;
  y: number;
}

function randomColor(): HandprintColor {
  return HANDPRINT_COLORS[Math.floor(Math.random() * HANDPRINT_COLORS.length)];
}

// Aged rather than plain prints: the hit-test has to know which ones are
// pinned, because a pinned marker is scaled up and so is a larger target.
export function useCanvasPlacement(handprints: AgedHandprint[]) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const [tempHandprintPosition, setTempHandprintPosition] = useState<TempHandprintPosition | null>(null);
  const [formPosition, setFormPosition] = useState<FormPosition | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isMouseInside, setIsMouseInside] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  // Which print is showing its label, and whether that label was opened by a
  // tap. One piece of state rather than separate hover/selection so there's no
  // "hovered and selected at once" case to reconcile; `isLabelSticky` is only
  // about how it got there and what it takes to close it.
  const [activeHandprint, setActiveHandprint] = useState<Handprint | TempHandprint | null>(null);
  const [isLabelSticky, setIsLabelSticky] = useState(false);
  const [formSelectedColor, setFormSelectedColor] = useState<HandprintColor>(randomColor);

  // Derived, not stored: the preview always reflects whatever color is
  // currently selected in the form, so there's nothing to keep "in sync".
  const tempHandprint: TempHandprint | null = tempHandprintPosition
    ? { ...tempHandprintPosition, color: formSelectedColor }
    : null;

  const resetForm = () => {
    setFormPosition(null);
    setTempHandprintPosition(null);
  };

  const dismissLabel = () => {
    setActiveHandprint(null);
    setIsLabelSticky(false);
  };

  /** Mouse hover. Transient, and never overrides a label opened by a tap. */
  const hoverHandprint = (handprint: Handprint | TempHandprint | null) => {
    if (isLabelSticky) return;
    setActiveHandprint(handprint);
  };

  /** Touch/pen tap. Holds the label open until something dismisses it. */
  const tapHandprint = (handprint: Handprint | TempHandprint) => {
    // Only real, named prints render a label. Letting the temp preview go
    // sticky would arm a dismiss with nothing on screen to dismiss, and the
    // next tap on the canvas would be silently eaten.
    if (!("name" in handprint)) return;
    setActiveHandprint(handprint);
    setIsLabelSticky(true);
  };

  // Escape closes a tapped-open label. Mostly for hybrid devices, where a
  // keyboard is in reach of something that was opened by touch.
  useEffect(() => {
    if (!isLabelSticky) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissLabel();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isLabelSticky]);

  // Click-outside / Escape closes the form.
  useEffect(() => {
    if (!formPosition) return;

    // pointerdown, not mousedown: on touch the mouse events are emulated and
    // only dispatched under conditions that aren't worth relying on, so
    // dismissing the form by tapping outside it was never dependable.
    const handlePointerOutside = (e: globalThis.PointerEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        resetForm();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") resetForm();
    };

    document.addEventListener("pointerdown", handlePointerOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [formPosition]);

  // Pointer events rather than mouse events throughout: touch fires
  // compatibility mouse events (mouseenter/mouseover/click) with no matching
  // mouseleave, which is what left labels stuck open. `pointerType` says where
  // an interaction actually came from, so a hybrid device gets hover from its
  // trackpad and tap from its screen in the same session, with no device
  // detection anywhere.
  const handleCanvasPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    // The custom cursor and its hit-test are meaningless without a real
    // pointer. Bailing here is also what keeps the per-move O(n) scan off
    // touch devices entirely.
    if (e.pointerType !== "mouse") return;
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();

    const isInside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;

    setIsMouseInside(isInside);
    if (!isInside) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPosition({ x, y });

    // Has to be the same circle the markers expose to the mouse, or the
    // cursor lies about where a print can go: hiding it says "not here", and
    // it was previously hidden across a ring where a click still placed one.
    const baseRadius = (markerSize(window.innerWidth) * MARKER_HIT_SCALE) / 2;

    const isOverHandprint = handprints.some((handprint) => {
      const dx = x - (handprint.x / 100) * rect.width;
      const dy = y - (handprint.y / 100) * rect.height;
      const radius = handprint.pinned ? baseRadius * PINNED_SCALE : baseRadius;
      return dx * dx + dy * dy < radius * radius;
    });

    setShowCursor(!isOverHandprint && !formPosition);
  };

  const handleCanvasLeave = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    setShowCursor(false);
    setCursorPosition({ x: 0, y: 0 });
    setIsMouseInside(false);
  };

  const handleCanvasClick = (e: MouseEvent<HTMLDivElement>) => {
    // A tapped-open label owns the next tap on the canvas: it dismisses rather
    // than placing a print. Gated on sticky rather than "is anything active" —
    // with a mouse the pointer sits over a print constantly, and hover state
    // must never swallow a click.
    if (isLabelSticky) {
      dismissLabel();
      return;
    }

    if (formPosition || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const clickX = e.clientX;
    const clickY = e.clientY;
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;

    let formX: number;
    let formY: number;

    if (isMobile) {
      formX = (window.innerWidth - FORM_WIDTH) / 2;
      formY = window.innerHeight - FORM_HEIGHT - VIEWPORT_PADDING;
    } else {
      formX = clickX + 10;
      formY = clickY + 10;

      if (formX + FORM_WIDTH > window.innerWidth - VIEWPORT_PADDING) {
        formX = clickX - FORM_WIDTH - 10;
      }
      if (formY + FORM_HEIGHT > window.innerHeight - VIEWPORT_PADDING) {
        formY = clickY - FORM_HEIGHT - 10;
      }

      formX = Math.max(VIEWPORT_PADDING, Math.min(formX, window.innerWidth - FORM_WIDTH - VIEWPORT_PADDING));
      formY = Math.max(VIEWPORT_PADDING, Math.min(formY, window.innerHeight - FORM_HEIGHT - VIEWPORT_PADDING));
    }

    setTempHandprintPosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      angle: Math.random() * 120 - 60,
    });
    setFormPosition({ x: formX, y: formY });
    setShowCursor(false);
  };

  return {
    canvasRef,
    formRef,
    tempHandprint,
    formPosition,
    cursorPosition,
    isMouseInside,
    showCursor,
    activeHandprint,
    isLabelSticky,
    hoverHandprint,
    tapHandprint,
    formSelectedColor,
    setFormSelectedColor,
    handleCanvasClick,
    handleCanvasPointerMove,
    handleCanvasLeave,
    resetForm,
  };
}
