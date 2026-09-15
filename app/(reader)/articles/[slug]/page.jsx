import { notFound } from "next/navigation";
import { getArticle, getArticles } from "@/lib/content";
import { formatContentDate } from "@/lib/format";
import { resolveTags } from "@/lib/tags";
import { tagColorVariants } from "@/data/tags";

// Every article that lives here is known at build time, so all of them are
// prerendered and nothing is generated on demand.
export async function generateStaticParams() {
  const articles = await getArticles();
  // External pieces have no body to render — the index links straight to
  // Medium — so they get no route at all rather than an empty page.
  return articles
    .filter((article) => article.hasBody)
    .map((article) => ({ slug: article.slug }));
}

// Anything outside that list 404s instead of being rendered on request. Without
// this, /articles/<any-typo> would try to import a file that isn't there and
// fail as a server error rather than a missing page.
export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};

  return {
    title: `${article.title} // siphyshu`,
    description: article.subtitle,
    openGraph: {
      title: article.title,
      description: article.subtitle,
      type: "article",
      publishedTime: article.date,
    },
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = await getArticle(slug);

  // Unreachable while dynamicParams is false, but the import below would throw
  // a module-not-found rather than a 404 if that ever changed.
  if (!article || !article.hasBody) notFound();

  const { default: Body } = await import(`@/content/articles/${slug}.mdx`);
  const tags = resolveTags(article.tags);

  return (
    <>
      <header className="mb-10 pb-8 border-b border-black">
        <div className="text-gray-500 text-xs uppercase tracking-wider">
          {formatContentDate(article.date)}
        </div>
        <h1 className="mt-3 text-3xl md:text-4xl leading-tight">{article.title}</h1>
        <p className="mt-4 text-gray-600 leading-relaxed">{article.subtitle}</p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5">
            {tags.map((tag) => (
              <span
                key={tag.name}
                className={`px-2 py-1 text-[10px] border rounded-full ${tagColorVariants[tag.color]}`}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* `prose-article` carries the overrides that the typography plugin and
          the global img rule would otherwise win — see globals.css. */}
      <div className="prose prose-lg max-w-none prose-article">
        <Body />
      </div>
    </>
  );
}
