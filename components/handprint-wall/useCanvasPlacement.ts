"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { HANDPRINT_COLORS, type Handprint, type HandprintColor } from "@/lib/schemas/handprint";

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

const FORM_WIDTH = 280;
const FORM_HEIGHT = 260;
const VIEWPORT_PADDING = 10;
const MOBILE_BREAKPOINT = 640; // Tailwind's sm breakpoint

function randomColor(): HandprintColor {
  return HANDPRINT_COLORS[Math.floor(Math.random() * HANDPRINT_COLORS.length)];
}

export function useCanvasPlacement(handprints: Handprint[]) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const [tempHandprintPosition, setTempHandprintPosition] = useState<TempHandprintPosition | null>(null);
  const [formPosition, setFormPosition] = useState<FormPosition | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isMouseInside, setIsMouseInside] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [hoveredHandprint, setHoveredHandprint] = useState<Handprint | TempHandprint | null>(null);
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

  // Click-outside / Escape closes the form.
  useEffect(() => {
    if (!formPosition) return;

    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        resetForm();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") resetForm();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [formPosition]);

  const handleCanvasHover = (e: MouseEvent<HTMLDivElement>) => {
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

    const isOverHandprint = handprints.some((handprint) => {
      const handprintX = (handprint.x / 100) * rect.width;
      const handprintY = (handprint.y / 100) * rect.height;
      return Math.abs(x - handprintX) < 15 && Math.abs(y - handprintY) < 15;
    });

    setShowCursor(!isOverHandprint && !formPosition);
  };

  const handleCanvasLeave = () => {
    setShowCursor(false);
    setCursorPosition({ x: 0, y: 0 });
    setIsMouseInside(false);
  };

  const handleCanvasClick = (e: MouseEvent<HTMLDivElement>) => {
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
    hoveredHandprint,
    setHoveredHandprint,
    formSelectedColor,
    setFormSelectedColor,
    handleCanvasClick,
    handleCanvasHover,
    handleCanvasLeave,
    resetForm,
  };
}
