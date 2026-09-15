"use client";

import type { RefObject } from "react";
import { motion, useReducedMotion, type PanInfo } from "motion/react";
import { useBodyScrollLock } from "./useBodyScrollLock";
import { useHandprintForm, type HandprintFormSubmitData } from "./useHandprintForm";
import { HANDPRINT_COLORS, type HandprintColor } from "@/lib/schemas/handprint";
import { COLOR_SWATCHES } from "./constants";

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

interface HandprintFormProps {
  formRef: RefObject<HTMLDivElement | null>;
  formSelectedColor: HandprintColor;
  onColorSelect: (color: HandprintColor) => void;
  // May be async — the form awaits it to keep the submit button disabled
  // until the write actually settles.
  onSubmit: (data: HandprintFormSubmitData) => void | Promise<void>;
  onCancel: () => void;
}

export default function HandprintForm({
  formRef,
  formSelectedColor,
  onColorSelect,
  onSubmit,
  onCancel,
}: HandprintFormProps) {
  const { name, setName, link, changeLink, linkError, isSubmitting, handleSubmit } =
    useHandprintForm(onSubmit);

  const reduceMotion = useReducedMotion();

  // Mobile only — above the breakpoint the wall renders HandprintPanel inside
  // the frame instead, so every layout branch this component used to carry has
  // collapsed to the sheet side.
  //
  // The lock is what stops iOS scrolling the page to reveal a focused input,
  // which is what drags the sheet out of alignment with what's on screen.
  useBodyScrollLock(true);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > DISMISS_DISTANCE_PX || info.velocity.y > DISMISS_VELOCITY_PX_S) {
      onCancel();
    }
    // Not dismissed: Motion springs it back to the constraints on its own.
  };

  return (
    <motion.div
      ref={formRef}
      className="bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg fixed bottom-0 left-0 right-0 w-full rounded-t-2xl flex flex-col max-h-[85dvh]"
      // Enters and leaves by its own height, so the distance is correct
      // whatever the form grows to. Reduced motion keeps the fade and drops
      // the travel rather than removing the transition altogether.
      initial={{ y: reduceMotion ? 0 : "100%", opacity: reduceMotion ? 0 : 1 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: reduceMotion ? 0 : "100%", opacity: reduceMotion ? 0 : 1 }}
      transition={reduceMotion ? { duration: 0.15 } : SHEET_SPRING}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      // Down follows the finger 1:1. Up is damped to near-nothing rather than
      // being refused outright — the sheet is already at its natural edge, so
      // the honest physical response is friction, not a wall.
      dragElastic={{ top: 0.08, bottom: 1 }}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      style={{
        zIndex: 20,
        // The sheet isn't a scroll container, so without this a pan gesture on
        // it chains up to the document and scrolls the page behind instead.
        // (overscroll-behavior can't help — it only governs elements that
        // actually scroll, and this one doesn't.)
        touchAction: "none",
      }}
    >
      <div className="flex justify-center py-3 shrink-0">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
      </div>

      {/* The sheet stays anchored to the bottom, so on a phone the keyboard
          covers its lower part. Rather than chase the keyboard with
          visualViewport maths — which cost several rounds and kept
          mispositioning the sheet on iOS — the form simply scrolls inside its
          own box, and the browser brings a focused field into view within it.
          The bottom of the form ends up behind the keyboard; you scroll to it.
          A deliberate compromise, not an oversight.

          min-h-0 is what lets this shrink at all — a flex child won't go below
          its content height without it, which would defeat the cap above. */}
      <div className="overflow-y-auto overscroll-contain min-h-0">
      <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6 pt-2">
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
              // Never autofocused here: on a phone that summons the keyboard
              // at the same moment the sheet slides up — two surfaces animating
              // over each other, and the keyboard covers the sheet it just
              // opened. Let the visitor tap the field when they're ready.
              autoFocus={false}
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
              onChange={(e) => changeLink(e.target.value)}
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
      </div>
    </motion.div>
  );
}
