// An essay's thumbnail, drawn from the essay itself: the page seen from across
// the room. Each paragraph is lines of ink at its real length, a section break
// (---) is three dots, and one passage near the top is marked in highlighter.
//
// Seeded by the slug, so it's the same on every build; `thumbnail_seed` in the
// frontmatter draws a different one. Runs in content-collections.ts, and the
// result is a data: URL, so the list and the search palette show it as they
// would any other thumbnail.

const W = 700;
const H = 400;
const PAPER = "#f6f3ec";
const INK = "#22201c";
const HIGHLIGHTS = ["#ffd84d", "#ff9eb0", "#8fd3ff", "#b9ee8e", "#ffb36b"];

const f = (n: number) => Math.round(n * 10) / 10;

// FNV-1a into mulberry32: the same string always gives the same sequence.
function makeRng(seed: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  let a = h;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const range = (lo: number, hi: number) => lo + (hi - lo) * next();
  const pick = <T,>(arr: T[]) => arr[Math.floor(next() * arr.length)];
  return { range, pick };
}

/**
 * Word counts per paragraph, with 0 for a section break. A blockquote's
 * paragraphs count one by one; anything that isn't prose (an import, a
 * component on its own line) is skipped.
 */
export function paragraphRhythm(mdx: string): number[] {
  return mdx
    .split(/\n[\s>]*\n/)
    .map((block) => block.replace(/^\s*>\s?/gm, "").trim())
    .filter((block) => block && !/^(import|export)\s|^<[A-Z]/.test(block))
    .map((block) => (/^(-{3,}|\*{3,})$/.test(block) ? 0 : block.split(/\s+/).length));
}

type Row = { kind: "text"; frac: number } | { kind: "gap" } | { kind: "break" };

export function essayThumbnail(paras: number[], seed: string): string {
  const r = makeRng(seed);
  const total = paras.reduce((sum, w) => sum + w, 0);
  const wordsPerRow = Math.max(9, total / 16);

  const rows: Row[] = [];
  for (const w of paras) {
    if (w === 0) {
      rows.push({ kind: "break" });
      continue;
    }
    for (let left = w; left > 0; left -= wordsPerRow) {
      rows.push({ kind: "text", frac: Math.min(1, left / wordsPerRow) });
    }
    rows.push({ kind: "gap" });
  }

  // A fixed line height keeps the strokes bold at 112px wide; a long essay
  // runs off the bottom, like a page held too close.
  const u = 26;
  const x0 = 70;
  const x1 = W - 70;
  const highlight = r.pick(HIGHLIGHTS);
  const textRows = rows.flatMap((row, i) => (row.kind === "text" ? [i] : []));
  const marked = r.pick(textRows.slice(0, 9));

  let ink = "";
  let dots = "";
  let marker = "";
  let y = 48;
  rows.forEach((row, i) => {
    if (row.kind === "gap") {
      y += u * 0.55;
      return;
    }
    if (row.kind === "break") {
      for (const k of [-1, 0, 1]) dots += `<circle cx="${f(W / 2 + k * 18)}" cy="${f(y + u * 0.35)}" r="3.4"/>`;
      y += u * 1.5;
      return;
    }
    const end = x0 + (x1 - x0) * row.frac;
    if (i === marked) {
      const a = r.range(x0, x0 + (end - x0) * 0.4);
      const b = r.range(a + (end - a) * 0.5, end);
      marker = `M${f(a - 6)} ${f(y + 1.5)}L${f(b + 6)} ${f(y - 1.5)}`;
    }
    // Words: dashes of varied length with a little drift.
    for (let x = x0; x < end - 8; ) {
      const len = Math.min(r.range(16, 64), end - x);
      ink += `M${f(x)} ${f(y)}q${f(len / 2)} ${f(r.range(-1.2, 1.2))} ${f(len)} ${f(r.range(-0.8, 0.8))}`;
      x += len + r.range(8, 13);
    }
    y += u;
  });

  const tilt = f(r.range(-3.5, 3.5));
  const lift = f(r.range(-30, 0));
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">` +
    // Sparse dark speckle over everything, like toner on paper.
    `<defs><filter id="g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.2 -.74"/></filter></defs>` +
    `<rect width="${W}" height="${H}" fill="${PAPER}"/>` +
    `<g transform="rotate(${tilt} ${W / 2} ${H / 2}) translate(0 ${lift})">` +
    (marker ? `<path d="${marker}" stroke="${highlight}" stroke-width="${f(u * 0.82)}" stroke-linecap="round" opacity=".8"/>` : "") +
    `<path d="${ink}" stroke="${INK}" stroke-width="${f(u * 0.42)}" stroke-linecap="round" fill="none"/>` +
    `<g fill="${INK}">${dots}</g>` +
    `</g>` +
    `<rect width="${W}" height="${H}" filter="url(#g)"/>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
