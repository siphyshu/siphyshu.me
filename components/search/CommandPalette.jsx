"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { ChevronDown, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { escapeRegExp, rankEntries, tokenize } from "./entries";

/**
 * Where the card should sit so it grows out of the search bar: exactly the
 * bar's box — same top edge, left edge and width — with a clip-path that
 * starts at the bar's height. The header is styled to match the bar, so
 * opening reads as the bar extending downward rather than a box appearing.
 * Null means "not anchored" — phones (the keyboard would leave no room below
 * the bar), or the bar is scrolled away or too close to the bottom (⌘K from
 * further down) — and the card takes its usual spot near the top instead.
 */
function measureAnchor() {
    const bar = document.querySelector("[data-search-bar]");
    if (!bar || window.innerWidth < 640) return null;
    const r = bar.getBoundingClientRect();
    if (r.top < 8 || r.top > window.innerHeight - 320) return null;
    return {
        top: `${r.top}px`,
        left: `${r.left}px`,
        width: `${r.width}px`,
        "max-height": `${Math.min(544, window.innerHeight - r.top - 24)}px`,
        // How much of the card shows on the first frame: the bar's height.
        "--bar-h": `${r.height}px`,
    };
}

// A callback ref rather than an effect: Radix's portal mounts the card a
// render after `open` flips, and the card unmounts after every close, so
// "the node just attached" is exactly "the card is opening". Runs before
// paint, so the first frame is already in place.
//
// Desktop, bar in view: sits the card on the bar (measureAnchor). Nothing
// resets on close, so it shrinks back into the same spot.
//
// Phone: the card is a bottom sheet, and on iOS the keyboard covers the
// bottom of the layout viewport without resizing it — `bottom: 0` would put
// the input behind the keys. So it follows the visual viewport instead:
// --keyboard is how much of the screen the keyboard takes, --visible-h what's
// left. The returned cleanup (React 19) stops listening when the card goes.
function placeCard(card) {
    if (!card) return;
    const anchor = measureAnchor();
    if (anchor) {
        card.dataset.anchored = "";
        for (const [prop, value] of Object.entries(anchor)) card.style.setProperty(prop, value);
        return;
    }

    const vv = window.visualViewport;
    if (window.innerWidth >= 640 || !vv) return;
    const update = () => {
        const keyboard = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        card.style.setProperty("--keyboard", `${keyboard}px`);
        card.style.setProperty("--visible-h", `${vv.height}px`);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
        vv.removeEventListener("resize", update);
        vv.removeEventListener("scroll", update);
    };
}

// Rows shown per group before the rest fold into a "N more" row — with the
// query empty too, so the card stays short however many sections and items
// the site grows. A group only folds when that saves at least two rows;
// "1 more" would just be a row standing in for a row.
const PEEK = 3;
// Never folded: a handful of fixed actions (sections, email, socials) that
// don't grow with the site's content, and reach-for-it-now rows at that.
const ALWAYS_OPEN = ["do"];

// Splits on the query's words so each literal hit gets a highlighter swipe.
// A fuzzy-only hit ("sctr" finding scattr, see filterEntry) has no literal
// run of letters to mark, so it simply goes unhighlighted.
function Highlight({ text, tokens }) {
    if (tokens.length === 0) return text;
    const pattern = [...tokens].sort((a, b) => b.length - a.length).map(escapeRegExp).join("|");
    return text.split(new RegExp(`(${pattern})`, "gi")).map((part, i) =>
        // split() with a capture group puts the matches at the odd indices.
        i % 2 === 1 ? <mark key={i} className="highlighter">{part}</mark> : part
    );
}

function Row({ entry, tokens, copied, onSelect }) {
    const detail = copied ? "copied ✓" : entry.detail;
    return (
        <Command.Item value={entry.title} onSelect={onSelect} className="index-card__row">
            <span className="index-card__thumb" aria-hidden="true">
                {entry.thumb ? (
                    <Image src={entry.thumb} alt="" fill sizes="48px" className="object-cover" />
                ) : (
                    entry.icon && <entry.icon size={15} />
                )}
            </span>
            <span className="index-card__title">
                <Highlight text={entry.title} tokens={tokens} />
            </span>
            {detail && <span className="index-card__detail">{detail}</span>}
            {entry.external && (
                // \uFE0E asks for the text glyph: iOS otherwise draws ↗ as a
                // blue emoji tile.
                <span className="index-card__out" aria-label="opens in a new tab">{"↗\uFE0E"}</span>
            )}
        </Command.Item>
    );
}

/**
 * The site's search: an index card that grows out of the search bar. A Radix
 * Dialog (portal, focus trap, Escape, scroll lock) around a cmdk list.
 * cmdk's own Command.Dialog is the same thing minus a way to pass the card
 * a style, which the anchoring needs. Opened by the bar on the homepage or
 * Cmd/Ctrl+K from anywhere on the front of the site.
 */
export default function CommandPalette({ open, setOpen }) {
    const router = useRouter();
    const pathname = usePathname();
    const [query, setQuery] = useState("");
    const [copied, setCopied] = useState(null);
    // Groups unfolded with their "N more" row, for this opening of the card.
    const [expanded, setExpanded] = useState([]);
    // cmdk's selected row, controlled so unfolding a group can move the
    // selection onto the first row it reveals.
    const [selected, setSelected] = useState("");

    useEffect(() => {
        const onKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOpen((o) => !o);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [setOpen]);

    // Every open starts on a blank card.
    const onOpenChange = (next) => {
        if (!next) {
            setQuery("");
            setCopied(null);
            setExpanded([]);
        }
        setOpen(next);
    };

    const run = (entry) => {
        if (entry.action === "copy") {
            navigator.clipboard?.writeText(entry.value).then(() => setCopied(entry.id));
            return;
        }
        onOpenChange(false);
        if (entry.external) {
            window.open(entry.external, "_blank", "noopener,noreferrer");
            return;
        }

        // Straight away, not after the close animation: Radix's scroll lock is
        // overflow: hidden, which blocks the visitor's scrolling but not ours.
        const [path, hash] = entry.href.split("#");
        if (path !== pathname) {
            // scroll: false because the destination scrolls itself — a card to
            // its hash (useHashMark), a section to the tabs below.
            router.push(entry.href, { scroll: false });
        } else if (hash) {
            // pushState doesn't fire hashchange; useHashMark listens for it.
            window.history.pushState(null, "", entry.href);
            window.dispatchEvent(new HashChangeEvent("hashchange"));
        }
        if (!hash) {
            const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            document.getElementById("sections")?.scrollIntoView({
                block: "start",
                behavior: reduce ? "auto" : "smooth",
            });
        }
    };

    const tokens = tokenize(query);

    const groups = rankEntries(query);

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="palette-backdrop" />
                <Dialog.Content
                    // font-serif again: the dialog portals to <body>, outside the
                    // wrapper in the root layout that sets it.
                    ref={placeCard}
                    className="index-card font-serif"
                    aria-describedby={undefined}
                >
                    <Dialog.Title className="sr-only">search the site</Dialog.Title>
                    <Command
                        label="search the site"
                        loop
                        // Ranking (and so which rows make the cut) happens in
                        // rankEntries; cmdk just runs the keyboard.
                        shouldFilter={false}
                        value={selected}
                        onValueChange={setSelected}
                    >
                        <div className="index-card__head">
                            <Search size={18} aria-hidden="true" className="index-card__search" />
                            <Command.Input
                                value={query}
                                onValueChange={setQuery}
                                // Same words as the bar it grows out of.
                                placeholder="Search projects, articles, tags..."
                                autoCorrect="off"
                                spellCheck={false}
                                enterKeyHint="go"
                                className="index-card__input"
                            />
                            <button type="button" onClick={() => onOpenChange(false)} className="index-card__close">
                                <kbd className="index-card__close-key">esc</kbd>
                                <span className="index-card__close-word">cancel</span>
                            </button>
                        </div>

                        <Command.List className="index-card__body" label="results">
                            <Command.Empty className="index-card__empty">
                                nothing on this card for “{query.trim()}”
                            </Command.Empty>
                            {groups.map(({ group, entries }) => {
                                const folded =
                                    !expanded.includes(group) &&
                                    !ALWAYS_OPEN.includes(group) &&
                                    entries.length > PEEK + 1;
                                const shown = folded ? entries.slice(0, PEEK) : entries;
                                const hidden = entries.length - shown.length;
                                return (
                                    <Command.Group key={group} heading={group}>
                                        {shown.map((entry) => (
                                            <Row
                                                key={entry.id}
                                                entry={entry}
                                                tokens={tokens}
                                                copied={copied === entry.id}
                                                onSelect={() => run(entry)}
                                            />
                                        ))}
                                        {hidden > 0 && (
                                            <Command.Item
                                                value={`more-${group}`}
                                                onSelect={() => {
                                                    setExpanded((e) => [...e, group]);
                                                    // The row that takes this one's place.
                                                    setSelected(entries[PEEK].title);
                                                }}
                                                className="index-card__row index-card__more"
                                            >
                                                <span className="index-card__thumb" aria-hidden="true">
                                                    <ChevronDown size={15} />
                                                </span>
                                                {/* Just "4 more": the group's heading already
                                                    says what of, and "4 more do" doesn't read. */}
                                                <span className="index-card__title">{hidden} more</span>
                                            </Command.Item>
                                        )}
                                    </Command.Group>
                                );
                            })}
                        </Command.List>

                        <div className="index-card__foot" aria-hidden="true">
                            <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
                            <span><kbd>↵</kbd> open</span>
                            <span><kbd>esc</kbd> close</span>
                        </div>
                    </Command>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
