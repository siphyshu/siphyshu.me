import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import rehypeShiki from "@shikijs/rehype";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";
import { z } from "zod";
import { tags as tagRegistry } from "./data/tags";

// Builds content/ into typed modules under .content-collections/generated,
// imported as "content-collections". Runs inside next.config.mjs — once for
// `next build`, and as a watcher under `next dev` — so edits to an .mdx file
// show up without a restart.

/**
 * Drafts render under `next dev` and are absent from a production build.
 *
 * An article is a draft by *where it lives*: content/drafts/, which is
 * gitignored, so a draft can't reach GitHub — the repo is public, and a
 * `draft: true` flag hid an article from the site but never from the repo.
 * Publishing is moving the file into content/articles/.
 */
const INCLUDE_DRAFTS = process.env.NODE_ENV === "development";

/** Both folders, read as one collection. content/drafts/ may not exist. */
const CONTENT = { directory: "content", include: ["articles/*.mdx", "drafts/*.mdx"] };

/** Roughly how fast an article is read. Medium uses 265; this is a little gentler. */
const WORDS_PER_MINUTE = 230;

const articleSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  // YAML reads an unquoted 2026-09-24 as a Date and a quoted one as a string.
  // Both are accepted and normalized, so the author never has to remember which.
  date: z
    .union([z.iso.date(), z.date()])
    .transform((d) => (d instanceof Date ? d.toISOString().slice(0, 10) : d)),
  // Ids from data/tags.ts. An unknown one fails the build naming the file,
  // rather than rendering an article whose pill silently vanished.
  tags: z
    .array(
      z.string().refine((id) => id in tagRegistry, {
        error: (issue) => `unknown tag "${issue.input}" — add it to data/tags.ts`,
      })
    )
    .default([]),
  thumbnail: z.string().optional(),
  // Show the thumbnail at the top of the article too, under the header. Off
  // by default: most articles open with their own first picture, and a
  // thumbnail cropped from it would show the same thing twice.
  cover: z.boolean().default(false),
  // Published elsewhere (the Medium posts): listed here, linked out, no reader
  // page. Named after JSON Feed's `external_url`, which means the same thing.
  external_url: z.url().optional(),
  // The original copy, when this article is a repost of one hosted elsewhere
  // (a Medium post ported here, with Medium kept as the original). Becomes the
  // page's <link rel="canonical">. Named as dev.to and most Hugo/Jekyll themes
  // name it. Without it, the page is its own canonical.
  canonical_url: z.url().optional(),
  // Where this article first appeared, when it was ported here from somewhere
  // else (the Medium posts). A credit to readers, shown under the header as
  // "Originally published on Medium on <date>" — not a canonical: once
  // ported, the page here is the original and Medium's copy points to it.
  original_url: z.url().optional(),
  // Only for external posts — a hosted article's read time is counted from its body.
  readMinutes: z.number().int().positive().optional(),
  // The old way of marking a draft. Still parsed so it can be refused by name
  // (see checkFile) rather than silently stripped.
  draft: z.unknown().optional(),
  content: z.string(),
});

// GFM collects footnotes into a section headed by a visually hidden
// "Footnotes" <h2>. Here it's a visible, small "Notes" <h3>, the way the
// reader sets them. A plugin rather than remarkRehypeOptions, which
// compileMDX doesn't pass through.
function rehypeNotesLabel() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.properties?.id !== "footnote-label") return;
      node.tagName = "h3";
      delete node.properties.className;
      node.children = [{ type: "text", value: "Notes" }];
    });
  };
}

type Meta = { path: string; filePath: string };

const isDraft = (meta: Meta) => meta.path.startsWith("drafts/");
/** The URL slug: the file name, whichever folder it's in. */
const slugOf = (meta: Meta) => meta.path.split("/").pop()!;

function isHidden(meta: Meta) {
  return isDraft(meta) && !INCLUDE_DRAFTS;
}

/** Refuses the old draft flag, so nothing gets drafted in the public folder out of habit. */
function checkFile(meta: Meta, draft: unknown) {
  if (draft !== undefined) {
    throw new Error(
      `content/${meta.filePath} has "draft:" in its frontmatter. Drafts live in content/drafts/ now ` +
        "(gitignored — this repo is public): move the file there and delete the line."
    );
  }
}

// Everything the list, the tag filter and the search palette need — and
// nothing else. These run in the browser, so the compiled bodies live in a
// second collection (below) that only the server-rendered reader imports.
// Each collection is its own generated file, so the bodies never reach the
// client bundle.
const articles = defineCollection({
  name: "articles",
  ...CONTENT,
  schema: articleSchema,
  transform: ({ content, _meta, draft, ...article }, { skip }) => {
    checkFile(_meta, draft);
    if (isHidden(_meta)) return skip("draft");

    const hasBody = content.trim().length > 0;
    const file = `content/${_meta.filePath}`;
    if (article.external_url && hasBody) {
      // Either hosted here or published elsewhere, never both: otherwise the
      // list links out while an orphan page sits at /articles/<slug>.
      throw new Error(`${file} has both \`external_url\` and a body — pick one.`);
    }
    if (article.external_url && article.original_url) {
      // An external post is still where it was first published; it has no
      // page here to carry the credit.
      throw new Error(`${file} has both \`external_url\` and \`original_url\` — original_url is for a post ported here.`);
    }
    if (article.external_url && article.canonical_url) {
      // An external post has no page here, so there is nothing to put a
      // canonical tag on.
      throw new Error(`${file} has both \`external_url\` and \`canonical_url\` — an external post has no page to be canonical for.`);
    }
    if (!article.external_url && !hasBody) {
      throw new Error(`${file} has no body and no \`external_url\` — nothing to show.`);
    }

    const slug = slugOf(_meta);
    // Prose only: code blocks are skimmed rather than read, and counting them
    // as words nearly doubled the estimate on a code-heavy post.
    const prose = content.replace(/^```[\s\S]*?^```/gm, "");
    const words = prose.split(/\s+/).filter(Boolean).length;
    return {
      ...article,
      slug,
      hosted: !article.external_url,
      href: article.external_url ?? `/articles/${slug}`,
      readMinutes: article.readMinutes ?? Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    };
  },
});

// The compiled MDX, keyed by slug. Server-only by convention: import it from
// the reader route, never from a "use client" module.
const articleBodies = defineCollection({
  name: "articleBodies",
  ...CONTENT,
  schema: articleSchema,
  transform: async (document, context) => {
    checkFile(document._meta, document.draft);
    if (isHidden(document._meta)) return context.skip("draft");
    if (document.external_url) return context.skip("external — no reader page");

    // Compiled here, in Node, not by Turbopack — so plugins are ordinary
    // imported functions rather than the string names @next/mdx requires.
    const mdx = await compileMDX(context, document, {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        // An `id` on every heading — what anchors and a future TOC hang off.
        rehypeSlug,
        rehypeNotesLabel,
        // `wrap` makes the heading's own text the link, so there's no extra
        // marker node; the hover "#" is drawn in globals.css (.article-body).
        // Not the notes label: nobody links to "Notes".
        [
          rehypeAutolinkHeadings,
          { behavior: "wrap", test: (node: Element) => node.properties?.id !== "footnote-label" },
        ],
        // Highlighted at build time: the HTML ships coloured, no highlighter
        // reaches the browser.
        // Both themes: light colours inline, dark ones as --shiki-dark
        // variables that globals.css switches to under data-theme="dark".
        [rehypeShiki, { themes: { light: "github-light", dark: "github-dark" } }],
      ],
    });
    return {
      slug: slugOf(document._meta),
      mdx,
      // A tweet's video is served from video.twimg.com, which answers 403 to
      // any request whose Referer isn't X's own. The reader page turns off
      // cross-origin referrers for articles that embed one (see page.jsx).
      embedsTweet: /<Tweet\b/.test(document.content),
    };
  },
});

export default defineConfig({
  content: [articles, articleBodies],
});
