import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { Tweet as ReactTweet } from "react-tweet";
// Drafts' figures: components/drafts/ locally, an empty stub elsewhere
// (tsconfig "@drafts" tries the folder first, then components/drafts-stub.ts).
import * as drafts from "@drafts";
import type {
  AnchorHTMLAttributes,
  ImgHTMLAttributes,
  ReactNode,
  TableHTMLAttributes,
} from "react";

// What markdown elements render as inside an article body. Passed to
// <MDXContent components={…}> by the reader route. Not Next's root
// mdx-components.tsx convention — that file is only read by @next/mdx, and the
// bodies here are compiled by content-collections instead.
//
// Custom components an article can use by name (<Figure>, <Signoff>, …) go in
// this map too.

function MdxLink({ href = "", ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  // Same-origin links go through next/link for client-side navigation. "#foo"
  // is a heading on this page and stays a plain <a> — routing it would push a
  // history entry for a scroll. Anything else leaves the site.
  if (href.startsWith("/")) return <Link href={href} {...props} />;
  if (href.startsWith("#")) return <a href={href} {...props} />;

  // noreferrer alongside noopener: noopener alone still leaks the full
  // referring URL, which for a draft preview is a URL nobody else has.
  return <a href={href} target="_blank" rel="noopener noreferrer" {...props} />;
}

function MdxImage({ alt = "", ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  // A plain <img>, not next/image. Markdown's image syntax carries no
  // dimensions, and next/image needs either both or `fill` plus a positioned
  // parent — neither of which `![](...)` can supply. The .prose-article rule in
  // globals.css keeps it inside the column.
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={alt} loading="lazy" decoding="async" {...props} />;
}

function MdxTable(props: TableHTMLAttributes<HTMLTableElement>) {
  // The wrapper, not the table, scrolls. `overflow-x: auto` on the <table>
  // itself needs `display: block`, which drops the table layout algorithm —
  // columns stop sharing width and the whole thing collapses to shrink-to-fit.
  return (
    <div className="overflow-x-auto">
      <table {...props} />
    </div>
  );
}

// A demo, chart or diagram: a numbered card that hangs into the margin by its
// own padding, so its contents line up with the text (see .fig in
// globals.css). Either an image, or whatever is placed inside it:
//   <Figure src="…" alt="…" caption="…" />
//   <Figure caption="…"><Demo /></Figure>
// size="full" is the one way out of the column — a picture far wider than the
// text (up to 72rem, edge to edge only on phones), its caption kept in the
// column. Plain pictures in the text don't need
// this at all: markdown's ![]() or a bare <figure> does.
function Figure({
  src,
  alt = "",
  caption,
  size = "content",
  children,
}: {
  src?: string;
  alt?: string;
  caption?: ReactNode;
  size?: "content" | "full";
  children?: ReactNode;
}) {
  return (
    <figure className={size === "full" ? "bleed-full" : "fig"}>
      {src ? <MdxImage src={src} alt={alt} /> : children}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

// The closing line, set in the frame's small sans rather than the article's
// serif: <Signoff>thanks for reading!</Signoff>
function Signoff({ children }: { children: ReactNode }) {
  return <p className="signoff">{children}</p>;
}

// A tweet, rendered by react-tweet: fetched on the server when the page is
// built and shipped as plain markup — no script from X on the page, nothing
// that pops in after load. Its theme follows data-theme on <html>, which
// react-tweet's stylesheet reads, light switch included:
//   <Tweet id="1727035609225572524" />
function Tweet({ id }: { id: string }) {
  return (
    <div className="tweet">
      <ReactTweet id={id} />
    </div>
  );
}

// A YouTube video, from the privacy-enhanced domain. YouTube refuses to play
// an embed whose request names no site (error 153, "video player
// configuration error"), and an article that embeds a tweet turns referrers
// off page-wide for X's sake (see page.jsx). The iframe's own referrerPolicy
// overrides that for this one request, and sends only the origin — never the
// article's full URL:
//   <YouTube id="1QJ83lrbu5c" title="Snake-R4 demo" />
function YouTube({ id, title }: { id: string; title: string }) {
  return (
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${id}`}
      title={title}
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      className="w-full aspect-video"
    />
  );
}

export const mdxComponents: MDXComponents = {
  a: MdxLink,
  img: MdxImage,
  table: MdxTable,
  Figure,
  Signoff,
  Tweet,
  YouTube,
  // Draft articles' figures. Client components, so their code only reaches
  // the browser on a page that actually renders them. A published article's
  // figures move out of components/drafts/ with it, and get listed here.
  ...drafts,
};
