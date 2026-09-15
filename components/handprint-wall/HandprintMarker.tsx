"use client";

import Image from "next/image";
import { useRef, type CSSProperties } from "react";
import type { Handprint } from "@/lib/schemas/handprint";
import type { TempHandprint } from "./useCanvasPlacement";

/**
 * How close to an edge a print has to be before its label anchors to that edge
 * instead of centring on the marker.
 *
 * Generous, because the label is anchored to the print but is far wider than
 * it. A label centred on a marker at x=20% runs off the left of the canvas
 * long before the marker itself gets near it — which is what the old 10%
 * threshold missed: a 39-character link on a print at x=80% was still being
 * centred, and ran clean off the right edge.
 */
const EDGE_ANCHOR_PCT = 30;
const VERTICAL_FLIP_THRESHOLD = 20;

function getLabelStyle(
  handprint: Handprint | TempHandprint,
  interactive: boolean
): CSSProperties {
  const style: CSSProperties = {
    position: "absolute",
    // One line, always. Wrapping kept the label inside the frame but let it
    // grow downward into a block covering a third of the wall — worse than the
    // overflow it fixed. Anything past the width budget below is clipped with
    // an ellipsis instead; the name leads, so the part that gets cut is the
    // tail of a URL nobody reads.
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    // Only a tapped-open label accepts input. A hover label stays inert so it
    // can't intercept pointer moves meant for the canvas — cursor tracking and
    // placement both read from events the label would otherwise eat.
    pointerEvents: interactive ? "auto" : "none",
  };

  if (handprint.y < VERTICAL_FLIP_THRESHOLD) {
    style.top = "100%";
    style.marginTop = "5px";
  } else {
    style.bottom = "100%";
    style.marginBottom = "5px";
  }

  // Percentages below resolve against the full-width wrapper in HandprintLabel,
  // so each max-width is literally "the canvas space left on the side this
  // label grows toward". Nothing can overflow the frame regardless of length.
  const { x } = handprint;

  if (x < EDGE_ANCHOR_PCT) {
    style.left = `${x}%`;
    style.maxWidth = `${100 - x}%`;
  } else if (x > 100 - EDGE_ANCHOR_PCT) {
    style.right = `${100 - x}%`;
    style.maxWidth = `${x}%`;
  } else {
    style.left = `${x}%`;
    style.transform = "translateX(-50%)";
    // Centred, so it grows both ways: the limit is twice the nearer edge.
    style.maxWidth = `${Math.min(x, 100 - x) * 2}%`;
  }

  return style;
}

/**
 * Longest link text shown. The full URL still goes in the href — this is only
 * what's readable. Kept short deliberately: the domain is what tells you where
 * a link goes, and it comes first, so the characters lost are the tail of a
 * path or a tracking parameter. This does most of the work; the ellipsis in
 * getLabelStyle is only the backstop for a long name next to a long link.
 */
const MAX_LINK_CHARS = 26;

function formatLink(link: string | null | undefined) {
  if (!link) return "";
  const bare = link
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
  return bare.length > MAX_LINK_CHARS ? `${bare.slice(0, MAX_LINK_CHARS - 1)}…` : bare;
}

// Where a fully weathered print bottoms out. Expressed as floors rather than
// falloffs so the guarantee is readable: nothing on the wall ever renders
// below WEATHERED_OPACITY, however old it gets.
//
// Deepened from 0.74/0.76/0.10 once the curve in ./age could actually reach
// them. Under half-life decay the oldest print only ever got to age 0.78, so
// the floors were unreachable and the wall used a 0.20 opacity range against a
// configured 0.26 — deepening them alone would have changed nothing. Against a
// linear map the full range is always in use, and these give 0.45.
const WEATHERED_OPACITY = 0.55;
const WEATHERED_SATURATION = 0.6;
const WEATHERED_SEPIA = 0.18;

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

/**
 * Inset of the mouse hit layer, derived from MARKER_HIT_SCALE. Written as a
 * literal because Tailwind only sees class names it can find in the source —
 * a computed `inset-[${n}%]` would never be generated.
 */
const HIT_INSET = "inset-[14%]";

interface HandprintMarkerProps {
  handprint: Handprint | TempHandprint;
  /** 0 = newest, 1 = oldest. The temp preview is always "new". */
  age?: number;
  /** Mouse only. */
  onHover: () => void;
  /** Mouse only. */
  onLeave: () => void;
  /** Touch/pen only — opens the label instead of following the link. */
  onTap: () => void;
  /** The live preview of the print being placed, not one already on the wall. */
  isPreview?: boolean;
}

// The dot itself. Lives inside the canvas's overflow-hidden box, so it
// stays cropped to the picture frame like the rest of the wall — that
// clipping is a deliberate part of the look.
export default function HandprintMarker({
  handprint,
  age = 0,
  onHover,
  onLeave,
  onTap,
  isPreview = false,
}: HandprintMarkerProps) {
  const link = "link" in handprint ? handprint.link : undefined;

  // Whether pointerup already acted on this interaction, and so the click
  // trailing it belongs to the marker rather than to the wall underneath.
  // A ref rather than something derived in the click handler because `click`
  // carries no pointerType, and on touch it is a compatibility event fired
  // after the fact — there is nothing left to inspect by then.
  const handledRef = useRef(false);

  return (
    <div
      className="handprint-marker absolute w-[24px] h-[24px] sm:w-[26px] sm:h-[26px] md:w-[28px] md:h-[28px] lg:w-[30px] lg:h-[30px]"
      style={
        {
          left: `${handprint.x}%`,
          top: `${handprint.y}%`,
          transform: `translate(-50%, -50%) rotate(${handprint.angle}deg)`,
          "--hp-opacity": lerp(1, WEATHERED_OPACITY, age),
          "--hp-saturate": lerp(1, WEATHERED_SATURATION, age),
          "--hp-sepia": lerp(0, WEATHERED_SEPIA, age),
          // Stays sharp while the wall behind it softens. Overrides the value
          // the canvas sets on every marker.
          ...(isPreview ? { "--hp-blur": "0px" } : {}),
        } as CSSProperties
      }
      // Every interaction starts unhandled, so a stale flag from a pointerup
      // whose click never arrived (the pointer left the marker mid-press)
      // can't go on to eat the next placement click in the corners.
      onPointerDown={() => {
        handledRef.current = false;
      }}
      // Touch and pen only — the whole box stays their target. See
      // MARKER_HIT_SCALE for why they don't get the shrunken circle.
      onPointerUp={(e) => {
        if (e.pointerType === "mouse") return;
        e.stopPropagation();
        handledRef.current = true;
        // Touch has no hover, so the first tap has to be what reveals who
        // this is. The link moves into the label and is followed from there.
        onTap();
      }}
      // Keeps the canvas from treating the tail end of a marker interaction as
      // a click on empty wall. pointerup already did the work. Conditional now
      // that the corners of this box are deliberately click-through: an
      // unconditional stop here would swallow exactly the placements the
      // smaller hit area exists to allow.
      onClick={(e) => {
        if (!handledRef.current) return;
        handledRef.current = false;
        e.stopPropagation();
      }}
    >
      {/* Behind the hand, and inset negatively so it reads as a halo on the
          wall rather than an outline on the print. Only while you're placing:
          it marks this moment, not a property of the mark. */}
      {isPreview && (
        <span
          aria-hidden="true"
          className="handprint-ring absolute inset-[-38%] rounded-full border border-black/25"
        />
      )}

      <Image
        src={`/handprints/${handprint.color}.svg`}
        width={30}
        height={30}
        alt=""
        className={`w-full h-full select-none ${isPreview ? "handprint-press" : ""}`}
      />

      {/* The mouse hit area: a circle inscribed in the box and pulled in, so
          the transparent corners of a splayed hand stop intercepting clicks
          meant for the wall. border-radius clips hit-testing, not just paint,
          which is the whole trick — there is nothing to draw here.

          Rotates with the marker, but a circle doesn't care, so crowding no
          longer depends on the random angle a print happens to have. */}
      <div
        className={`absolute ${HIT_INSET} rounded-full ${
          link ? "cursor-pointer" : "cursor-default"
        }`}
        // Gating on pointerType is not optional: pointerenter/pointerleave
        // also fire for touch (on touchstart/touchend), so an ungated handler
        // would open a label and close it again within the same tap.
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") onHover();
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") onLeave();
        }}
        onPointerUp={(e) => {
          if (e.pointerType !== "mouse") return;
          e.stopPropagation();
          handledRef.current = true;
          // Links here are visitor-submitted, so the opened tab must not get a
          // window.opener handle back to this one. Unlike <a target="_blank">,
          // window.open() does not imply noopener.
          if (link) window.open(link, "_blank", "noopener,noreferrer");
        }}
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
export function HandprintLabel({
  handprint,
  interactive = false,
}: {
  handprint: Handprint;
  /** Opened by a tap, so the link inside is reachable. See getLabelStyle. */
  interactive?: boolean;
}) {
  const { name, link } = handprint;

  return (
    // Spans the canvas horizontally rather than collapsing to a point at the
    // marker. It stays zero-height, so the above/below flip is unchanged, but
    // the label's percentage left/right/max-width now resolve against the
    // canvas instead of against a 0px-wide box — which is what lets a width
    // bound exist at all. Horizontal placement moved onto the label itself.
    <div
      className="absolute inset-x-0"
      style={{
        top: `${handprint.y}%`,
        zIndex: 10,
      }}
    >
      <div
        className="bg-red-50 bg-opacity-2 border border-black text-black px-2 py-1 font-serif"
        style={getLabelStyle(handprint, interactive)}
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
        {link &&
          (interactive ? (
            // A real anchor, not window.open: iOS blocks window.open when it
            // isn't tied tightly enough to a user gesture, and an anchor is
            // focusable for free.
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-xs underline"
            >
              ({formatLink(link)})
            </a>
          ) : (
            <span className="ml-1 text-xs">({formatLink(link)})</span>
          ))}
      </div>
    </div>
  );
}
