import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import matter from "gray-matter";
import type { z } from "zod";
import {
  articleFrontmatterSchema,
  projectFrontmatterSchema,
  type Article,
  type Project,
} from "@/lib/schemas/content";

// Server-only: this reads the filesystem. Enforced by convention rather than
// the `server-only` package, which isn't a dependency here — the same
// arrangement as lib/turnstile.ts. Importing it from a "use client" module
// fails the build on node:fs resolution, which is a loud enough failure mode.
//
// Everything here runs at build time. Both [slug] routes use
// generateStaticParams, so no request ever waits on a disk read.

const CONTENT_ROOT = path.join(process.cwd(), "content");

/**
 * Drafts are visible in `next dev` and absent from a production build.
 *
 * Read once at module scope: NODE_ENV cannot change between two reads in one
 * process, and hoisting it keeps the rule one readable line rather than a
 * condition repeated at every call site.
 */
const INCLUDE_DRAFTS = process.env.NODE_ENV === "development";

const MDX_EXTENSION = ".mdx";

/** Files starting with "_" are scaffolding — templates, notes — never content. */
function isContentFile(name: string): boolean {
  return name.endsWith(MDX_EXTENSION) && !name.startsWith("_");
}

interface RawEntry {
  slug: string;
  frontmatter: Record<string, unknown>;
  /** Whether anything follows the frontmatter block. */
  hasBody: boolean;
}

async function readCollection(directory: string): Promise<RawEntry[]> {
  const dir = path.join(CONTENT_ROOT, directory);

  let filenames: string[];
  try {
    filenames = (await readdir(dir)).filter(isContentFile);
  } catch (error) {
    // A missing directory means "nothing published yet", a legitimate state
    // for a collection that hasn't been started. Anything else — permissions,
    // a corrupt path — is a real fault, and must not be flattened into an
    // empty list that renders as a convincing blank page.
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  return Promise.all(
    filenames.map(async (filename) => {
      const raw = await readFile(path.join(dir, filename), "utf8");
      const { data, content } = matter(raw);
      return {
        slug: filename.slice(0, -MDX_EXTENSION.length),
        frontmatter: data,
        hasBody: content.trim().length > 0,
      };
    })
  );
}

/**
 * Turns a Zod failure into a message that names the file and every bad field.
 *
 * Without this the build fails on a bare "Invalid input: expected string" and
 * finding which content file caused it means bisecting by hand — the exact
 * papercut that makes a publish system feel fragile to write into.
 */
function describeFailure(error: z.ZodError, file: string): Error {
  const problems = error.issues
    .map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  return new Error(`Invalid frontmatter in ${file}:\n${problems}`);
}

export const getArticles = cache(async (): Promise<Article[]> => {
  const entries = await readCollection("articles");

  const articles = entries.map(({ slug, frontmatter, hasBody }) => {
    const file = `content/articles/${slug}.mdx`;
    const parsed = articleFrontmatterSchema.safeParse(frontmatter);
    if (!parsed.success) throw describeFailure(parsed.error, file);

    if (parsed.data.external && hasBody) {
      // Allowing both would be ambiguous: the index would link out to Medium
      // while an orphan reader page sat at /articles/<slug> that nothing
      // linked to and nothing would ever update.
      throw new Error(
        `${file} has both \`external\` and a body. An article is either hosted here or published elsewhere, not both.`
      );
    }

    return { ...parsed.data, slug, hasBody };
  });

  return articles
    .filter((article) => INCLUDE_DRAFTS || !article.draft)
    // Newest first. Dates are YYYY-MM-DD, so a plain string compare is
    // chronological — the same property the handprints route relies on for
    // its ISO timestamps.
    .sort((a, b) => b.date.localeCompare(a.date));
});

export const getProjects = cache(async (): Promise<Project[]> => {
  const entries = await readCollection("projects");

  const projects = entries.map(({ slug, frontmatter, hasBody }) => {
    const parsed = projectFrontmatterSchema.safeParse(frontmatter);
    if (!parsed.success) {
      throw describeFailure(parsed.error, `content/projects/${slug}.mdx`);
    }
    return { ...parsed.data, slug, hasBody };
  });

  return projects
    .filter((project) => INCLUDE_DRAFTS || !project.draft)
    .sort((a, b) => a.order - b.order);
});

export const getArticle = cache(
  async (slug: string): Promise<Article | null> =>
    (await getArticles()).find((article) => article.slug === slug) ?? null
);

export const getProject = cache(
  async (slug: string): Promise<Project | null> =>
    (await getProjects()).find((project) => project.slug === slug) ?? null
);
