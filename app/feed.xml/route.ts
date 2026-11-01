import { FEED, feedItems } from "@/lib/feed";

export const dynamic = "force-static";

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// RSS wants RFC 822 dates; an article only has a day, so midnight UTC.
const rfc822 = (day: string) => new Date(`${day}T00:00:00Z`).toUTCString();

export function GET() {
  const items = feedItems
    .map(
      (item) => `    <item>
      <title>${escape(item.title)}</title>
      <link>${item.url}</link>
      <guid isPermaLink="true">${item.id}</guid>
      <description>${escape(item.summary)}</description>
      <pubDate>${rfc822(item.date)}</pubDate>
${item.tags.map((t) => `      <category>${escape(t)}</category>`).join("\n")}
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(FEED.title)}</title>
    <link>${FEED.home}</link>
    <description>${escape(FEED.description)}</description>
    <language>en</language>
    <atom:link href="${FEED.rss}" rel="self" type="application/rss+xml"/>
${feedItems[0] ? `    <lastBuildDate>${rfc822(feedItems[0].date)}</lastBuildDate>\n` : ""}${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
