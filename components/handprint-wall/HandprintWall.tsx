"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import type { HandprintInput } from "@/lib/schemas/handprint";
import { validateLink } from "@/lib/schemas/link";
import { useHandprints } from "./useHandprints";
import { useCanvasPlacement } from "./useCanvasPlacement";
import HandprintCanvas from "./HandprintCanvas";
import HandprintForm from "./HandprintForm";
import HandprintPanel from "./HandprintPanel";
import { useIsMobile } from "./useIsMobile";
import type { HandprintFormSubmitData } from "./useHandprintForm";

interface HandprintWallProps {
  className?: string;
}

const TOAST_OPTIONS = {
  position: "bottom-right" as const,
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  className: "bg-red-50 bg-opacity-2 border border-black text-black font-serif",
};

export default function HandprintWall({ className }: HandprintWallProps) {
  const { handprints, loadError, addHandprint } = useHandprints();
  const placement = useCanvasPlacement(handprints);
  // Hoisted out of the form: two different components now branch on it, and
  // the canvas needs to know whether to make room for the in-frame panel.
  const isMobile = useIsMobile();

  useEffect(() => {
    if (loadError) {
      toast.error("Failed to load handprints. Please refresh the page.");
    }
  }, [loadError]);

  const handleSubmit = async ({ name, link }: HandprintFormSubmitData) => {
    if (!placement.tempHandprint) return;

    // The form has already blocked an invalid link inline; this re-runs the
    // same shared validator so the two can't drift, and so a link is never
    // normalized differently here than the API will normalize it.
    let normalizedLink: string | null = null;
    if (link.trim()) {
      const result = validateLink(link);
      if (!result.ok) {
        toast.error(result.reason, TOAST_OPTIONS);
        return;
      }
      normalizedLink = result.value;
    }

    const input: HandprintInput = {
      x: placement.tempHandprint.x,
      y: placement.tempHandprint.y,
      angle: placement.tempHandprint.angle,
      color: placement.formSelectedColor,
      name: name || "Anonymous",
      link: normalizedLink,
    };

    const success = await addHandprint(input);

    if (success) {
      placement.resetForm();
      toast.success("30,000 years later, we still say: 'I was here.'", TOAST_OPTIONS);
    } else {
      toast.error("Failed to leave a mark. It's okay, try again later.", TOAST_OPTIONS);
    }
  };

  return (
    <div className="w-full flex justify-center flex-col items-center">
      <HandprintCanvas
        className={className}
        canvasRef={placement.canvasRef}
        handprints={handprints}
        tempHandprint={placement.tempHandprint}
        cursorPosition={placement.cursorPosition}
        isMouseInside={placement.isMouseInside}
        showCursor={placement.showCursor}
        activeHandprint={placement.activeHandprint}
        isLabelSticky={placement.isLabelSticky}
        onHoverHandprint={placement.hoverHandprint}
        onTapHandprint={placement.tapHandprint}
        onCanvasClick={placement.handleCanvasClick}
        onCanvasPointerMove={placement.handleCanvasPointerMove}
        onCanvasLeave={placement.handleCanvasLeave}
        panel={
          !isMobile && placement.tempHandprint ? (
            <HandprintPanel
              // AnimatePresence in HandprintCanvas tracks its children by key.
              // Without one it can't tell that this element has gone, so the
              // exit never completes and the panel is left orphaned in the DOM
              // — state clears underneath it, but it stays on screen and no
              // further dismissal does anything.
              key="handprint-panel"
              printX={placement.tempHandprint.x}
              formSelectedColor={placement.formSelectedColor}
              onColorSelect={placement.setFormSelectedColor}
              onSubmit={handleSubmit}
              onCancel={placement.resetForm}
            />
          ) : null
        }
      />

      <p className="italic text-sm text-gray-600 mt-4 text-center md:text-right w-full px-6 lg:px-0">
        From cave walls to pixels: the human urge to leave a trace endures. 🖐️
      </p>

      {/* Keeps the sheet mounted long enough to animate out. Without it the
          form is unmounted the instant formPosition clears and just vanishes,
          which reads as a glitch next to how deliberately it arrives. */}
      <AnimatePresence>
        {isMobile && placement.formPosition && (
          <>
            {/* Scrim behind the mobile sheet. A bottom drawer with nothing
                behind it leaves the page live, so a touch just outside it
                scrolls the wall out from under the form. Catching those
                touches is the job; the tint only makes the modality visible.
                sm:hidden rather than a JS check — Tailwind's sm breakpoint is
                640px, the same MOBILE_BREAKPOINT the form switches layout at,
                and the desktop form is a popover that wants no scrim. */}
            <motion.div
              key="scrim"
              className="fixed inset-0 bg-black/20 sm:hidden"
              style={{ zIndex: 19, touchAction: "none" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              onClick={placement.resetForm}
              aria-hidden="true"
            />
            <HandprintForm
              key="sheet"
              formRef={placement.formRef}
              formSelectedColor={placement.formSelectedColor}
              onColorSelect={placement.setFormSelectedColor}
              onSubmit={handleSubmit}
              onCancel={placement.resetForm}
            />
          </>
        )}
      </AnimatePresence>

      <ToastContainer />
    </div>
  );
}
