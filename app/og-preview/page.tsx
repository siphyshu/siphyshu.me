import { notFound } from "next/navigation";
import { OgCard, OG_SIZE, type OgVariant } from "@/components/og/OgCard";
import { readHandprints } from "@/lib/handprints";

/**
 * Dev-only preview of the share card, so it can be iterated on with hot reload
 * instead of recompiling and re-fetching a PNG for every tweak.
 *
 * Renders the same tree the image does. A browser is more capable than Satori,
 * so this can only prove a design *doesn't* work, never that it does — anything
 * outside Satori's subset will look right here and fail there. Check the real
 * image at /opengraph-image before believing it.
 */
const VARIANTS: { id: OgVariant; label: string }[] = [
  { id: "framed", label: "A — ruled page" },
  { id: "bleed", label: "B — asymmetric, wall bleeding off the bottom" },
  { id: "card", label: "C — index card, ruled bands" },
];

export default async function OgPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const handprints = await readHandprints();

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 28,
        padding: 28,
        background: "#e9e9e9",
        fontFamily: "ui-monospace, Menlo, monospace",
      }}
    >
      <p style={{ fontSize: 12, color: "#555", margin: 0 }}>
        /og-preview — {OG_SIZE.width}×{OG_SIZE.height}. Same tree as the image;
        verify at <a href="/opengraph-image">/opengraph-image</a>.
      </p>
      {VARIANTS.map((v) => (
        <div key={v.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 12, color: "#555" }}>{v.label}</span>
          <div style={{ boxShadow: "0 2px 12px rgba(0,0,0,.18)", background: "#fff" }}>
            <OgCard handprints={handprints} variant={v.id} />
          </div>
        </div>
      ))}
    </main>
  );
}
