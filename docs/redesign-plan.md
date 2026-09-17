# siphyshu.me — redesign plan

Status: **in progress**. Written 2026-09-12. Step 1 (routing skeleton) is done;
steps 2–6 are not started.

A plan for growing the site from a single-route portfolio into a fuller
multi-section site, without diluting the existing minimal/sharp/white look.

---

## Diagnosis

Everything lives in `app/page.jsx`. Tabs are `useState` + `className="block"/"hidden"`,
so both sections render and one is hidden. Search sets `isSearching`, which
unmounts the site to render results inline.

Consequences:

- nothing is linkable, the back button does nothing
- there is no place to put an article view
- search can only ever surface things already on the homepage

The articles list, the article view, more sections, and better search are four
symptoms of one cause. Fix routing and most of them fall out.

---

## Design principles

See [`design-principles.md`](./design-principles.md). The five rules that used
to be here were written ahead of the site and were stricter than it — they
banned rounded containers and colour outside pills while the homepage has
both. The replacements are inferred from what's actually there.

---

## Route architecture

```
/                      hero + handprints + section shell
/projects              grid
/articles              index list
/articles/[slug]       article view          ← new
/gallery  /ctfs  /games                      ← new
/tags/[tag]            everything tagged X, across sections
```

`/tags/[tag]` is the sleeper. Tag pills in `data/tags.ts` already carry
`cursor-pointer` and hover states — the affordance is built and promises
clickability, but nothing happens. Wiring it up is small and turns tags into the
site's navigation spine instead of decoration.

---

## Per-section views

Making every section a card grid is what makes portfolio sites feel generic.
Match the view to the reason someone browses it:

| section  | why you'd browse              | view                                      |
| -------- | ----------------------------- | ----------------------------------------- |
| projects | "what has he built"           | thumbnail grid — current card is right    |
| articles | "is there something on X"     | dense date-led index, small/no thumbnails |
| ctfs     | "which category, did he solve"| an actual `<table>` — mono, hairline rules|
| gallery  | "just look"                   | masonry, no borders, captions on hover    |
| games    | "let me play"                 | large tiles, embed where possible         |

The CTF table is the strongest idea here — writeups are genuinely tabular
(event, category, points, date), and a sharp mono table is on-style while
looking nothing like the rest of the site. That variety is what makes it read as
a place rather than a template. Black hairlines and serif hold it together.

**Articles list specifically:** shrink or drop the 80px thumbnails, lead with the
date, and remove `text-justify` from the subtitle (`ArticleItem.jsx:51` — causes
whitespace rivers at narrow widths, same bug already fixed in `ProjectCard`).
Also `topics` is passed into `ArticleItem` from three call sites and never
rendered; once tags are clickable those topics become the article's tag row.

---

## Search → command palette

`SearchBar.jsx:28` binds Cmd/Ctrl+K to *focus an input*. The keybind already
promises a palette; nobody hits it expecting a focus ring.

- Overlay modal, page dimmed behind it, never unmounted.
- On mobile it becomes a bottom sheet — the `BottomDrawer` primitive already
  exists on `feature/projects-mobile-view`. That work pays off here.
- Results **grouped by section**; each result is a link to a route, not an
  inline render. Requires routing to exist first.
- Include commands, not just content: copy email, go to github, toggle theme.
- The homepage search bar stays visually but becomes a *button* that opens the
  palette. One search implementation, not two.

---

## Articles content

An article view needs content in-repo. MDX in `content/articles/*.mdx` with
frontmatter, rendered server-side.

**Don't migrate the Medium posts.** Keep them as external entries with a small ↗
glyph in the list. The index then holds both hosted and elsewhere-published
pieces, and the article view ships without a migration blocking it.

---

## Caution on new sections

Resist adding sections you can't fill. Four sections with two items each looks
abandoned in a way that two full sections never does.

Rule: **under ~4 items it's a line on the homepage, not a route.**

This also decides the homepage:

- **Up to ~4 sections** — keep the current tab bar, but make tabs real `<Link>`s
  and move hero+handprints into a shared layout, so `/projects` and `/articles`
  render the same shell with the section swapped. Zero visual change, but URLs
  and the back button work and each section is shareable.
- **Past 4 sections** — the tab row overflows on mobile. Home becomes a compact
  index, sections become standalone pages, and the footer carries a sitemap for
  lateral movement.

---

## Build order

1. ~~**Routing skeleton** — unblocks everything else~~ — done. The shell lives in
   `app/(site)/layout.jsx`, sections are pages under it. `/` and `/projects`
   render the same grid; `/` is canonical so the bare domain still opens on
   projects.
2. **Tags clickable → `/tags/[tag]`** — small, kills a dead affordance
3. **Cmd+K palette** — replaces the disliked search, needs routes first
4. **MDX + article view** — biggest single lift
5. **New sections** — cheap once 1 and 4 exist
6. **Polish** — dark mode (`darkMode: "class"` configured with no toggle), RSS,
   OG images, sitemap

---

## Incidental findings

Small things noticed while reading, not part of the redesign:

- `app/page.jsx:53` — `onClick={cycleFrame}` wraps the entire showcase area and
  the `frames` array has one entry. Clicking anywhere in projects/articles runs
  a no-op.
- `app/tags/page.tsx` exists and nothing links to it.
- `globals.css:45` — `img { max-width: unset !important }` is a global
  sledgehammer that will fight every image added from here on.
- The `prefers-color-scheme` block in `globals.css` sets an effectively
  invisible body gradient. Vestigial.
- `ProjectGallery.jsx` is still `.jsx` on `main`; the `.tsx` version is parked on
  `feature/projects-mobile-view`.

See `docs/code-review-triage.md` for the separate correctness/cleanup pass.
