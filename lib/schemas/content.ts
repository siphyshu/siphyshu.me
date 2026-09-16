import { z } from "zod";
import { tags as tagRegistry } from "@/data/tags";

// Frontmatter for everything under content/. This is the publish system's only
// gate: a file that fails here fails the build, by name, rather than rendering
// a page with a blank date or a tag pill that silently vanished.
//
// Deliberately NOT reusing handprintLinkSchema from ./link. That validator
// defends against a visitor POSTing "javascript:alert(1)" into a field that
// later reaches window.open. These URLs are written by the author, live in the
// repo, and pass through code review and git history before they ship — a
// different threat model. Its visitor-facing rules (a 200-character cap, a
// TLD-shape check) would reject perfectly good long canonical URLs while adding
// nothing here. What is worth keeping is the protocol allowlist, so a typo
// can't produce a scheme the browser will happily execute.

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

const urlSchema = z.string().superRefine((value, ctx) => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    ctx.addIssue({ code: "custom", message: `Not a valid URL: ${value}` });
    return;
  }
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    ctx.addIssue({
      code: "custom",
      message: `Only http and https links are allowed, got "${url.protocol}"`,
    });
  }
});

// A path into public/, not a URL. Kept separate so a full https:// thumbnail
// can't be pasted in without also adding the host to next.config.js
// remotePatterns — which would fail at render time, on the page, rather than here.
const assetPathSchema = z
  .string()
  .startsWith("/", "Asset paths are relative to public/, so must start with /");

// Every tag must already exist in data/tags.ts. The old code did
// `.map(id => tags[id]).filter(Boolean)`, so a typo'd tag just quietly rendered
// one fewer pill; this turns that into a build error naming the bad id.
const tagIdSchema = z.string().superRefine((id, ctx) => {
  if (!Object.hasOwn(tagRegistry, id)) {
    ctx.addIssue({
      code: "custom",
      message: `Unknown tag "${id}". Add it to data/tags.ts, or move it to \`keywords\` if it's only meant to be searchable.`,
    });
  }
});

// ISO-8601 calendar dates only. The old data/articles.js used "4-12-2023",
// which is D-M-YYYY here but reads as April 12th to most of the world and to
// every date parser. Storing YYYY-MM-DD makes it sortable as a plain string
// and unambiguous to anyone editing a file.
//
// The preprocess step is not optional. YAML has a native timestamp type, so
// js-yaml turns a bare `date: 2026-01-01` into a JS Date before Zod ever sees
// it, and only `date: "2026-01-01"` arrives as a string. Rejecting the unquoted
// form would mean the most natural way to write a date is also the one that
// fails the build — so both are accepted and normalized here instead.
const isoDateSchema = z
  .preprocess(
    (value) =>
      value instanceof Date ? value.toISOString().slice(0, 10) : value,
    z.string()
  )
  .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), "Date must be YYYY-MM-DD")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    // Round-tripping catches the dates the regex can't: 2023-02-31 matches the
    // shape fine and Date rolls it forward to March 3rd.
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
  }, "Not a real calendar date");

const baseFields = {
  title: z.string().trim().min(1),
  thumbnail: assetPathSchema.optional(),
  // Rendered as pills, and the thing /tags/[tag] will group by.
  tags: z.array(tagIdSchema).default([]),
  // Never rendered. These exist so search can match words that aren't worth a
  // pill — "arduino", "html", "2021". The old data called this `hiddentags` on
  // projects and folded it into `topics` on articles.
  keywords: z.array(z.string()).default([]),
  // Visible in `next dev`, excluded from the production build entirely. This is
  // what makes a piece draftable in-repo without a branch.
  draft: z.boolean().default(false),
};

export const articleFrontmatterSchema = z
  .object({
    ...baseFields,
    // Shown under the title in the index and used as the meta description.
    subtitle: z.string().trim().min(1),
    date: isoDateSchema,
    // Set for pieces published somewhere else — the Medium posts. The index
    // links straight out and no reader page is generated. Per the redesign
    // plan, these are deliberately not migrated: the index carries both hosted
    // and elsewhere-published work, and the reader shipped without waiting on
    // a migration.
    external: urlSchema.optional(),
  })
  .strict();

export const projectFrontmatterSchema = z
  .object({
    ...baseFields,
    description: z.string().trim().min(1),
    links: z
      .object({ github: urlSchema.optional(), external: urlSchema.optional() })
      .strict()
      .default({}),
    // Explicit display order, ascending. The old data/projects.js carried the
    // order implicitly in its array positions and its `id` field was unrelated
    // to it (the array ran 3, 2, 9, 10, 1, 5). Neither survives being split
    // across files, and sorting by date would mean inventing dates that aren't
    // recorded anywhere.
    order: z.number().int(),
  })
  .strict();

export type ArticleFrontmatter = z.infer<typeof articleFrontmatterSchema>;
export type ProjectFrontmatter = z.infer<typeof projectFrontmatterSchema>;

/** Frontmatter plus the things derived from the file itself. */
export type Article = ArticleFrontmatter & {
  slug: string;
  /** False for external pieces and for files with only frontmatter. */
  hasBody: boolean;
};

export type Project = ProjectFrontmatter & {
  slug: string;
  hasBody: boolean;
};
