"use client";

import Image from "next/image";
import type { MouseEvent, RefObject } from "react";
import type { Handprint } from "@/lib/schemas/handprint";
import type { AgedHandprint } from "./age";
import type { TempHandprint } from "./useCanvasPlacement";
import HandprintMarker, { HandprintLabel } from "./HandprintMarker";

interface HandprintCanvasProps {
  className?: string;
  canvasRef: RefObject<HTMLDivElement | null>;
  handprints: AgedHandprint[];
  tempHandprint: TempHandprint | null;
  cursorPosition: { x: number; y: number };
  isMouseInside: boolean;
  showCursor: boolean;
  hoveredHandprint: Handprint | TempHandprint | null;
  onHoverHandprint: (handprint: Handprint | TempHandprint | null) => void;
  onCanvasClick: (e: MouseEvent<HTMLDivElement>) => void;
  onCanvasHover: (e: MouseEvent<HTMLDivElement>) => void;
  onCanvasLeave: () => void;
}

export default function HandprintCanvas({
  className,
  canvasRef,
  handprints,
  tempHandprint,
  cursorPosition,
  isMouseInside,
  showCursor,
  hoveredHandprint,
  onHoverHandprint,
  onCanvasClick,
  onCanvasHover,
  onCanvasLeave,
}: HandprintCanvasProps) {
  return (
    <div className={`relative w-full max-w-[950px] min-w-[300px] ${className ?? ""}`}>
      <div
        ref={canvasRef}
        className={`bg-gray-100 overflow-hidden relative w-full aspect-[3.5/1] min-h-[200px] ${
          showCursor ? "cursor-none" : ""
        }`}
        style={{
          backgroundImage: "url(/images/canvasbg2.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
        onClick={onCanvasClick}
        onMouseMove={onCanvasHover}
        onMouseLeave={onCanvasLeave}
      >
        {/* White overlay */}
        <div
          className="absolute inset-0 bg-white bg-opacity-30 pointer-events-none"
          style={{ zIndex: 0 }}
        />

        {/* Handprints (+ live temp preview). Rendered as two passes rather
            than one concatenated list so each real print keys off its own id
            and the preview gets a fixed key of its own — an index key over the
            combined array hands the preview's identity to a real print the
            moment an optimistic insert shifts the list. */}
        {handprints.map((handprint) => (
          <HandprintMarker
            key={handprint.id}
            handprint={handprint}
            age={handprint.age}
            onHover={() => onHoverHandprint(handprint)}
            onLeave={() => onHoverHandprint(null)}
          />
        ))}
        {tempHandprint && (
          <HandprintMarker
            key="temp-preview"
            handprint={tempHandprint}
            onHover={() => onHoverHandprint(tempHandprint)}
            onLeave={() => onHoverHandprint(null)}
          />
        )}

        {/* Cursor */}
        {showCursor && isMouseInside && (
          <div
            className="absolute pointer-events-none w-[24px] h-[24px] sm:w-[26px] sm:h-[26px] md:w-[28px] md:h-[28px] lg:w-[30px] lg:h-[30px]"
            style={{
              left: `${cursorPosition.x}px`,
              top: `${cursorPosition.y}px`,
              transform: "translate(-50%, -50%)",
              zIndex: 30,
            }}
          >
            <Image
              src="/handprints/black.svg"
              width={30}
              height={30}
              alt="Cursor"
              className="w-full h-full"
            />
          </div>
        )}

        {/* "N were here" counter */}
        {handprints.length > 0 && (
          <div
            className="absolute bottom-2 left-2 bg-red-50 bg-opacity-2 border border-black p-1 pointer-events-auto select-none"
            style={{ zIndex: 10 }}
          >
            <p className="text-sm font-serif">{handprints.length} were here</p>
          </div>
        )}
      </div>

      {/* Tooltip layer — sits outside the overflow-hidden canvas box (but
          in the same coordinate space, via inset-0) so a label can pop up
          in its natural spot without being cropped by the frame. Only the
          real, named handprints get a label; the temp preview never does. */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
        {hoveredHandprint && "name" in hoveredHandprint && (
          <HandprintLabel handprint={hoveredHandprint} />
        )}
      </div>
    </div>
  );
}
