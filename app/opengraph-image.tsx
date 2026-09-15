import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import path from "node:path";
import clientPromise from "@/lib/mongodb";
import { getAge } from "@/lib/age";
import { withAges } from "@/components/handprint-wall/age";
import type { Handprint } from "@/lib/schemas/handprint";

export const alt = "siphyshu.me — Jaiyank's personal site";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Laid out in absolute pixels rather than percentages — Satori implements a
 * subset of CSS, and this leaves nothing for it to interpret.
 *
 * The card leads with who this is, not with the handprint wall. The wall is
 * the site's one piece of personality, so it earns a band along the bottom,
 * but it's a signature rather than the subject.
 */
const PAD = 64;
const BAND_H = 236;
/** The wall's own aspect at full card width, so the band is a true crop of it
 *  rather than a squashed copy. */
const WALL_H = Math.round(size.width / 3.5);
const HAND = 34;

/** Weathering is opacity only: Satori doesn't implement CSS filters, so the
 *  wall's saturation and sepia channels are unavailable here. */
const WEATHERED_OPACITY = 0.55;

/**
 * Satori ships no system fonts — `fontFamily: "serif"` silently falls back to a
 * default sans. The site uses the system serif stack, so there was no webfont
 * to reuse and one had to be vendored.
 *
 * Static weights, not variable. Gelasio was the closer match to Georgia but
 * ships only as a variable font, and Satori's parser killed the render process
 * outright on it — an empty reply from the server, nothing logged.
 */
const asset = (...p: string[]) => readFileSync(path.join(process.cwd(), "public", ...p));
const fontRegular = asset("fonts", "PTSerif-Regular.ttf");
const fontBold = asset("fonts", "PTSerif-Bold.ttf");

const dataUri = (file: Buffer, mime: string) =>
  `data:${mime};base64,${file.toString("base64")}`;

const avatar = dataUri(asset("images", "jaiyank.jpg"), "image/jpeg");
const avatarAlt = dataUri(asset("images", "siphyshu.jpg"), "image/jpeg");

/** Read once per process; these never change. */
const handSvg = new Map<string, string>();
function handSrc(color: string): string {
  const cached = handSvg.get(color);
  if (cached) return cached;
  const uri = dataUri(asset("handprints", `${color}.svg`), "image/svg+xml");
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
  // The band shows the lower part of the wall, so anything above it simply
  // isn't drawn — cheaper than asking Satori to clip, and identical on screen.
  // The x/y guard also drops the off-canvas rows that predate the schema
  // clamping coordinates to 0-100.
  const bandTop = WALL_H - BAND_H;
  const onWall = aged.filter(
    (h) =>
      h.x >= 0 &&
      h.x <= 100 &&
      h.y >= 0 &&
      h.y <= 100 &&
      (h.y / 100) * WALL_H > bandTop - HAND
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: size.width,
          height: size.height,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          fontFamily: "PT Serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 36, padding: PAD }}>
          {/* The avatar pair from the site's header, small one overlapping. */}
          <div style={{ display: "flex", position: "relative", width: 172, height: 172 }}>
            <img src={avatar} alt="" width={172} height={172} style={{ borderRadius: 86 }} />
            <img
              src={avatarAlt}
              alt=""
              width={74}
              height={74}
              style={{
                position: "absolute",
                right: -2,
                bottom: -2,
                borderRadius: 37,
                border: "5px solid #ffffff",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* No emoji: PT Serif carries no emoji glyphs, and Satori needs an
                emoji font supplied separately — a network dependency for a
                wave isn't worth it. */}
            <div style={{ fontSize: 60, fontWeight: 700, color: "#111" }}>
              hey, i&apos;m jaiyank
            </div>
            {/* display:flex because this has two children — the expression
                and the text beside it. Satori throws on any element with more
                than one child that doesn't declare it, and the failure surfaces
                only as a dropped response with nothing logged. */}
            <div style={{ display: "flex", fontSize: 27, color: "#666", paddingTop: 14 }}>
              {getAge()} y/o · exploring CS @ VITB
            </div>
            <div style={{ fontSize: 27, color: "#666", paddingTop: 6 }}>
              Developer, generalist, always curious.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              padding: `0 ${PAD}px 22px`,
            }}
          >
            <div style={{ fontSize: 30, color: "#111" }}>siphyshu.me</div>
            <div style={{ display: "flex", fontSize: 20, color: "#999" }}>{aged.length} were here</div>
          </div>

          {/* Full-bleed band: the bottom of the wall, no frame. Cropped rather
              than scaled, so the prints keep the size and spacing they have on
              the site instead of being squashed into a strip. */}
          <div
            style={{
              display: "flex",
              position: "relative",
              width: size.width,
              height: BAND_H,
              // Without this the prints sitting at negative offsets — the ones
              // whose centres are above the crop line — draw up over the white
              // and across the wordmark.
              overflow: "hidden",
              background: "#f6f2e8",
              borderTop: "1px solid #e8e2d4",
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
                  left: Math.round((h.x / 100) * size.width - HAND / 2),
                  top: Math.round((h.y / 100) * WALL_H - bandTop - HAND / 2),
                  transform: `rotate(${h.angle.toFixed(1)}deg)`,
                  opacity: 1 + (WEATHERED_OPACITY - 1) * h.age,
                }}
              />
            ))}
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
