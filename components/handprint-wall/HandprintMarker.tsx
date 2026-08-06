"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import type { Handprint } from "@/lib/schemas/handprint";
import type { TempHandprint } from "./useCanvasPlacement";

interface HandprintMarkerProps {
  handprint: Handprint | TempHandprint;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

const LABEL_MARGIN = 10;

function getLabelStyle(handprint: Handprint | TempHandprint): CSSProperties {
  const style: CSSProperties = {
    position: "absolute",
    whiteSpace: "nowrap",
    pointerEvents: "none",
  };

  if (handprint.y < 20) {
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

export default function HandprintMarker({
  handprint,
  isHovered,
  onHover,
  onLeave,
}: HandprintMarkerProps) {
  const name = "name" in handprint ? handprint.name : undefined;
  const link = "link" in handprint ? handprint.link : undefined;

  return (
    <>
      {/* Marker image */}
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

      {/* Hover label — anchored at the exact point, positioned around it to avoid clipping near edges */}
      {isHovered && name && (
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
      )}
    </>
  );
}
