"use client";

import Image from "next/image";
import type { RefObject } from "react";
import { motion, useReducedMotion, type PanInfo } from "motion/react";
import { useBodyScrollLock } from "./useBodyScrollLock";
import { useLinkErrorFeedback } from "./useLinkErrorFeedback";
import { usePreviewTilt } from "./usePreviewTilt";
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
  const {
    name,
    setName,
    link,
    changeLink,
    linkError,
    linkErrorAt,
    isSubmitting,
    handleSubmit,
  } = useHandprintForm(onSubmit);

  const { inputRef: linkInputRef, shakeScope } = useLinkErrorFeedback(linkErrorAt);

  const { tilt: previewTilt, reroll: rerollTilt } = usePreviewTilt();

  const selectColor = (color: HandprintColor) => {
    onColorSelect(color);
    rerollTilt();
  };

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
      <form onSubmit={handleSubmit} className="space-y-5 px-6 pb-6 pt-2">
        {/* Same greeting as the in-frame panel. The sheet used to open straight
            onto form fields with no idea what it was for. */}
        <div>
          <p className="text-[17px] leading-tight">
            hi, you&apos;re about to leave a mark on my wall!
          </p>
          {/* The field itself carries the error — red, a recoil, and the bad
              value handed back selected. Kept here for screen readers, where
              none of that lands: aria-invalid says something is wrong but
              never what. */}
          {linkError && (
            <p role="alert" className="sr-only">
              {linkError}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="block text-[12px] text-gray-500 mb-1.5">
              name <span aria-hidden="true">*</span>
            </span>
            <input
              type="text"
              placeholder="e.g. siphyshu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              // 16px minimum: iOS Safari zooms the page whenever a focused
              // input computes under it.
              className="w-full text-[16px] pb-1.5 bg-transparent border-b border-dashed border-black focus:outline-none focus:border-solid placeholder-gray-400"
              // Never autofocused here: on a phone that summons the keyboard at
              // the same moment the sheet slides up — two surfaces animating
              // over each other, and the keyboard covers the sheet it just
              // opened. Let the visitor tap the field when they're ready.
              autoFocus={false}
              required
            />
          </label>

          {/* Shaken as a unit, label included. See ./useLinkErrorFeedback. */}
          <label className="block" ref={shakeScope}>
            <span
              className={`block text-[12px] mb-1.5 ${
                linkError ? "text-red-600" : "text-gray-500"
              }`}
            >
              your link
            </span>
            <input
              ref={linkInputRef}
              placeholder="e.g. linktr.ee/you"
              value={link}
              onChange={(e) => changeLink(e.target.value)}
              aria-invalid={linkError !== null}
              className={`w-full text-[16px] pb-1.5 bg-transparent border-b border-dashed focus:outline-none focus:border-solid placeholder-gray-400 ${
                linkError ? "border-red-500 text-red-600" : "border-black"
              }`}
            />
          </label>

          {/* The selected swatch becomes the handprint, as in the panel. Bigger
              boxes than the desktop equivalent — these are touch targets. */}
          <fieldset>
            <legend className="text-[12px] text-gray-500 mb-2">colour</legend>
            <div className="flex items-center gap-3">
              {HANDPRINT_COLORS.map((color) => {
                const selected = formSelectedColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => selectColor(color)}
                    aria-label={color}
                    aria-pressed={selected}
                    className="h-11 w-11 flex items-center justify-center shrink-0"
                  >
                    {selected ? (
                      <Image
                        src={`/handprints/${color}.svg`}
                        width={36}
                        height={36}
                        alt=""
                        className="select-none"
                        style={{ transform: `rotate(${previewTilt}deg)` }}
                      />
                    ) : (
                      <span
                        className="h-6 w-6 rounded-full"
                        style={{ backgroundColor: COLOR_SWATCHES[color] }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* Stacked rather than side by side: full-width targets are easier to
            hit with a thumb, and imprint leads because it's the likely one. */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full text-[15px] py-3 border border-black bg-black text-white disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "imprinting\u2026" : "imprint"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full text-[15px] py-2 text-gray-500"
          >
            cancel
          </button>
        </div>
      </form>
      </div>
    </motion.div>
  );
}
