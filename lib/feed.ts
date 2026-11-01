import { byDate } from "@/lib/articles";
import { SITE_URL } from "@/lib/site";

// What /feed.xml and /feed.json share. Entries are summaries — the subtitle
// and a link — not full posts: the bodies are MDX built on the site's own
// components (figures, tweet embeds), which a feed reader can't render.

export const FEED = {
  title: "siphyshu // jaiyank",
  description: "Articles by Jaiyank aka Siphyshu.",
  author: "Jaiyank Saxena",
  home: SITE_URL,
  rss: `${SITE_URL}/feed.xml`,
  json: `${SITE_URL}/feed.json`,
};

export const feedItems = byDate.map((a) => ({
  id: `${SITE_URL}/articles/${a.slug}`,
  url: new URL(a.href, SITE_URL).href,
  title: a.title,
  summary: a.subtitle,
  date: a.date,
  tags: a.tags,
  image: a.thumbnail && new URL(a.thumbnail, SITE_URL).href,
}));
