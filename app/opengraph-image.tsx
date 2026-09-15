import { ImageResponse } from "next/og";
import { OgCard, OG_SIZE, ogFonts } from "@/components/og/OgCard";
import { readHandprints } from "@/lib/handprints";

export const alt = "siphyshu.me — Jaiyank's personal site";
export const size = OG_SIZE;
export const contentType = "image/png";

// The markup lives in OgCard so /og-preview can render the identical tree as
// HTML and the two can't drift. Everything design-related belongs there.
export default async function OpengraphImage() {
  return new ImageResponse(<OgCard handprints={await readHandprints()} />, {
    ...size,
    // Satori has no emoji glyphs and PT Serif carries none, so the wave needs a
    // source. Fetches SVGs from a CDN at render time — the only network
    // dependency here, and the first thing to suspect if the wave goes missing.
    emoji: "twemoji",
    fonts: [
      { name: "PT Serif", data: ogFonts.regular, style: "normal", weight: 400 },
      { name: "PT Serif", data: ogFonts.bold, style: "normal", weight: 700 },
    ],
  });
}
