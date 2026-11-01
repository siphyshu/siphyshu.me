import { FEED, feedItems } from "@/lib/feed";

export const dynamic = "force-static";

// https://www.jsonfeed.org/version/1.1/
export function GET() {
  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: FEED.title,
    home_page_url: FEED.home,
    feed_url: FEED.json,
    description: FEED.description,
    language: "en",
    authors: [{ name: FEED.author, url: FEED.home }],
    items: feedItems.map((item) => ({
      id: item.id,
      url: item.url,
      title: item.title,
      summary: item.summary,
      content_text: item.summary,
      date_published: `${item.date}T00:00:00Z`,
      tags: item.tags,
      ...(item.image && { image: item.image }),
    })),
  };
  return new Response(JSON.stringify(feed, null, 2), {
    headers: { "Content-Type": "application/feed+json; charset=utf-8" },
  });
}
