"use client";

import { useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import type { HandprintInput } from "@/lib/schemas/handprint";
import { useHandprints } from "./useHandprints";
import { useCanvasPlacement } from "./useCanvasPlacement";
import HandprintCanvas from "./HandprintCanvas";
import HandprintForm, { type HandprintFormSubmitData } from "./HandprintForm";

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

  useEffect(() => {
    if (loadError) {
      toast.error("Failed to load handprints. Please refresh the page.");
    }
  }, [loadError]);

  const handleSubmit = async ({ name, link }: HandprintFormSubmitData) => {
    if (!placement.tempHandprint) return;

    let formattedLink = link;
    if (link && !link.startsWith("http")) {
      formattedLink = `https://${link}`;
    }

    const input: HandprintInput = {
      x: placement.tempHandprint.x,
      y: placement.tempHandprint.y,
      angle: placement.tempHandprint.angle,
      color: placement.formSelectedColor,
      name: name || "Anonymous",
      link: formattedLink || null,
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
        hoveredHandprint={placement.hoveredHandprint}
        onHoverHandprint={placement.setHoveredHandprint}
        onCanvasClick={placement.handleCanvasClick}
        onCanvasHover={placement.handleCanvasHover}
        onCanvasLeave={placement.handleCanvasLeave}
      />

      <p className="italic text-sm text-gray-600 mt-4 text-center md:text-right w-full px-6 lg:px-0">
        From cave walls to pixels: the human urge to leave a trace endures. 🖐️
      </p>

      {placement.formPosition && (
        <HandprintForm
          formRef={placement.formRef}
          formPosition={placement.formPosition}
          formSelectedColor={placement.formSelectedColor}
          onColorSelect={placement.setFormSelectedColor}
          onSubmit={handleSubmit}
          onCancel={placement.resetForm}
        />
      )}

      <ToastContainer />
    </div>
  );
}
