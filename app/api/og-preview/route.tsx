import { ImageResponse } from "next/og";
import { OgCard, OG_SIZE, ogFonts, type OgVariant } from "@/components/og/OgCard";
import { readHandprints } from "@/lib/handprints";

/**
 * Dev-only. Renders a chosen card variant through Satori, so a design can be
 * compared as the real PNG rather than as HTML — the browser preview at
 * /og-preview is more capable than Satori and will happily render things the
 * image can't.
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }
  const variant = (new URL(request.url).searchParams.get("v") ?? "framed") as OgVariant;

  return new ImageResponse(
    <OgCard handprints={await readHandprints()} variant={variant} />,
    {
      ...OG_SIZE,
      emoji: "twemoji",
      fonts: [
        { name: "PT Serif", data: ogFonts.regular, style: "normal", weight: 400 },
        { name: "PT Serif", data: ogFonts.bold, style: "normal", weight: 700 },
      ],
    }
  );
}
