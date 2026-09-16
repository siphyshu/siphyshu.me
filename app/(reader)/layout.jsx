import Link from "next/link";

// A second layout, sibling to (site). Reader pages deliberately do not inherit
// the shell: the redesign plan's rule is one moment of personality per screen,
// and the hero plus the handprint wall stacked above every article would push
// the first paragraph below the fold and make the wall a thing you scroll past
// rather than a thing you meet.
//
// Both groups still share app/layout.jsx, so <html>, the fonts, the search
// provider and the footer are common.
export default function ReaderLayout({ children }) {
  return (
    <article className="w-full pt-10 pb-16">
      <nav className="mb-10">
        <Link href="/articles" className="text-sm text-gray-500 hover:text-black">
          ← articles
        </Link>
      </nav>
      {children}
    </article>
  );
}
