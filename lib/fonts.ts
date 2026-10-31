import { Source_Serif_4 } from "next/font/google";

// The site's serif: Adobe's Source Serif 4, self-hosted by next/font —
// downloaded at build time, served from this domain, preloaded, with a
// size-matched fallback so text doesn't jump when it arrives. Chosen over the
// system serif so every device sees the same face (Arc and Chrome rendered
// Georgia, Safari New York), and over Newsreader and Charter after comparing
// all three on real articles.
//
// The optical-size axis tightens the letterforms at title sizes and sturdies
// them at body size, from one family.
export const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-source-serif",
});
