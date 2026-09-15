"use client";

import Image from "next/image";
import type { MouseEvent, PointerEvent, ReactNode, RefObject } from "react";
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
  activeHandprint: Handprint | TempHandprint | null;
  /** Whether the active label was opened by a tap, and so accepts input. */
  isLabelSticky: boolean;
  onHoverHandprint: (handprint: Handprint | TempHandprint | null) => void;
  onTapHandprint: (handprint: Handprint | TempHandprint) => void;
  onCanvasClick: (e: MouseEvent<HTMLDivElement>) => void;
  onCanvasPointerMove: (e: PointerEvent<HTMLDivElement>) => void;
  onCanvasLeave: (e: PointerEvent<HTMLDivElement>) => void;
  /**
   * The in-frame form, on viewports wide enough for it. Rendered here rather
   * than by the wall because it has to sit inside the frame: this component's
   * outer element carries the frame's border-image, so an absolutely
   * positioned child of it lands exactly on the canvas.
   */
  panel?: ReactNode;
  /** Whether the panel is actually showing. `panel` is now always a truthy
   *  AnimatePresence wrapper, so it can no longer stand in for "open". */
  panelOpen?: boolean;
  /** Dismiss, for the backdrop below. */
  onDismissPanel?: () => void;
}

/** How far the rest of the wall recedes while a print is being placed. Small
 *  on purpose: enough to separate the fresh hand, not enough to read as the
 *  artwork being obscured. */
const WALL_BLUR_PX = 1.4;

export default function HandprintCanvas({
  className,
  canvasRef,
  handprints,
  tempHandprint,
  cursorPosition,
  isMouseInside,
  showCursor,
  activeHandprint,
  isLabelSticky,
  onHoverHandprint,
  onTapHandprint,
  onCanvasClick,
  onCanvasPointerMove,
  onCanvasLeave,
  panel,
  panelOpen,
  onDismissPanel,
}: HandprintCanvasProps) {
  return (
    // container-type makes this the reference for the panel's cqw sizing, so
    // the form scales with the frame instead of staying fixed while the
    // artwork around it grows. Safe here: the only fixed-position element in
    // the wall (the mobile sheet) is a sibling, not a descendant — containment
    // would otherwise make this its containing block.
    <div
      className={`relative w-full max-w-[950px] min-w-[300px] [container-type:inline-size] ${className ?? ""}`}
    >
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
          // Inherited by every marker; the one being placed overrides it back
          // to 0 so it stays sharp while the rest of the wall softens.
          ["--hp-blur" as string]: panelOpen ? `${WALL_BLUR_PX}px` : "0px",
        }}
        onClick={onCanvasClick}
        onPointerMove={onCanvasPointerMove}
        onPointerLeave={onCanvasLeave}
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
            onTap={() => onTapHandprint(handprint)}
          />
        ))}
        {tempHandprint && (
          <HandprintMarker
            key="temp-preview"
            handprint={tempHandprint}
            onHover={() => onHoverHandprint(tempHandprint)}
            onLeave={() => onHoverHandprint(null)}
            onTap={() => onTapHandprint(tempHandprint)}
            isPreview
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

        {/* "N were here" counter. Hidden while the panel is open: the panel
            takes one full side of the frame and the counter is always in the
            bottom-left, so they collide whenever the panel flips left. Nobody
            needs a visitor count mid-signature anyway. */}
        {handprints.length > 0 && !panelOpen && (
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
          real, named handprints get a label; the temp preview never does.

          The layer stays pointer-events-none; a tapped-open label re-enables
          input on itself alone, so the rest of the canvas underneath keeps
          receiving the taps that place a print. */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
        {activeHandprint && "name" in activeHandprint && (
          <HandprintLabel handprint={activeHandprint} interactive={isLabelSticky} />
        )}
      </div>

      {/* Clips the panel to the canvas. It slides in from the edge it's
          anchored to, and that travel takes it briefly outside the padding box
          and over the wooden border — visible for a fraction of a second if
          you're watching for it.

          Scoped to the panel rather than put on the wrapper: the tooltip layer
          above deliberately escapes the canvas so a hover label isn't cropped
          at the frame, and clipping the wrapper would undo that.

          pointer-events-none so this box doesn't swallow clicks on the wall
          while no panel is open; the panel itself takes them back.

          The AnimatePresence that keeps it mounted through its exit lives in
          HandprintWall, beside the condition it tracks — handed down as a
          rendered prop it never saw the child come or go, and the exit snapped
          instead of animating. The panel also drops pointer events as soon as
          it stops being present, so a node left behind at opacity 0 is inert
          rather than an invisible trap over half the wall. */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ zIndex: 25 }}
      >
        {/* Backdrop. Without it a click beside the panel dismissed it *and*
            went through to whatever was underneath — placing a print, or
            following a handprint's link. One gesture, two outcomes, and the
            second one was never intended. Catching it here means the click
            that closes the form does only that.

            Transparent: the panel is opaque and already inside the frame, so
            there's nothing to dim. It exists purely to absorb the click. */}
        {panelOpen && (
          <div
            className="absolute inset-0 pointer-events-auto"
            onClick={onDismissPanel}
            aria-hidden="true"
          />
        )}
        {panel}
      </div>
    </div>
  );
}
