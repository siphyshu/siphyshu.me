"use client";

import { useState } from "react";
import HandprintWall from "@/components/handprint-wall/HandprintWall";
import KonamiCode from "@/components/backstage/KonamiCode";
import HeaderSection2 from "@/components/hero/HeaderSection2";
import NavBar from "@/components/ui/NavBar";
import HeldHeight from "@/components/ui/HeldHeight";
import { NavActionsProvider } from "@/components/ui/NavActionsContext";
import SearchBar from "@/components/search/SearchBar";
import CommandPalette from "@/components/search/CommandPalette";

const FRAME_STYLE = "wood-frame-lighter-brown";

// Everything that stays put while you move between sections. Lives in the
// route group's layout, so navigating projects <-> articles swaps only the
// children — the wall keeps its state instead of remounting.
export default function SiteShell({ children }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <NavActionsProvider>
      {/* Renders nothing — a keydown listener scoped to the shell, so the
          sequence works anywhere on the front of the site but not while
          reading an article. */}
      <KonamiCode />

      {/* Portalled over the page, with its own Cmd/Ctrl+K listener — scoped
          to the shell for the same reason as the Konami code. */}
      <CommandPalette open={searchOpen} setOpen={setSearchOpen} />

      {/* Introduction */}
      <HeaderSection2 />

      {/* Search */}
      <div className="mt-4 mb-12">
        <SearchBar onOpen={() => setSearchOpen(true)} />
      </div>

      {/* Interactive Artwork */}
      <div className="mx-auto mt-8 mb-12">
        <HandprintWall className={FRAME_STYLE} />
      </div>

      {/* Showcase Section. id="sections" is where the search palette's
          "go to …" rows scroll to. */}
      <div id="sections" className="max-w-4xl w-full mx-auto mb-16" data-gol-mask>
        <NavBar />
        <HeldHeight>{children}</HeldHeight>
      </div>
    </NavActionsProvider>
  );
}
