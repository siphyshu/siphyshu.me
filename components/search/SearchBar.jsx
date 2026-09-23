"use client"

import { useSyncExternalStore } from "react";
import { Search } from "lucide-react";

// The server has no platform to read, so it renders no hint and the client
// fills in the right one — "Ctrl K" on a Mac was wrong for most visitors.
const subscribe = () => () => {};
const getShortcut = () => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘K" : "Ctrl K");

/**
 * Looks like a text input, is a button: the typing happens on the palette's
 * card, so there's one search on the site rather than two.
 */
const SearchBar = ({ onOpen }) => {
    const shortcut = useSyncExternalStore(subscribe, getShortcut, () => null);

    return (
        <button
            type="button"
            onClick={onOpen}
            // The palette measures this to open right on top of it.
            data-search-bar
            aria-haspopup="dialog"
            aria-keyshortcuts="Meta+K Control+K"
            className="group w-full max-w-md mx-auto flex items-center border border-gray-200 hover:border-gray-300 rounded-md bg-white px-4 py-2.5 text-left text-sm text-gray-400 shadow-sm transition-all duration-200"
        >
            <Search size={18} aria-hidden="true" className="shrink-0 mr-3 group-hover:text-black transition-colors duration-200" />
            <span className="flex-1">Search projects, articles, tags...</span>
            {shortcut && (
                // font-sans: <kbd> defaults to monospace, and Menlo squeezes
                // ⌘ into one cell — it renders ~25% shorter than the K.
                <kbd className="hidden md:inline px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-sans select-none">
                    {shortcut}
                </kbd>
            )}
        </button>
    );
};

export default SearchBar;
