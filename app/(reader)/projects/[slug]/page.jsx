import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXContent } from "@content-collections/mdx/react";
import { allProjectBodies } from "content-collections";
import { mdxComponents } from "@/components/articles/mdx-components";
import TryCommand from "@/components/projects/TryCommand";
import { tagColorVariants } from "@/data/tags";
import { projects } from "@/lib/projects";
import { resolveTags, tagSearchHref } from "@/lib/tags";

// A project's page: the thing as it is now, in one screen — picture, what it
// is, the facts, one thing to do — then the story of building it. Shares the
// reader's header and grid, so it's the same site as the articles; it leads
// with the work, then gets to the words. Only projects with a write-up get one.

export function generateStaticParams() {
  return allProjectBodies.map(({ slug }) => ({ slug }));
}

export const dynamicParams = false;

function findProject(slug) {
  const project = projects.find((p) => p.slug === slug);
  const body = allProjectBodies.find((b) => b.slug === slug);
  return project && body ? { project, body } : null;
}

// Card descriptions allow the odd _(aside)_; here it's plain text.
const plain = (s) => s.replace(/[_*`]/g, "");

// The card shows `external` as an icon; written out, it's the address itself.
function linkLabel(key, url) {
  if (key === "external") return new URL(url).hostname.replace(/^www\./, "");
  return key;
}

const LINK = "text-[var(--accent)] underline decoration-1 underline-offset-[3px] hover:decoration-2";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const found = findProject(slug);
  if (!found) return {};
  const { project } = found;
  return {
    title: `${project.title} // siphyshu`,
    description: plain(project.description),
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      title: project.title,
      description: plain(project.description),
      ...(project.thumbnail && { images: [project.thumbnail] }),
    },
  };
}

// The facts, on a card like the wall's placard: a bordered object, because
// it's a label for the thing above it rather than part of the reading.
function Placard({ project }) {
  const ongoing = project.tags.includes("wip");
  const rows = [
    ongoing && ["status", <span key="s" className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />ongoing</span>],
    project.since && ["since", project.since],
    project.stack.length > 0 && ["built with", project.stack.join(", ")],
    project.platforms.length > 0 && ["runs on", project.platforms.join(", ")],
  ].filter(Boolean);

  return (
    <aside className="self-start bg-white border border-black shadow-md p-5 font-sans text-sm" data-gol-mask>
      <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5">
        {rows.map(([term, value]) => (
          <div key={term} className="contents">
            <dt className="text-gray-500">{term}</dt>
            <dd className="text-black">{value}</dd>
          </div>
        ))}
      </dl>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-4 pt-4 border-t border-[var(--rule)]">
        {Object.entries(project.links).map(([key, url]) => (
          <li key={key}>
            <a href={url} target="_blank" rel="noopener noreferrer" className={LINK}>
              {linkLabel(key, url)} ↗
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function Try({ action }) {
  if (!action) return null;
  if (action.url) {
    return (
      <a
        href={action.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-4 py-2.5 border border-black rounded-lg font-sans text-[0.95rem] text-black hover:bg-[var(--surface)]"
      >
        {action.label} ↗
      </a>
    );
  }
  return (
    <div className="grid gap-2">
      <TryCommand command={action.command} />
      {action.more && (
        <p className="font-sans text-[0.82rem] text-[var(--muted)]">
          or with{" "}
          <a href={action.more.url} target="_blank" rel="noopener noreferrer" className={LINK}>
            {action.more.label}
          </a>
        </p>
      )}
    </div>
  );
}

// The title, the one line, the tags and the install line, beside the placard.
function Intro({ project }) {
  // The placard says "ongoing" in words, so the pill row leaves it out.
  const tags = resolveTags(project.tags).filter((t) => !t.special);
  return (
    <div className="showcase-wide grid md:grid-cols-[1fr_17rem] gap-8 md:gap-12 mt-10">
      <header className="grid gap-4 content-start" data-gol-mask>
        <h1 className="font-bold text-[clamp(2.1rem,6vw,2.8rem)] leading-[1.12] tracking-[-0.015em]">
          {project.title}
        </h1>
        <p className="text-[1.15rem] leading-[1.55] text-gray-500">{plain(project.description)}</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Link
                key={tag.name}
                href={tagSearchHref(tag, "/projects")}
                className={`px-2 text-[11px] leading-normal font-sans border rounded-full ${tagColorVariants[tag.color]}`}
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}
        <div className="mt-2">
          <Try action={project.try} />
        </div>
      </header>
      <Placard project={project} />
    </div>
  );
}

// The picture at the top, in the thumbnail's 1.91:1 frame so every project's
// sits the same and nothing shifts while it loads.
function StillHero({ project }) {
  const hero = project.hero ?? project.thumbnail;
  if (!hero) return null;
  return (
    <div className="showcase-wide relative mt-5 aspect-[1.91/1] overflow-hidden rounded-lg border border-[var(--rule)]">
      <Image src={hero} alt="" fill sizes="(max-width: 940px) 100vw, 56rem" priority className="object-cover" />
    </div>
  );
}

function Body({ body, className = "" }) {
  return (
    <div className={`reader-grid article-body pb-6 ${className}`} data-gol-mask-children>
      <MDXContent code={body.mdx} components={mdxComponents} />
    </div>
  );
}

// Versions as a ledger. Time leaves marks: every entry but the newest is
// faded, and comes back on hover.
function History({ project }) {
  if (project.history.length === 0) return null;
  const newest = project.history.length - 1;
  return (
    <div className="reader-grid">
      <section className="pt-4 pb-6" data-gol-mask>
        <h2 className="font-sans text-[0.9rem] text-gray-500 pb-2 border-b border-black">history</h2>
        <ol>
          {project.history.map((entry, i) => (
            <li
              key={`${entry.year}-${entry.title}`}
              className={`grid grid-cols-[3.5rem_1fr] gap-x-4 py-3 border-b border-[var(--rule)] last:border-b-0 transition-opacity ${i < newest ? "opacity-45 hover:opacity-100" : ""}`}
            >
              <span className="font-sans text-sm text-gray-500 tabular-nums pt-0.5">{entry.year}</span>
              <div>
                <p className="text-[1.02rem] text-black">{entry.title}</p>
                {entry.note && <p className="text-[0.92rem] leading-snug text-gray-500 mt-0.5">{entry.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

// The ending, as an article's: the way back, then the rest of the list — to
// each one's page, or its card until it has one.
function Ending({ others }) {
  return (
    <div className="reader-grid">
      <footer className="mt-4 pt-3 border-t border-black font-sans text-[0.9rem] text-gray-500" data-gol-mask>
        <div className="flex justify-end">
          <Link href="/projects" className="hover:text-black">
            all projects →
          </Link>
        </div>

        {others.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-3.5">more projects</h2>
            <ul className="grid gap-2.5">
              {others.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={p.href ?? `/projects#${p.slug}`}
                    className="font-serif text-[1.02rem] leading-[1.45] text-black hover:underline underline-offset-[3px]"
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </footer>
    </div>
  );
}

// The picture, the intro, the screenshots in a grid, then the write-up.
function Showcase({ project, body, others }) {
  return (
    <>
      <div className="reader-grid">
        <StillHero project={project} />
        <Intro project={project} />
        {project.gallery.length > 0 && (
          <div className="showcase-wide grid sm:grid-cols-2 gap-x-6 gap-y-8 mt-14" data-gol-mask-children>
            {project.gallery.map((shot) => (
              <figure key={shot.src} className="grid gap-2.5">
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  width={1600}
                  height={1000}
                  sizes="(max-width: 640px) 100vw, 28rem"
                  className="w-full h-auto rounded-lg border border-[var(--rule)]"
                />
                <figcaption className="font-sans text-[0.82rem] leading-[1.45] text-[var(--muted)]">
                  {shot.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
      <Body body={body} className="pt-14" />
      <History project={project} />
      <Ending others={others} />
    </>
  );
}

export default async function ProjectPage({ params }) {
  const { slug } = await params;
  const found = findProject(slug);
  if (!found) notFound();

  const { project, body } = found;
  const others = projects.filter((p) => p.slug !== slug);

  return (
    <article className="pt-12 md:pt-16 pb-10">
      <div className="reader-grid">
        <nav aria-label="Breadcrumb" className="showcase-wide font-sans text-sm text-gray-500" data-gol-mask>
          <Link href="/projects" className="hover:text-black">projects</Link>
        </nav>
      </div>
      <Showcase project={project} body={body} others={others} />
    </article>
  );
}
