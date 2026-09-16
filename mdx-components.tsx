import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ImgHTMLAttributes,
  TableHTMLAttributes,
} from "react";

// Required at the repo root by Next's file convention — @next/mdx will not work
// in the App Router without it. Note the signature: as of Next 16 this function
// takes no arguments and returns the component map outright. Older versions
// received the caller's components to merge, and that form silently provides
// no overrides here.

function MdxLink({ href = "", ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  // Same-origin links go through next/link for client-side navigation;
  // anything with a scheme or protocol-relative prefix leaves the site. "#foo"
  // is a heading anchor within the current page and must stay a plain <a> —
  // routing it would push a history entry for a scroll.
  const isInternal = href.startsWith("/");
  if (isInternal) return <Link href={href} {...props} />;

  const isHashOnly = href.startsWith("#");
  return (
    <a
      href={href}
      // noreferrer alongside noopener: noopener alone still leaks the full
      // referring URL, which for a draft preview is a URL nobody else has.
      {...(isHashOnly ? {} : { target: "_blank", rel: "noopener noreferrer" })}
      {...props}
    />
  );
}

function MdxImage({ alt = "", ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  // A plain <img>, not next/image. Markdown's image syntax carries no
  // dimensions, and next/image needs either both of them or `fill` plus a
  // positioned parent — neither of which an author writing `![](...)` can
  // supply. The trade is no automatic optimisation for in-body images; the
  // thumbnails that appear in lists and cards still go through next/image,
  // because those come from frontmatter where the component controls the size.
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={alt} loading="lazy" decoding="async" {...props} />;
}

function MdxTable(props: TableHTMLAttributes<HTMLTableElement>) {
  // The wrapper, not the table, is the scroll container. Setting
  // `overflow-x: auto` on the <table> itself requires `display: block`, which
  // throws away the table layout algorithm — columns stop sharing width and
  // the whole thing collapses to shrink-to-fit.
  return (
    <div className="overflow-x-auto">
      <table {...props} />
    </div>
  );
}

const components: MDXComponents = {
  a: MdxLink,
  img: MdxImage,
  table: MdxTable,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
