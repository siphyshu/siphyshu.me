"use client";

import Image from "next/image";
import type { RefObject } from "react";
import { motion, useIsPresent, useReducedMotion } from "motion/react";
import { HANDPRINT_COLORS, type HandprintColor } from "@/lib/schemas/handprint";
import { COLOR_SWATCHES, PANEL_WIDTH_PCT } from "./constants";
import {
  useHandprintForm,
  type HandprintFormSubmitData,
} from "./useHandprintForm";
import { useLinkErrorFeedback } from "./useLinkErrorFeedback";
import { usePreviewTilt } from "./usePreviewTilt";

/** iOS sheet curve, by way of Ionic. Strong ease-out without a bounce. */
const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;
const ENTER_SLIDE_PX = 22;

interface HandprintPanelProps {
  /** Lets the outside-click handler in useCanvasPlacement tell "inside the
   *  form" from "on the wall". Without it, clicking away never dismissed. */
  formRef: RefObject<HTMLDivElement | null>;
  /** Where the print was placed, 0-100 across the canvas. Decides which side. */
  printX: number;
  formSelectedColor: HandprintColor;
  onColorSelect: (color: HandprintColor) => void;
  onSubmit: (data: HandprintFormSubmitData) => void | Promise<void>;
  onCancel: () => void;
}

/**
 * The desktop form, living inside the frame rather than floating over the page.
 *
 * It replaces a popover that opened wherever you happened to click — which
 * landed somewhere different every time and routinely covered the print it had
 * just created. Anchoring it to the frame makes the position predictable, buys
 * room for a line of copy, and keeps the whole interaction inside the artwork.
 *
 * Laid out across rather than down. The canvas is 3.5:1 and only ~245px tall,
 * so height is the scarce resource and width is abundant: pairing the fields
 * onto one row is what makes a four-row layout fit at all.
 */
export default function HandprintPanel({
  formRef,
  printX,
  formSelectedColor,
  onColorSelect,
  onSubmit,
  onCancel,
}: HandprintPanelProps) {
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
  const reduceMotion = useReducedMotion();

  // False from the moment dismissal begins. AnimatePresence does not reliably
  // unmount this node after its exit finishes, and a leftover at opacity 0 is
  // invisible but still hit-testable — it swallowed every click across its half
  // of the wall. Dropping pointer events on exit makes any straggler inert.
  const isPresent = useIsPresent();


  const { inputRef: linkRef, shakeScope } = useLinkErrorFeedback(linkErrorAt);

  const { tilt: previewTilt, reroll: rerollTilt } = usePreviewTilt(printX);

  const selectColor = (color: HandprintColor) => {
    onColorSelect(color);
    rerollTilt();
  };

  // Sit opposite the fresh print so it stays visible.
  const side = printX < 50 ? "right" : "left";
  const enterFrom = side === "left" ? -ENTER_SLIDE_PX : ENTER_SLIDE_PX;

  return (
    <motion.div
      ref={formRef}
      // pointer-events-auto because the clip box in HandprintCanvas is
      // pointer-events-none and would otherwise swallow clicks on the wall —
      // but only while present. See isPresent above.
      className={`absolute inset-y-0 bg-white flex flex-col ${
        isPresent ? "pointer-events-auto" : "pointer-events-none"
      } ${side === "left" ? "left-0 border-r" : "right-0 border-l"} border-black`}
      style={{ width: `${PANEL_WIDTH_PCT}%` }}
      // Enters from the edge it's anchored to, so it reads as sliding out of
      // the frame rather than appearing on top of the artwork. Deliberately a
      // short travel, not a full-width slide — the panel lives inside a picture
      // frame, and a dramatic sweep would fight the stillness of the wall.
      initial={{ opacity: 0, x: reduceMotion ? 0 : enterFrom }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: reduceMotion ? 0 : enterFrom }}
      transition={{ duration: reduceMotion ? 0.12 : 0.24, ease: EASE_DRAWER }}
    >
      <form
        onSubmit={handleSubmit}
        // Sizes are fractions of the canvas width (see the container-type on
        // HandprintCanvas), so the form grows with the frame instead of sitting
        // at a fixed size while the artwork around it changes. Clamped at both
        // ends: legible on a narrow desktop, not ballooning at the 950px cap.
        //
        // justify-center rather than pushing the actions down with mt-auto —
        // the content is ~150px in a 271px panel, and mt-auto pooled all the
        // slack into one gap above the buttons.
        //
        // overflow-y-auto from the start, not because it's needed at five rows
        // but so that a sixth degrades into a scrollbar rather than a redesign.
        className="flex flex-col justify-center gap-[clamp(8px,1.22cqw,14px)] h-full overflow-y-auto px-[clamp(18px,3.29cqw,36px)] py-[clamp(10px,1.45cqw,16px)]"
      >
        {/* The extra margin sets the greeting apart as a heading rather than
            letting it sit at the same rhythm as the fields. */}
        <div className="mb-[clamp(4px,0.6cqw,8px)]">
          <p className="text-[clamp(13px,1.95cqw,21px)] leading-tight">
            hi, you&apos;re about to leave a mark on my wall!
          </p>
          {/* The reason is no longer shown: the field goes red, shakes, and
              hands back the bad value selected, which says "this one, again"
              without spending a line or shifting the layout. Kept for screen
              readers, where none of that lands — aria-invalid announces that
              something is wrong but never what. */}
          {linkError && (
            <p role="alert" className="sr-only">
              {linkError}
            </p>
          )}
        </div>

        <div className="flex gap-[clamp(16px,3.0cqw,34px)]">
          <label className="flex-1">
            {/* The asterisk marks the only required field, which is cheaper
                than labelling the other one optional. Deliberately not red:
                red is the error colour here, and a permanent red mark would
                blunt it for the moment it's actually needed. */}
            <span className="block text-[clamp(10px,1.5cqw,16px)] text-gray-500 mb-[clamp(2px,0.45cqw,5px)]">
              name <span aria-hidden="true">*</span>
            </span>
            <input
              type="text"
              placeholder="e.g. siphyshu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full text-[clamp(12px,1.78cqw,19px)] pb-[clamp(2px,0.45cqw,5px)] bg-transparent border-b border-dashed border-black focus:outline-none focus:border-solid placeholder-gray-400"
            />
          </label>
          {/* Shaken as a unit — label included — so the whole field recoils
              rather than the text sliding out from under its own heading. */}
          <label className="flex-1" ref={shakeScope}>
            <span
              className={`block text-[clamp(10px,1.5cqw,16px)] mb-[clamp(2px,0.45cqw,5px)] ${
                linkError ? "text-red-600" : "text-gray-500"
              }`}
            >
              your link
            </span>
            <input
              ref={linkRef}
              placeholder="e.g. linktr.ee/you"
              value={link}
              onChange={(e) => changeLink(e.target.value)}
              aria-invalid={linkError !== null}
              className={`w-full text-[clamp(12px,1.78cqw,19px)] pb-[clamp(2px,0.45cqw,5px)] bg-transparent border-b border-dashed focus:outline-none focus:border-solid placeholder-gray-400 ${
                linkError ? "border-red-500 text-red-600" : "border-black"
              }`}
            />
          </label>
        </div>

        {/* The selected swatch becomes the handprint itself rather than sitting
            next to a separate preview. That removes the size mismatch between
            a 34px hand and an 18px dot by deleting the element causing it, and
            it says what's being chosen more directly than a ring does. Circles
            stay for the rest — six small hands read as clutter and make the
            fills harder to compare. */}
        <fieldset>
          <legend className="text-[clamp(10px,1.5cqw,16px)] text-gray-500 mb-[clamp(3px,0.52cqw,6px)]">colour</legend>
          <div className="flex items-center gap-[clamp(8px,1.37cqw,15px)] h-[clamp(21px,3.3cqw,35px)]">
            {HANDPRINT_COLORS.map((color) => {
              const selected = formSelectedColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => selectColor(color)}
                  aria-label={color}
                  aria-pressed={selected}
                  // Fixed box whatever's inside, so promoting one to a hand
                  // doesn't shuffle the others along the row.
                  className="h-[clamp(21px,3.3cqw,35px)] w-[clamp(21px,3.3cqw,35px)] flex items-center justify-center shrink-0"
                >
                  {selected ? (
                    <Image
                      src={`/handprints/${color}.svg`}
                      width={26}
                      height={26}
                      alt=""
                      className="select-none"
                      style={{ transform: `rotate(${previewTilt}deg)` }}
                    />
                  ) : (
                    <span
                      className="h-[clamp(15px,2.47cqw,26px)] w-[clamp(15px,2.47cqw,26px)] rounded-full"
                      style={{ backgroundColor: COLOR_SWATCHES[color] }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Actions get their own row. Mixing a selection control with a commit
            action reads as one undifferentiated strip of things to press. */}
        <div className="flex items-center justify-end gap-[clamp(14px,2.47cqw,26px)]">
          <button
            type="button"
            onClick={onCancel}
            className="text-[clamp(12px,1.78cqw,19px)] text-gray-500 hover:text-black transition-colors"
          >
            cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="text-[clamp(12px,1.78cqw,19px)] px-[clamp(14px,2.47cqw,26px)] py-[clamp(5px,0.7cqw,9px)] border border-black bg-black text-white hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "imprinting…" : "imprint"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
