"use client";

import Image from "next/image";
import { HANDPRINT_COLORS, type HandprintColor } from "@/lib/schemas/handprint";
import { COLOR_SWATCHES, PANEL_WIDTH_PCT } from "./constants";
import {
  useHandprintForm,
  type HandprintFormSubmitData,
} from "./useHandprintForm";

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

  // Sit opposite the fresh print so it stays visible.
  const side = printX < 50 ? "right" : "left";

  return (
    <div
      className={`absolute inset-y-0 bg-white flex flex-col ${
        side === "left" ? "left-0 border-r" : "right-0 border-l"
      } border-black`}
      style={{ width: `${PANEL_WIDTH_PCT}%`, zIndex: 25 }}
    >
      <form
        onSubmit={handleSubmit}
        // overflow-y-auto from the start, not because it's needed at four rows
        // but so that a fifth degrades into a scrollbar rather than a redesign.
        className="flex flex-col gap-[14px] h-full overflow-y-auto px-6 py-[18px]"
      >
        {/* The error replaces this line rather than adding a row — the panel
            has no spare height, and the message is transient. */}
        <p className={`text-[15px] leading-snug ${linkError ? "text-red-600" : ""}`}>
          {linkError ?? "hi, you're about to leave a mark on my wall!"}
        </p>

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

        {/* Preview plus swatches. The preview is what actually reads as the
            colour indicator — you're choosing a hand, so it shows the hand. */}
        <div className="flex items-center gap-[14px]">
          <Image
            src={`/handprints/${formSelectedColor}.svg`}
            width={34}
            height={34}
            alt=""
            className="-rotate-[9deg] select-none"
          />
          <div className="flex gap-[9px]">
            {HANDPRINT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onColorSelect(color)}
                aria-label={color}
                aria-pressed={formSelectedColor === color}
                className={`h-[18px] w-[18px] rounded-full ${
                  formSelectedColor === color
                    ? "outline outline-[1.5px] outline-offset-2 outline-black"
                    : ""
                }`}
                style={{ backgroundColor: COLOR_SWATCHES[color] }}
              />
            ))}
          </div>
        </div>

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
    </div>
  );
}
