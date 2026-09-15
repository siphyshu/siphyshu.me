import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import path from "node:path";
import clientPromise from "@/lib/mongodb";
import { withAges } from "@/components/handprint-wall/age";
import type { Handprint } from "@/lib/schemas/handprint";

export const alt = "The handprint wall on siphyshu.me";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Laid out in absolute pixels rather than percentages — Satori supports a
// subset of CSS and this leaves nothing to interpret.
const PAD = 40;
const FRAME = 20;
const WALL_W = size.width - PAD * 2;
const CANVAS_W = WALL_W - FRAME * 2;
const CANVAS_H = Math.round(CANVAS_W / 3.5); // the wall's own aspect
const HAND = 34; // scaled from 30px against the site's 950px canvas

/**
 * Weathering here is opacity only. The wall also drains saturation and adds
 * sepia with age, but Satori doesn't implement CSS filters, so those two
 * channels are unavailable. Opacity carries most of the effect and is the one
 * that reads at card size.
 */
const WEATHERED_OPACITY = 0.55;

/**
 * Satori ships no system fonts — `fontFamily: "serif"` silently falls back to a
 * default sans, which is how the first render came out. The site itself uses
 * the system serif stack (ui-serif/Georgia), so there was no webfont to reuse
 * and one has to be vendored.
 *
 * Static weights, not a variable font. Gelasio was the closer match to Georgia
 * but ships only as a variable font, and Satori's parser killed the render
 * process outright on it rather than erroring — a blank reply from the server
 * with nothing in the response. PT Serif is static, and close enough at the
 * size a share card is actually viewed.
 */
const fontRegular = readFileSync(path.join(process.cwd(), "public", "fonts", "PTSerif-Regular.ttf"));
const fontBold = readFileSync(path.join(process.cwd(), "public", "fonts", "PTSerif-Bold.ttf"));

/** Read once per process rather than per request; these never change. */
const handSvg = new Map<string, string>();
function handSrc(color: string): string {
  const cached = handSvg.get(color);
  if (cached) return cached;
  const file = path.join(process.cwd(), "public", "handprints", `${color}.svg`);
  const uri = `data:image/svg+xml;base64,${readFileSync(file).toString("base64")}`;
  handSvg.set(color, uri);
  return uri;
}

async function getHandprints(): Promise<Handprint[]> {
  const client = await clientPromise;
  const docs = await client.db("handprintdb").collection("handprints").find({}).toArray();
  return docs.map(({ _id, ...rest }) => ({ ...rest, id: _id.toString() }) as Handprint);
}

export default async function OpengraphImage() {
  const aged = withAges(await getHandprints());
  // Off-canvas rows exist from before the schema clamped x and y.
  const onWall = aged.filter((h) => h.x >= 0 && h.x <= 100 && h.y >= 0 && h.y <= 100);

  return new ImageResponse(
    (
      <div
        style={{
          width: size.width,
          height: size.height,
          display: "flex",
          flexDirection: "column",
          // Centred rather than space-between: the wall and the footer together
          // are shorter than the card, and pushing them to the edges left a
          // void in the middle that read as a missing element. Centring splits
          // the slack evenly above and below, where it reads as margin.
          justifyContent: "center",
          padding: PAD,
          background: "#ffffff",
          fontFamily: "PT Serif",
        }}
      >
        {/* Frame. A gradient stands in for the wood: the real frame is a
            border-image, which Satori doesn't support, and the PNG is 260KB to
            inline for something that reads as a brown edge at card size. */}
        <div
          style={{
            display: "flex",
            padding: FRAME,
            background: "linear-gradient(160deg, #e0b063 0%, #c8913f 45%, #dfae5f 100%)",
          }}
        >
          <div
            style={{
              display: "flex",
              position: "relative",
              width: CANVAS_W,
              height: CANVAS_H,
              background: "#f6f2e8",
            }}
          >
            {onWall.map((h) => (
              <img
                key={h.id}
                src={handSrc(h.color)}
                // Satori renders to a flat image; there is nothing for a
                // screen reader to reach. The card's alt text is the exported
                // `alt` above.
                alt=""
                width={HAND}
                height={HAND}
                style={{
                  position: "absolute",
                  // Offset by half rather than translate(-50%): one fewer
                  // transform for Satori to resolve.
                  left: Math.round((h.x / 100) * CANVAS_W - HAND / 2),
                  top: Math.round((h.y / 100) * CANVAS_H - HAND / 2),
                  transform: `rotate(${h.angle.toFixed(1)}deg)`,
                  opacity: 1 + (WEATHERED_OPACITY - 1) * h.age,
                }}
              />
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            paddingTop: 28,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 46, fontWeight: 700, color: "#111" }}>siphyshu.me</div>
            <div style={{ fontSize: 22, color: "#666", paddingTop: 6 }}>
              from cave walls to pixels — leave a mark
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: "#111",
              border: "1px solid #111",
              padding: "8px 16px",
            }}
          >
            {onWall.length} were here
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "PT Serif", data: fontRegular, style: "normal", weight: 400 },
        { name: "PT Serif", data: fontBold, style: "normal", weight: 700 },
      ],
    }
  );
}
