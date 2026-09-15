"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { HANDPRINT_COLORS, type HandprintColor } from "@/lib/schemas/handprint";
import { COLOR_SWATCHES, PANEL_WIDTH_PCT } from "./constants";
import {
  useHandprintForm,
  type HandprintFormSubmitData,
} from "./useHandprintForm";

/** iOS sheet curve, by way of Ionic. Strong ease-out without a bounce. */
const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;
const ENTER_SLIDE_PX = 22;

interface HandprintPanelProps {
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
  printX,
  formSelectedColor,
  onColorSelect,
  onSubmit,
  onCancel,
}: HandprintPanelProps) {
  const { name, setName, link, changeLink, linkError, isSubmitting, handleSubmit } =
    useHandprintForm(onSubmit);
  const reduceMotion = useReducedMotion();

  // Sit opposite the fresh print so it stays visible.
  const side = printX < 50 ? "right" : "left";
  const enterFrom = side === "left" ? -ENTER_SLIDE_PX : ENTER_SLIDE_PX;

  return (
    <motion.div
      className={`absolute inset-y-0 bg-white flex flex-col ${
        side === "left" ? "left-0 border-r" : "right-0 border-l"
      } border-black`}
      style={{ width: `${PANEL_WIDTH_PCT}%`, zIndex: 25 }}
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
        // overflow-y-auto from the start, not because it's needed at five rows
        // but so that a sixth degrades into a scrollbar rather than a redesign.
        className="flex flex-col gap-[8px] h-full overflow-y-auto px-6 py-[14px]"
      >
        {/* Greeting and subtext are one block rather than two rows. Merging
            them removes a gap from the column, which is what pays for the
            colour label sitting above its swatches instead of beside them. */}
        <div>
          <p className="text-[15px] leading-tight">
            hi, you&apos;re about to leave a mark on my wall!
          </p>
          {/* The error takes the subtext's place rather than adding a row.
              The panel has ~20px spare, so a sixth row would push the actions
              out of view at exactly the moment you need them — and the subtext
              is the most expendable thing on screen while something is wrong. */}
          {linkError ? (
            <p role="alert" className="text-[11.5px] leading-snug text-red-600 mt-1.5">
              {linkError}
            </p>
          ) : (
            <p className="text-[11.5px] leading-snug text-gray-500 mt-1.5">
              it stays as long as this site does, and fades slowly over the years —
              like the faintest ones already have.
            </p>
          )}
        </div>

        <div className="flex gap-[22px]">
          <label className="flex-1">
            <span className="block text-[11px] text-gray-500 mb-1">name</span>
            <input
              type="text"
              placeholder="e.g. siphyshu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full text-[13px] pb-1 bg-transparent border-b border-dashed border-black focus:outline-none focus:border-solid placeholder-gray-400"
            />
          </label>
          <label className="flex-1">
            <span className="block text-[11px] text-gray-500 mb-1">link (optional)</span>
            <input
              placeholder="e.g. linktr.ee/you"
              value={link}
              onChange={(e) => changeLink(e.target.value)}
              aria-invalid={linkError !== null}
              className={`w-full text-[13px] pb-1 bg-transparent border-b border-dashed focus:outline-none focus:border-solid placeholder-gray-400 ${
                linkError ? "border-red-500" : "border-black"
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
          <legend className="text-[11px] text-gray-500 mb-[5px]">colour</legend>
          <div className="flex items-center gap-[10px] h-[26px]">
            {HANDPRINT_COLORS.map((color) => {
              const selected = formSelectedColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => onColorSelect(color)}
                  aria-label={color}
                  aria-pressed={selected}
                  // Fixed box whatever's inside, so promoting one to a hand
                  // doesn't shuffle the others along the row.
                  className="h-[26px] w-[26px] flex items-center justify-center shrink-0"
                >
                  {selected ? (
                    <Image
                      src={`/handprints/${color}.svg`}
                      width={26}
                      height={26}
                      alt=""
                      className="-rotate-[8deg] select-none"
                    />
                  ) : (
                    <span
                      className="h-[18px] w-[18px] rounded-full"
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
        <div className="flex items-center justify-end gap-[18px] mt-auto">
          <button
            type="button"
            onClick={onCancel}
            className="text-[13px] text-gray-500 hover:text-black transition-colors"
          >
            cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="text-[13px] px-[18px] py-[6px] border border-black bg-black text-white hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "imprinting…" : "imprint"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
