"use client";

import Image from "next/image";
import { gallery } from "@/data/gallery";

// ARCHIVED — not wired into /gallery (see GalleryGridTaped for the
// current view). Kept here, working and unmodified, in case the
// fairy-light-garland direction gets revisited later; it's not linked
// from anywhere right now, same "parked, not deleted" treatment as
// app/(site)/ctfs. Every .garland-wire/.garland-bulb/etc rule this
// depends on is still in globals.css — GalleryGridTaped reuses several
// of them (.garland-polaroid, .garland-photo, .garland-caption), so
// don't remove those thinking this file made them dead.
//
// Rows alternate 3-photos-then-2 instead of a fixed size, so the garland
// doesn't stack into a perfect grid of identical rows.
const ROW_PATTERN = [3, 2];
const BULB_T = [0.08, 0.2, 0.32, 0.44, 0.5, 0.56, 0.68, 0.8, 0.92];
const BULB_T_BACK = [0.14, 0.4, 0.66, 0.88];

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// Deterministic, not Math.random(): the same item/row needs the same
// tilt, sag, spacing and timing on the server render and the client
// hydration pass, or React flags a mismatch. Rounded to 6 decimals at
// the source (not just where a value gets printed into a style string)
// because hasBackStrand below runs a raw threshold comparison on it —
// Math.sin can differ in its last bit between the server's and
// browser's V8 build, and on an unrounded value that's occasionally
// enough to flip which side of the threshold a row lands on, mismatching
// after hydration.
const seeded = (n) => {
    const x = Math.sin(n * 12.9898) * 43758.5453;
    const frac = x - Math.floor(x);
    return Math.round(frac * 1e6) / 1e6;
};

const chunkByPattern = (arr, pattern) => {
    const rows = [];
    let i = 0;
    let p = 0;
    while (i < arr.length) {
        const size = Math.min(pattern[p % pattern.length], arr.length - i);
        rows.push(arr.slice(i, i + size));
        i += size;
        p += 1;
    }
    // A trailing row of exactly one photo reads as an afterthought — a
    // whole extra strand of lights just to hold one polaroid. Borrow one
    // from the row before it so a small gallery still ends balanced
    // (e.g. 4 photos becomes 2/2 instead of 3/1).
    if (rows.length >= 2 && rows[rows.length - 1].length === 1) {
        const last = rows.pop();
        const prev = rows[rows.length - 1];
        last.unshift(prev.pop());
        rows.push(last);
    }
    return rows;
};

// Every polaroid is the same physical size regardless of how many share
// a row — sized against the densest row in ROW_PATTERN so that row's
// photos sit close together, not stretched to fill whatever's left.
// Rows with fewer photos just center a smaller, tighter cluster of that
// same size instead of blowing the photos up to fill the gap.
const FIG_WIDTH_PCT = (100 / Math.max(...ROW_PATTERN)) * 0.82;
const GAP_PCT = 3;

const rowTs = (k) => {
    const total = k * FIG_WIDTH_PCT + (k - 1) * GAP_PCT;
    const start = (100 - total) / 2;
    return Array.from(
        { length: k },
        (_, i) => (start + i * (FIG_WIDTH_PCT + GAP_PCT) + FIG_WIDTH_PCT / 2) / 100
    );
};

// Real garlands aren't measured — the two anchor ends are rarely pinned
// at the same height, and the middle sags by a different amount every
// time it's strung up. One end is deliberately high and the other low
// (not just independently randomized, which tends to land both ends
// close together), and which end is which alternates row to row, so
// the garland visibly zigzags down the page instead of stacking rows
// that all read as level.
const rowCurve = (rowIndex) => {
    const high = 4 + seeded(rowIndex * 31 + 1) * 8;
    const low = 64 + seeded(rowIndex * 31 + 2) * 22;
    const p1y = 78 + seeded(rowIndex * 31 + 3) * 45;
    return rowIndex % 2 === 0 ? { p0y: high, p1y, p2y: low } : { p0y: low, p1y, p2y: high };
};

// A second strand, strung looser and at different anchor heights, that
// a little over half the rows get behind the primary one — a wall of
// lights is never just one tidy line, it's a few that cross each other.
const rowCurveBack = (rowIndex) => ({
    p0y: 6 + seeded(rowIndex * 67 + 1) * 34,
    p1y: 55 + seeded(rowIndex * 67 + 2) * 75,
    p2y: 6 + seeded(rowIndex * 67 + 3) * 34,
});

const hasBackStrand = (rowIndex) => seeded(rowIndex * 89 + 5) > 0.35;

// P0 and P2 sit exactly on the viewBox edges (0 and 1000) so the wire
// itself touches the row's actual left and right edges instead of
// leaving a visible inset gap — P1 at the midpoint (500) makes the x
// component of the quadratic bezier reduce to a plain linear t*1000.
const curveX = (t) => t * 1000;
const curveYOn = (t, c) => (1 - t) ** 2 * c.p0y + 2 * (1 - t) * t * c.p1y + t ** 2 * c.p2y;

const wirePath = (curve) => `M0,${curve.p0y.toFixed(1)} Q500,${curve.p1y.toFixed(1)} 1000,${curve.p2y.toFixed(1)}`;

// Rounded to fixed strings, not left as raw floats: Math.sin can differ
// in its last bit between the server's and browser's V8 build, and
// React's hydration check is byte-exact on attribute strings.
const renderBulbs = (curve, bulbTs, rowIndex, seedBase, small) =>
    bulbTs.map((baseT, i) => {
        const t = clamp(baseT + (seeded(rowIndex * seedBase + i * 7) - 0.5) * 0.035, 0.03, 0.97);
        const cx = curveX(t).toFixed(2);
        const cy = curveYOn(t, curve).toFixed(2);
        const r = (t < 0.14 || t > 0.86 ? 4.5 : 5) - (small ? 1.2 : 0);
        const delay = (seeded(rowIndex * (seedBase + 41) + i * 13) * 2.4).toFixed(3);
        return (
            <g key={i}>
                <circle className="garland-bulb-glow" cx={cx} cy={cy} r={r + 5} />
                <circle className="garland-bulb" cx={cx} cy={cy} r={r} style={{ "--tw-delay": `${delay}s` }} />
            </g>
        );
    });

const GalleryGrid = ({ className }) => {
    const rows = chunkByPattern(gallery, ROW_PATTERN);

    return (
        <div className={className}>
            {rows.map((row, rowIndex) => {
                const curve = rowCurve(rowIndex);
                const backCurve = hasBackStrand(rowIndex) ? rowCurveBack(rowIndex) : null;
                const ts = rowTs(row.length);
                const rowMarginTop = rowIndex === 0 ? undefined : `${(-6 + seeded(rowIndex * 41 + 7) * 3).toFixed(2)}rem`;

                return (
                    <div className="garland-row" key={rowIndex} style={{ marginTop: rowMarginTop }}>
                        <div className="garland-wire-box">
                            <svg viewBox="0 0 1000 140" preserveAspectRatio="none">
                                {backCurve && (
                                    <g className="garland-strand-back">
                                        <path className="garland-wire garland-wire-back" d={wirePath(backCurve)} />
                                        {renderBulbs(backCurve, BULB_T_BACK, rowIndex, 137, true)}
                                    </g>
                                )}
                                <path className="garland-wire" d={wirePath(curve)} />
                                {renderBulbs(curve, BULB_T, rowIndex, 53, false)}
                            </svg>
                        </div>

                        {row.map((item, i) => {
                            const seed = item.id * 4;
                            const jitter = (seeded(seed) - 0.5) * 0.02;
                            const t = clamp(ts[i] + jitter, 0.03, 0.97);
                            // Wide range, and this is now the main carrier of the
                            // "hand-pinned, not measured" feel: with the sway gone,
                            // each photo just hangs fixed at whatever angle it was
                            // clipped on at, like the reference photos.
                            const rot = (seeded(seed + 1) - 0.5) * 12;

                            return (
                                <figure
                                    className="garland-figure"
                                    key={item.id}
                                    style={{
                                        "--x": `${((curveX(t) / 1000) * 100).toFixed(2)}%`,
                                        "--yf": (curveYOn(t, curve) / 140).toFixed(4),
                                        "--rot": `${rot.toFixed(2)}deg`,
                                        "--fig-w": `${FIG_WIDTH_PCT.toFixed(2)}%`,
                                    }}
                                >
                                    <svg className="garland-clip" viewBox="0 0 16 34" aria-hidden="true">
                                        <rect className="garland-clip-body" x="2" y="0" width="12" height="34" rx="3" />
                                        <rect className="garland-clip-shade" x="2" y="19" width="12" height="15" rx="3" />
                                        <ellipse className="garland-clip-spring" cx="8" cy="15" rx="6.5" ry="2.8" />
                                        <line className="garland-clip-gap" x1="8" y1="17" x2="8" y2="33" />
                                    </svg>
                                    <div className="garland-polaroid">
                                        <div className="garland-photo">
                                            <Image
                                                src={item.image}
                                                alt={item.caption}
                                                fill
                                                sizes="(max-width: 640px) 30vw, 260px"
                                                className="object-cover"
                                            />
                                        </div>
                                        <figcaption className="garland-caption">{item.caption}</figcaption>
                                    </div>
                                </figure>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};

export default GalleryGrid;
