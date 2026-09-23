import { readFileSync } from "node:fs";
import path from "node:path";
import { withAges } from "@/components/handprint-wall/age";
import { getAge } from "@/lib/age";
import type { Handprint } from "@/lib/schemas/handprint";

export const OG_SIZE = { width: 1200, height: 630 };

/**
 * The share card's markup, shared by the image route and the dev preview at
 * /og-preview so the two can't drift.
 *
 * Everything here must stay inside the subset of CSS that Satori implements,
 * because a browser will happily render things the image never will. Known
 * gaps, all found the hard way:
 *
 *   - no CSS filters, so weathering is opacity only
 *   - no border-image, so the frame is a gradient
 *   - flexGrow is ignored
 *   - any element with more than one child must declare display: flex, or the
 *     render dies silently — the response stream just ends
 *
 * Laid out in absolute pixels rather than percentages, which leaves nothing
 * for Satori to interpret.
 */
const HAND = 32; // scaled from 30px against the site's 950px canvas
const WEATHERED_OPACITY = 0.55;
const INK = "#111";
const MUTED = "#6b6b6b";
const RULE = "#d8d8d8";

const asset = (...p: string[]) => readFileSync(path.join(process.cwd(), "public", ...p));
const dataUri = (file: Buffer, mime: string) =>
  `data:${mime};base64,${file.toString("base64")}`;

export const ogFonts = {
  regular: asset("fonts", "PTSerif-Regular.ttf"),
  bold: asset("fonts", "PTSerif-Bold.ttf"),
};

const avatar = dataUri(asset("images", "jaiyank.jpg"), "image/jpeg");
const avatarAlt = dataUri(asset("images", "siphyshu.jpg"), "image/jpeg");

const handSvg = new Map<string, string>();
function handSrc(color: string): string {
  const cached = handSvg.get(color);
  if (cached) return cached;
  const uri = dataUri(asset("handprints", `${color}.svg`), "image/svg+xml");
  handSvg.set(color, uri);
  return uri;
}

export type OgVariant = "framed" | "bleed" | "card";

type Aged = ReturnType<typeof withAges>;

function Avatars({ size = 112 }: { size?: number }) {
  const small = Math.round(size * 0.45);
  return (
    <div style={{ display: "flex", position: "relative", width: size, height: size }}>
      <img src={avatar} alt="" width={size} height={size} style={{ borderRadius: "50%" }} />
      <img
        src={avatarAlt}
        alt=""
        width={small}
        height={small}
        style={{
          position: "absolute",
          right: -2,
          bottom: -2,
          borderRadius: "50%",
          border: "4px solid #ffffff",
        }}
      />
    </div>
  );
}

/** The wall itself. Width drives height, since the aspect is fixed at 3.5:1. */
function Wall({ aged, width, crop }: { aged: Aged; width: number; crop?: number }) {
  const height = crop ?? Math.round(width / 3.5);
  const fullH = Math.round(width / 3.5);
  const offset = fullH - height; // crop from the bottom of the wall
  const onWall = aged.filter((h) => h.x >= 0 && h.x <= 100 && h.y >= 0 && h.y <= 100);

  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width,
        height,
        overflow: "hidden",
        background: "#f6f2e8",
      }}
    >
      {onWall.map((h) => (
        <img
          key={h.id}
          src={handSrc(h.color)}
          alt=""
          width={HAND}
          height={HAND}
          style={{
            position: "absolute",
            // Offset by half rather than translate(-50%): one fewer transform
            // for Satori to resolve.
            left: Math.round((h.x / 100) * width - HAND / 2),
            top: Math.round((h.y / 100) * fullH - offset - HAND / 2),
            transform: `rotate(${h.angle.toFixed(1)}deg)`,
            opacity: 1 + (WEATHERED_OPACITY - 1) * h.age,
          }}
        />
      ))}
    </div>
  );
}

const WOOD = "linear-gradient(160deg, #e0b063 0%, #c8913f 45%, #dfae5f 100%)";

function Greeting({ size = 42 }: { size?: number }) {
  // display:flex because the emoji makes this more than one child.
  return (
    <div style={{ display: "flex", fontSize: size, fontWeight: 700, color: INK }}>
      hey, i&apos;m siphyshu! 👋
    </div>
  );
}

function Footer({ count, width }: { count: number; width?: number }) {
  return (
    <div
      style={{
        display: "flex",
        width,
        justifyContent: "space-between",
        alignItems: "center",
        borderTop: `1px solid ${RULE}`,
        paddingTop: 14,
        fontSize: 19,
        color: MUTED,
      }}
    >
      <div style={{ display: "flex", color: INK }}>siphyshu.me</div>
      <div style={{ display: "flex" }}>{count} were here</div>
    </div>
  );
}

export function OgCard({
  handprints,
  variant = "framed",
}: {
  handprints: Handprint[];
  variant?: OgVariant;
}) {
  const aged = withAges(handprints);
  const base = {
    width: OG_SIZE.width,
    height: OG_SIZE.height,
    display: "flex" as const,
    background: "#ffffff",
    fontFamily: "PT Serif",
    color: INK,
  };

  // A — a ruled page. The hairline box is the site's own device; it's what
  // stops the contents floating in white.
  if (variant === "framed") {
    return (
      <div style={{ ...base, padding: 26 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            border: `1px solid ${INK}`,
            padding: 38,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
            <Avatars size={104} />
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 26 }}>
              <Greeting size={40} />
              <div style={{ display: "flex", fontSize: 21, color: MUTED, marginTop: 8 }}>
                {getAge()} y/o · exploring tech × art · building, breaking
              </div>
            </div>
          </div>
          <div style={{ display: "flex", padding: 14, background: WOOD }}>
            <Wall aged={aged} width={1020} crop={240} />
          </div>
          <div style={{ display: "flex", marginTop: 18 }}>
            <Footer count={aged.length} width={1048} />
          </div>
        </div>
      </div>
    );
  }

  // B — asymmetric, wall bleeding off the bottom edge. The content sits left
  // rather than centred, which is what stops it reading as a placeholder.
  if (variant === "bleed") {
    return (
      <div style={{ ...base, flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", padding: 56 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Avatars size={118} />
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 28 }}>
              <Greeting size={46} />
              <div style={{ display: "flex", fontSize: 22, color: MUTED, marginTop: 10 }}>
                {getAge()} y/o · exploring tech × art
              </div>
              <div style={{ display: "flex", fontSize: 22, color: MUTED, marginTop: 4 }}>
                building, breaking, always curious
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 30,
              fontSize: 22,
              color: INK,
              borderTop: `1px solid ${RULE}`,
              paddingTop: 16,
            }}
          >
            siphyshu.me
          </div>
        </div>
        <div style={{ display: "flex", borderTop: `10px solid #c8913f` }}>
          <Wall aged={aged} width={OG_SIZE.width} crop={190} />
        </div>
      </div>
    );
  }

  // C — index card. Rules divide it into bands, so every element has a place
  // rather than being positioned by eye.
  return (
    <div style={{ ...base, flexDirection: "column", padding: 34 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          border: `1px solid ${INK}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "26px 34px",
            borderBottom: `1px solid ${INK}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <Avatars size={88} />
            <div style={{ display: "flex", marginLeft: 24 }}>
              <Greeting size={38} />
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 19, color: MUTED }}>siphyshu.me</div>
        </div>

        <div
          style={{
            display: "flex",
            padding: "16px 34px",
            fontSize: 20,
            color: MUTED,
            borderBottom: `1px solid ${INK}`,
          }}
        >
          {getAge()} y/o · exploring tech × art · building, breaking, always curious
        </div>

        <div style={{ display: "flex", position: "relative" }}>
          <Wall aged={aged} width={1130} crop={256} />
          <div
            style={{
              position: "absolute",
              right: 16,
              bottom: 12,
              display: "flex",
              fontSize: 17,
              color: MUTED,
              background: "#ffffff",
              border: `1px solid ${INK}`,
              padding: "4px 10px",
            }}
          >
            {aged.length} were here
          </div>
        </div>
      </div>
    </div>
  );
}
