"use client";

import HandprintWall from "@/components/handprint-wall/HandprintWall";
import KonamiCode from "@/components/backstage/KonamiCode";
import HeaderSection2 from "@/components/hero/HeaderSection2";
import NavBar from "@/components/ui/NavBar";
import { NavActionsProvider } from "@/components/ui/NavActionsContext";
import SearchBar from "@/components/search/SearchBar";
import SearchResults from "@/components/search/SearchResults";
import { useSearch } from "@/components/search/SearchContext";

const FRAME_STYLE = "wood-frame-lighter-brown";

// Everything that stays put while you move between sections. Lives in the
// route group's layout, so navigating projects <-> articles swaps only the
// children — the wall keeps its state instead of remounting.
export default function SiteShell({ children }) {
  const { isSearching } = useSearch();

  return (
    <NavActionsProvider>
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
        <SearchResults />
      </div>

      {/* Interactive Artwork - Hide when searching */}
      {!isSearching && (
        <div className="mx-auto mt-8 mb-12">
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
    </NavActionsProvider>
  );
}
