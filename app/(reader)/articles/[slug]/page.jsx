import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXContent } from "@content-collections/mdx/react";
import { allArticleBodies, allArticles } from "content-collections";
import ShareLinks from "@/components/articles/ShareLinks";
import { mdxComponents } from "@/components/articles/mdx-components";
import { getRelated } from "@/lib/articles";
import { formatContentDate } from "@/lib/format";
import { resolveTags, tagInkClasses } from "@/lib/tags";
import { SITE_URL } from "@/lib/site";

// Metadata comes from allArticles, the body from allArticleBodies — the second
// is only ever imported here, on the server, so compiled MDX stays out of the
// client bundle that the list and search palette ship in.

// Only hosted articles have a body, so only they get a page. Medium posts
// link straight out from the list.
export function generateStaticParams() {
  return allArticleBodies.map(({ slug }) => ({ slug }));
}

// Anything else 404s rather than rendering on request.
export const dynamicParams = false;

// "siphyshu.medium.com" -> "Medium": the site's own name for the credit line,
// the bare host for anywhere not listed.
const SITE_NAMES = { "medium.com": "Medium" };
function siteName(url) {
  const host = new URL(url).hostname.replace(/^www\./, "");
  const known = Object.keys(SITE_NAMES).find((d) => host === d || host.endsWith(`.${d}`));
  return known ? SITE_NAMES[known] : host;
}

function findArticle(slug) {
  const article = allArticles.find((a) => a.slug === slug);
  const body = allArticleBodies.find((b) => b.slug === slug);
  return article && body ? { article, body } : null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const found = findArticle(slug);
  if (!found) return {};

  const { article, body } = found;
  return {
    title: `${article.title} // siphyshu`,
    description: article.subtitle,
    alternates: {
      // Points at the original when this is a repost; otherwise at itself.
      // Relative, so metadataBase in app/layout.jsx makes it absolute.
      canonical: article.canonical_url ?? `/articles/${slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.subtitle,
      type: "article",
      publishedTime: article.date,
    },
    // X's video server refuses any request that names another site as its
    // referrer, so an embedded tweet's video never plays. "same-origin" keeps
    // the Referer on this site's own requests and drops it everywhere else —
    // only on articles that embed a tweet, so links elsewhere still show
    // where their visitors came from.
    ...(body.embedsTweet && { referrer: "same-origin" }),
  };
}

// Three grids with the same tracks, stacked: the article's header, its body and
// its ending, all in the text column the compact header uses. Serif is the
// article; the small gray sans is the frame around it — the trail, the date,
// the share row. An article opens with its own first image, if it has one;
// `thumbnail` is only for the list.
export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const found = findArticle(slug);
  if (!found) notFound();

  const { article, body } = found;
  const related = getRelated(slug, 3);
  const tags = resolveTags(article.tags);

  return (
    <article className="pt-12 md:pt-16 pb-10">
      <div className="reader-grid">
        <header className="grid gap-3.5" data-gol-mask>
          {/* Where this sits: the section, then what it's about. The topic is
              the article's first tag, plain text until /tags/[tag] exists. */}
          <nav aria-label="Breadcrumb" className="font-sans text-sm text-gray-500">
            <Link href="/articles" className="hover:text-black">writing</Link>
            {tags[0] && <span> / {tags[0].name}</span>}
          </nav>
          <h1 className="font-bold text-[clamp(2.1rem,6vw,2.8rem)] leading-[1.12] tracking-[-0.015em] [text-wrap:balance]">
            {article.title}
          </h1>
          <p className="text-[1.15rem] leading-[1.55] text-gray-500">{article.subtitle}</p>
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 font-sans text-sm text-gray-500">
            <span>{formatContentDate(article.date)}</span>
            <span aria-hidden>·</span>
            <span>{article.readMinutes} min read</span>
            {tags.map((tag) => (
              <span key={tag.name} className={`px-2 text-[11px] leading-normal border rounded-full ${tagInkClasses(tag.color)}`}>
                {tag.name}
              </span>
            ))}
          </div>
          {article.original_url && (
            // The credit for a post ported from elsewhere. The date is the
            // article's own: it keeps the date it was first published.
            <p className="font-sans text-sm text-gray-500">
              Originally published on{" "}
              <a href={article.original_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-black">
                {siteName(article.original_url)}
              </a>{" "}
              on {formatContentDate(article.date)}.
            </p>
          )}
        </header>
        {article.cover && article.thumbnail && (
          // Hangs into the margin like a figure card, so the picture's edge
          // lines up with nothing and the text's edge stays the text's.
          <Image
            src={article.thumbnail}
            alt=""
            width={1200}
            height={630}
            sizes="(max-width: 680px) 100vw, 676px"
            priority
            className="article-cover"
          />
        )}
      </div>

      {/* Each child is masked from the Game of Life on its own: one rect around
          the lot would take in a full-bleed figure's whole row. */}
      <div className="reader-grid article-body pt-6 pb-10" data-gol-mask-children>
        <MDXContent code={body.mdx} components={mdxComponents} />
      </div>

      {/* The ending, under one black hairline: share and the way back, then a
          few more titles — text only, since the article above is the one
          thing on this page that gets pictures. */}
      <div className="reader-grid">
        <footer className="mt-4 pt-3 border-t border-black font-sans text-[0.9rem] text-gray-500" data-gol-mask>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <span className="mr-1">share</span>
              <ShareLinks url={`${SITE_URL}/articles/${slug}`} title={article.title} />
            </div>
            <Link href="/articles" className="hover:text-black">
              all writing →
            </Link>
          </div>

          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-3.5">more writing</h2>
              <ul className="grid gap-2.5">
                {related.map((a) => (
                  <li key={a.slug} className="flex items-baseline justify-between gap-4">
                    {a.hosted ? (
                      <Link href={a.href} className="font-serif text-[1.02rem] leading-[1.45] text-black hover:underline underline-offset-[3px]">
                        {a.title}
                      </Link>
                    ) : (
                      <a href={a.href} target="_blank" rel="noopener noreferrer" className="font-serif text-[1.02rem] leading-[1.45] text-black hover:underline underline-offset-[3px]">
                        {a.title} ↗
                      </a>
                    )}
                    <span className="text-[0.82rem] shrink-0 tabular-nums">{a.date.slice(0, 4)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </footer>
      </div>
    </article>
  );
}
