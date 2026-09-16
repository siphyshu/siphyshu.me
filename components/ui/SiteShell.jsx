"use client";

import HandprintWall from "@/components/handprint-wall/HandprintWall";
import KonamiCode from "@/components/backstage/KonamiCode";
import HeaderSection2 from "@/components/hero/HeaderSection2";
import NavBar from "@/components/ui/NavBar";
import SearchBar from "@/components/search/SearchBar";
import SearchResults from "@/components/search/SearchResults";
import { useSearch } from "@/components/search/SearchContext";

const FRAME_STYLE = "wood-frame-lighter-brown";

// Everything that stays put while you move between sections. Lives in the
// route group's layout, so navigating projects <-> articles swaps only the
// children — the wall keeps its state instead of remounting.
// `projects` and `articles` are only here to reach SearchResults, which is a
// client component and so cannot read content/ itself. They are passed down
// from the layout rather than fetched, so the read happens once per render.
export default function SiteShell({ children, projects = [], articles = [] }) {
  const { isSearching } = useSearch();

  return (
    <>
      {/* Renders nothing — a keydown listener scoped to the shell, so the
          sequence works anywhere on the front of the site but not while
          reading an article. */}
      <KonamiCode />

      {/* Introduction */}
      <HeaderSection2 />

      {/* Search Section */}
      <div className="mt-4 mb-12">
        <SearchBar />
      </div>

      {/* Search Results */}
      <div className={isSearching ? "block" : "hidden"}>
        <SearchResults projects={projects} articles={articles} />
      </div>

      {/* Interactive Artwork - Hide when searching */}
      {!isSearching && (
        <div className="mx-auto my-8">
          <HandprintWall className={FRAME_STYLE} />
        </div>
      )}

      {/* Showcase Section - Hide when searching */}
      {!isSearching && (
        <div className="max-w-4xl w-full mx-auto mb-16">
          <NavBar />
          {children}
        </div>
      )}
    </>
  );
}
