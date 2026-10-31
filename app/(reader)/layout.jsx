import CompactHeader from "@/components/ui/CompactHeader";

// Sibling to (site): pages here skip the hero, the handprint wall and the
// section tabs, and carry the compact header instead. The article is the one
// loud thing on the page, and stacking the wall above it would push the first
// paragraph below the fold. Both groups share app/layout.jsx, so the footer and
// the Game of Life background are common.
//
// The header sits on the same grid as the article, in the text column, so the
// avatar, the title and every paragraph share one left edge.
export default function ReaderLayout({ children }) {
  return (
    <>
      <div className="reader-grid">
        <CompactHeader />
      </div>
      {children}
    </>
  );
}
