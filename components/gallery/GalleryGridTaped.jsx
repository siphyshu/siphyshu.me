"use client";

import Image from "next/image";
import { gallery } from "@/data/gallery";

// The /gallery view — polaroids taped straight onto the page in a loose
// grid, no wire or clips. Reuses .garland-polaroid/.garland-photo/
// .garland-caption as-is from GalleryGrid (archived, see that file);
// only the grid, rotation and tape/pin are new.

// Deterministic, not Math.random(): the same item needs the same tilt
// and tape/pin styling on the server render and the client hydration
// pass, or React flags a mismatch. Rounded to 6 decimals at the source
// (not just where a value gets printed into a style string) because
// this value also feeds a Math.floor index pick below — Math.sin can
// differ in its last bit between the server's and browser's V8 build,
// and on an unrounded value that's occasionally enough to flip which
// variant gets picked, mismatching after hydration.
const seeded = (n) => {
    const x = Math.sin(n * 12.9898) * 43758.5453;
    const frac = x - Math.floor(x);
    return Math.round(frac * 1e6) / 1e6;
};

// tape vs. pin is a deliberate per-photo call (item.decor in
// data/gallery.js), not derived — it stopped being "pick a plausible
// mix" the moment there was an exact pattern in mind. Which tape shape
// or pin color a photo gets is still randomized, since nobody has an
// opinion on that.
const TAPE_VARIANTS = ["a", "b", "c"];
const PIN_COLORS = ["brass", "pewter", "copper"];

const GalleryGridTaped = ({ className }) => (
    <div className={className}>
        <div className="tape-wall">
            {gallery.map((item) => {
                const seed = item.id * 4;
                const rot = (seeded(seed + 1) - 0.5) * 10;
                const offsetY = (seeded(seed + 4) - 0.5) * 20;

                const decor = item.decor;
                const tapeRot = (seeded(seed + 2) - 0.5) * 16;
                const tapeVariant = TAPE_VARIANTS[Math.min(TAPE_VARIANTS.length - 1, Math.floor(seeded(seed + 5) * TAPE_VARIANTS.length))];
                const pinColor = item.pinColor ?? PIN_COLORS[Math.min(PIN_COLORS.length - 1, Math.floor(seeded(seed + 6) * PIN_COLORS.length))];

                return (
                    <figure
                        className="tape-card"
                        key={item.id}
                        style={{ "--rot": `${rot.toFixed(2)}deg`, "--offset-y": `${offsetY.toFixed(1)}px` }}
                    >
                        {decor === "tape" && (
                            <span
                                className={`tape-strip tape-${tapeVariant}`}
                                style={{ "--tape-rot": `${tapeRot.toFixed(2)}deg` }}
                            />
                        )}
                        {decor === "pin" && <span className={`wall-pin wall-pin--${pinColor}`} />}
                        <div className="garland-polaroid">
                            <div className="garland-photo">
                                <Image
                                    src={item.image}
                                    alt={item.caption}
                                    fill
                                    sizes="(max-width: 640px) 45vw, (max-width: 900px) 30vw, 220px"
                                    className="object-cover"
                                />
                            </div>
                            <figcaption className="garland-caption">{item.caption}</figcaption>
                        </div>
                    </figure>
                );
            })}
        </div>
    </div>
);

export default GalleryGridTaped;
