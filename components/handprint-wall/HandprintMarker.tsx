"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import type { Handprint } from "@/lib/schemas/handprint";
import type { TempHandprint } from "./useCanvasPlacement";

const LABEL_MARGIN = 10;
const VERTICAL_FLIP_THRESHOLD = 20;

function getLabelStyle(handprint: Handprint | TempHandprint): CSSProperties {
  const style: CSSProperties = {
    position: "absolute",
    whiteSpace: "nowrap",
    pointerEvents: "none",
  };

  if (handprint.y < VERTICAL_FLIP_THRESHOLD) {
    style.top = "100%";
    style.marginTop = "5px";
  } else {
    style.bottom = "100%";
    style.marginBottom = "5px";
  }

  if (handprint.x < LABEL_MARGIN) {
    style.left = "0";
  } else if (handprint.x > 100 - LABEL_MARGIN) {
    style.right = "0";
  } else {
    style.left = "50%";
    style.transform = "translateX(-50%)";
  }

  return style;
}

function formatLink(link: string | null | undefined) {
  if (!link) return "";
  return link.replace(/^https?:\/\//, "").replace(/^www\./, "");
}

interface HandprintMarkerProps {
  handprint: Handprint | TempHandprint;
  onHover: () => void;
  onLeave: () => void;
}

// The dot itself. Lives inside the canvas's overflow-hidden box, so it
// stays cropped to the picture frame like the rest of the wall — that
// clipping is a deliberate part of the look.
export default function HandprintMarker({ handprint, onHover, onLeave }: HandprintMarkerProps) {
  const link = "link" in handprint ? handprint.link : undefined;

  return (
    <div
      className={`absolute ${link ? "cursor-pointer" : "cursor-default"} w-[24px] h-[24px] sm:w-[26px] sm:h-[26px] md:w-[28px] md:h-[28px] lg:w-[30px] lg:h-[30px]`}
      style={{
        left: `${handprint.x}%`,
        top: `${handprint.y}%`,
        transform: `translate(-50%, -50%) rotate(${handprint.angle}deg)`,
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={(e) => {
        e.stopPropagation();
        if (link) window.open(link, "_blank");
      }}
    >
      <Image
        src={`/handprints/${handprint.color}.svg`}
        width={30}
        height={30}
        alt=""
        className="w-full h-full select-none"
      />
    </div>
  );
}

// The hover tooltip. Rendered by HandprintCanvas in a separate, unclipped
// overlay so it can sit in its natural spot (above/below the marker,
// whichever the heuristic below picks) without being cropped by the canvas's
// overflow-hidden frame. A marker dot has a reason to be cropped at the
// frame edge; a tooltip popping up over the surrounding page doesn't — it's
// no different from any other tooltip briefly overlaying nearby content.
export function HandprintLabel({ handprint }: { handprint: Handprint }) {
  const { name, link } = handprint;

  return (
    <div
      className="absolute"
      style={{
        left: `${handprint.x}%`,
        top: `${handprint.y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: 10,
      }}
    >
      <div
        className="bg-red-50 bg-opacity-2 border border-black text-black px-2 py-1 font-serif pointer-events-none"
        style={getLabelStyle(handprint)}
      >
        {handprint.color === "paw" && (
          <div className="mt-2">
            <Image
              src="/images/santa.jpg"
              width={90}
              height={50}
              alt="Santa (Billu), My Cat"
              className="pb-1"
            />
          </div>
        )}
        {name}
        {link && <span className="ml-1 text-xs">({formatLink(link)})</span>}
      </div>
    </div>
  );
}
