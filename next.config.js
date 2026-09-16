const createMDX = require('@next/mdx')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: ''
      }
    ],
  },
  // `pageExtensions` is deliberately not extended with md/mdx. Content lives in
  // content/, never in app/, and is pulled in by the [slug] routes. Adding the
  // extensions here would only create a second, silent way for a stray .mdx
  // file to become a route.
}

const withMDX = createMDX({
  options: {
    // Turbopack serializes this config across into Rust, so every plugin has to
    // be named by string with JSON-serializable options. An imported function
    // here does not error — it just never runs — so anything needing a callback
    // (autolink `content`, shiki `transformers`) has to be solved in CSS or in
    // mdx-components.tsx instead.
    remarkPlugins: [
      // Without this the YAML block at the top of every content file renders
      // as a paragraph of text at the top of the article.
      'remark-frontmatter',
      // Tables, strikethrough, task lists, literal autolinks.
      'remark-gfm',
    ],
    rehypePlugins: [
      // Stable `id` on every heading, which is what makes headings linkable
      // and what a future table of contents would hang off.
      'rehype-slug',
      // `wrap` turns the heading's own text into the anchor. The alternatives
      // ('append'/'prepend') want a hast node for the marker, which is a
      // structure Turbopack will serialize but which then has to be styled
      // blind; wrapping needs no extra node and is styled in globals.css.
      ['rehype-autolink-headings', { behavior: 'wrap' }],
      // Build-time syntax highlighting: the HTML ships pre-coloured and no
      // highlighter reaches the browser. Light-only for now — the site has
      // `darkMode: "class"` configured but no toggle yet, and picking a dual
      // theme before that exists would be guessing at the pairing.
      ['@shikijs/rehype', { theme: 'github-light' }],
    ],
  },
})

module.exports = withMDX(nextConfig)
