"use client";

import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import { motion, useReducedMotion, type PanInfo } from "motion/react";
import { HANDPRINT_COLORS, type HandprintColor } from "@/lib/schemas/handprint";
import { validateLink } from "@/lib/schemas/link";
import { MOBILE_BREAKPOINT } from "./constants";

const COLOR_SWATCHES: Record<HandprintColor, string> = {
  blue: "#8AC3FF",
  aqua: "#62DDBD",
  red: "#F096A4",
  green: "#C3E798",
  yellow: "#FADFA4",
  skin: "#F4D0B5",
};

/**
 * Release past either of these and the sheet closes. Distance alone isn't
 * enough — a fast flick covers very little ground before the finger lifts, and
 * refusing to dismiss it is the thing that makes a sheet feel stuck.
 *
 * Both are deliberately above the values Sonner uses for toasts. A toast has
 * nothing to lose when it's dismissed by accident; this sheet can be holding a
 * half-typed name.
 */
const DISMISS_DISTANCE_PX = 110;
const DISMISS_VELOCITY_PX_S = 400;

/** Apple-style spring from the animation skill. Carries velocity through an
 *  interrupted drag, which a duration-based curve can't. */
const SHEET_SPRING = { type: "spring", duration: 0.5, bounce: 0.2 } as const;

export interface HandprintFormSubmitData {
  name: string;
  link: string;
}

interface HandprintFormProps {
  formRef: RefObject<HTMLDivElement | null>;
  formPosition: { x: number; y: number };
  formSelectedColor: HandprintColor;
  onColorSelect: (color: HandprintColor) => void;
  // May be async — the form awaits it to keep the submit button disabled
  // until the write actually settles.
  onSubmit: (data: HandprintFormSubmitData) => void | Promise<void>;
  onCancel: () => void;
}

export default function HandprintForm({
  formRef,
  formPosition,
  formSelectedColor,
  onColorSelect,
  onSubmit,
  onCancel,
}: HandprintFormProps) {
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  // Read the width during the first render, not in an effect. Initialising to
  // false meant a mobile sheet painted one frame as a desktop popover before
  // correcting itself — and it made autoFocus below impossible to gate, since
  // the flag was still false at the moment React applied focus.
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT
  );

  // Still reactive to later viewport changes, not just the size at mount.
  useEffect(() => {
    const updateIsMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);
    return () => window.removeEventListener("resize", updateIsMobile);
  }, []);

  const reduceMotion = useReducedMotion();

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > DISMISS_DISTANCE_PX || info.velocity.y > DISMISS_VELOCITY_PX_S) {
      onCancel();
    }
    // Not dismissed: Motion springs it back to the constraints on its own.
  };

  // Validated on submit rather than on every keystroke, so the field doesn't
  // scold you for a half-typed domain.
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // A ref, not the isSubmitting state, is what actually blocks a double
  // submit: state updates are async, so two clicks landing in the same tick
  // would both read isSubmitting as false and both fire a POST. The database
  // has several handprints stored 2-4 times at identical coordinates from
  // exactly this. The disabled attribute below is the visible half; this is
  // the half that's race-free.
  const submittingRef = useRef(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;

    if (link.trim()) {
      const result = validateLink(link);
      if (!result.ok) {
        setLinkError(result.reason);
        return;
      }
    }

    setLinkError(null);
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      await onSubmit({ name, link });
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      ref={formRef}
      className={`bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg
        ${isMobile
          ? "fixed bottom-0 left-0 right-0 w-full rounded-t-2xl"
          : "absolute rounded-md border border-gray-400 w-64 m-3"}`}
      // Enters and leaves by its own height, so the distance is correct
      // whatever the form grows to. Reduced motion keeps the fade and drops
      // the travel rather than removing the transition altogether.
      initial={isMobile ? { y: reduceMotion ? 0 : "100%", opacity: reduceMotion ? 0 : 1 } : false}
      animate={{ y: 0, opacity: 1 }}
      exit={isMobile ? { y: reduceMotion ? 0 : "100%", opacity: reduceMotion ? 0 : 1 } : { opacity: 0 }}
      transition={reduceMotion ? { duration: 0.15 } : SHEET_SPRING}
      // Drag is mobile-only; the desktop form is a popover pinned to the click.
      drag={isMobile ? "y" : false}
      dragConstraints={{ top: 0, bottom: 0 }}
      // Down follows the finger 1:1. Up is damped to near-nothing rather than
      // being refused outright — the sheet is already at its natural edge, so
      // the honest physical response is friction, not a wall.
      dragElastic={{ top: 0.08, bottom: 1 }}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      style={{
        left: isMobile ? undefined : `${formPosition.x}px`,
        top: isMobile ? undefined : `${formPosition.y}px`,
        zIndex: 20,
        // The sheet isn't a scroll container, so without this a pan gesture on
        // it chains up to the document and scrolls the page behind instead.
        // (overscroll-behavior can't help — it only governs elements that
        // actually scroll, and this one doesn't.)
        touchAction: isMobile ? "none" : undefined,
      }}
    >
      {/* Mobile handle. Drag is bound to the whole sheet above, so this is
          purely the visual affordance now. */}
      {isMobile && (
        <div className="flex justify-center py-3">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>
      )}

      <form onSubmit={handleSubmit} className={`space-y-4 ${isMobile ? "p-6" : "p-4"}`}>
        <div className="space-y-4">
          {/* Name Field */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">
              Your Name / Alias <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. siphyshu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              // text-base below sm: iOS Safari zooms the page whenever a
              // focused input computes under 16px. The breakpoint is
              // Tailwind's 640px, which is MOBILE_BREAKPOINT — so 16px applies
              // exactly where the drawer layout does, and desktop keeps 14px.
              className="w-full px-3 py-2 text-base sm:text-sm border-b border-gray-300 focus:outline-none focus:border-blue-500 placeholder-gray-400 bg-transparent"
              // Desktop only. On a phone, focusing here summons the keyboard at
              // the same moment the sheet slides up — two surfaces animating
              // over each other, and the keyboard covers the sheet it just
              // opened. Let the visitor tap the field when they're ready.
              autoFocus={!isMobile}
              required
            />
          </div>

          {/* Website Field */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">
              Link (Optional)
            </label>
            <input
              placeholder="e.g. linktr.ee/yourname"
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
                if (linkError) setLinkError(null);
              }}
              aria-invalid={linkError !== null}
              // text-base below sm for the same reason as the name field.
              className={`w-full px-3 py-2 text-base sm:text-sm border-b focus:outline-none placeholder-gray-400 bg-transparent ${
                linkError
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-300 focus:border-blue-500"
              }`}
            />
            {linkError && (
              <p className="text-xs text-red-500 pt-1">{linkError}</p>
            )}
          </div>

          {/* Color Picker */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">
              Color Picker
            </label>
            <div className="grid grid-cols-6 gap-2 py-2 px-3">
              {HANDPRINT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onColorSelect(color)}
                  className={`h-6 w-6 rounded-full transition-all ${
                    formSelectedColor === color
                      ? "ring-2 ring-offset-1 ring-gray-800"
                      : "hover:ring-1 hover:ring-gray-200"
                  }`}
                  style={{ backgroundColor: COLOR_SWATCHES[color] }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col space-y-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-md transition-colors disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400"
          >
            {isSubmitting ? "Imprinting…" : "Imprint!"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  );
}
