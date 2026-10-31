import { allArticles } from "content-collections";

type Article = (typeof allArticles)[number];

// Newest first — the order the list shows. Dates are YYYY-MM-DD, so a string
// compare is chronological.
const byDate = [...allArticles].sort((a, b) => b.date.localeCompare(a.date));

/**
 * Up to `limit` other articles, most shared tags first, then newest. Falls back
 * to plain recency when nothing shares a tag, so the list is never empty while
 * there's anything else to read.
 */
export function getRelated(slug: string, limit = 4): Article[] {
  const self = byDate.find((a) => a.slug === slug);
  if (!self) return [];
  const shared = (a: Article) => a.tags.filter((t) => self.tags.includes(t)).length;
  return byDate
    .filter((a) => a.slug !== slug)
    .map((a) => ({ a, score: shared(a) }))
    // Stable sort: equal scores keep the newest-first order of byDate.
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map(({ a }) => a);
}
