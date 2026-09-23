import { projects } from "@/data/projects";
import { articles } from "@/data/articles";
import { gallery } from "@/data/gallery";
import { tags } from "@/data/tags";
import { LINKS } from "@/components/hero/LinkPanel";
import { slugify } from "@/lib/format";
import { FileText, FolderGit2, Images, Mail } from "lucide-react";

// Shown on the card, and the address "copy email" puts on the clipboard.
export const EMAIL = "siphyshu@gmail.com";

// Everything the palette can find, one row each. The whole site fits on a
// single card (a couple dozen rows), so an empty query lists all of it and
// typing only narrows — it's the site's index more than a search engine.
// rankEntries below decides what matches and in what order; cmdk only runs
// the keyboard and the list. Titles double as cmdk's item values, so they
// have to stay unique.
//
// Content rows carry their own thumbnail; the rest carry an icon.
//
// Every row is one of:
//   href      — a page on the site (may carry a #hash to a specific card)
//   external  — somewhere else, opened in a new tab
//   action    — something done in place ("copy")
export const GROUPS = ["projects", "articles", "photos", "do"];

const stripMarkdown = (s) => s.replace(/[_*`]/g, "");

export const ENTRIES = [
    ...projects.map((p) => ({
        id: `project-${p.id}`,
        group: "projects",
        title: p.title,
        // Tags, not the description: they fit on the row, and the full
        // sentence only ever showed as "A dynamic wallpaper eng…".
        detail: p.tags.map((t) => tags[t]?.name).filter(Boolean).join(" · "),
        thumb: p.thumbnail,
        keywords: [
            stripMarkdown(p.description),
            ...p.tags,
            ...p.tags.map((t) => tags[t]?.name).filter(Boolean),
            ...(p.hiddentags ?? []),
        ].join(" "),
        href: `/projects#${slugify(p.title)}`,
    })),
    ...articles.map((a) => ({
        id: `article-${a.id}`,
        group: "articles",
        title: a.title,
        // Dates are stored d-m-yyyy; the year is all a row has room for.
        detail: `medium · ${a.date.split("-").pop()}`,
        thumb: a.thumbnail,
        keywords: `${a.subtitle} ${(a.topics ?? []).join(" ")}`,
        external: a.link,
    })),
    ...gallery.map((g) => ({
        id: `photo-${g.id}`,
        group: "photos",
        title: g.caption,
        detail: "",
        thumb: g.image,
        keywords: "gallery photo",
        href: `/gallery#photo-${g.id}`,
    })),
    ...[
        ["projects", FolderGit2],
        ["articles", FileText],
        ["gallery", Images],
    ].map(([section, icon]) => ({
        id: `go-${section}`,
        icon,
        group: "do",
        title: `go to ${section}`,
        detail: "",
        keywords: "section page tab",
        href: `/${section}`,
    })),
    ...(EMAIL
        ? [{
            id: "copy-email",
            group: "do",
            title: "copy email",
            icon: Mail,
            detail: EMAIL,
            keywords: "contact mail reach",
            action: "copy",
            value: EMAIL,
        }]
        : []),
    ...LINKS.map((l) => ({
        id: `link-${slugify(l.text)}`,
        group: "do",
        title: l.text.toLowerCase(),
        icon: l.icon,
        detail: l.href.replace(/^https:\/\//, ""),
        keywords: "social profile contact",
        external: l.href,
    })),
];

export function tokenize(query) {
    return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

// Letters of `token` appear in `text` in order, close together: "sctr" finds
// scattr. The span limit is what keeps it honest on long titles — without it
// "snake" matched a photo caption on s…n…a…k…e spread over forty letters.
function isNearSubsequence(token, text) {
    const maxSpan = token.length * 2;
    for (let start = text.indexOf(token[0]); start !== -1; start = text.indexOf(token[0], start + 1)) {
        let i = 1;
        let end = start;
        for (let j = start + 1; j < text.length && i < token.length && j - start < maxSpan; j++) {
            if (text[j] === token[i]) { i++; end = j; }
        }
        if (i === token.length && end - start < maxSpan) return true;
    }
    return false;
}

/**
 * How well a row matches: 0 hides it, higher sorts first. cmdk's default
 * (command-score) let a query's letters scatter across a whole description,
 * so "cat" matched every project on c…a…t and ranked pong-R4 above scattr.
 * Here literal hits lead, and the typo-forgiving fuzzy match only runs
 * against titles, which are short enough for it to mean something.
 */
export function filterEntry(title, query, keywords = []) {
    const tokens = tokenize(query);
    const t = title.toLowerCase();
    const rest = keywords.join(" ").toLowerCase();
    let total = 0;
    for (const token of tokens) {
        if (new RegExp(`(^|[^a-z0-9])${escapeRegExp(token)}`).test(t)) total += 1;
        else if (t.includes(token)) total += 0.8;
        else if (rest.includes(token)) total += 0.5;
        else if (isNearSubsequence(token, t)) total += 0.3;
        else return 0;
    }
    return tokens.length ? total / tokens.length : 1;
}

/**
 * Returns [{ group, entries }] in display order, every group's rows best
 * match first. With no query everything matches equally, so groups and rows
 * keep their order from GROUPS and the data files. With one, empty groups
 * drop out and the group holding the best hit comes first — "github" should
 * land on the link, not below every project. (Array.prototype.sort is
 * stable, so ties keep their original order.)
 */
export function rankEntries(query) {
    return GROUPS
        .map((group) => {
            const rows = ENTRIES
                .filter((e) => e.group === group)
                .map((entry) => ({
                    entry,
                    score: query.trim() ? filterEntry(entry.title, query, [entry.detail, entry.keywords]) : 1,
                }))
                .filter((r) => r.score > 0)
                .sort((a, b) => b.score - a.score);
            return { group, entries: rows.map((r) => r.entry), best: rows[0]?.score ?? 0 };
        })
        .filter((g) => g.entries.length > 0)
        .sort((a, b) => b.best - a.best);
}

export function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
