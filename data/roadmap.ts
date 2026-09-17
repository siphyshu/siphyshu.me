// The seed for the backstage board — not the live source.
//
// The board lives in MongoDB now, where it can be edited from the page itself.
// This file is read exactly once, the first time the board is opened against
// an empty database (see lib/backstage-store.ts), and never again: editing it
// after that changes nothing. It stays in the repo as the record of where the
// board started, and so a fresh database elsewhere starts from the same place.
//
// The statuses here are the old six. The store maps them onto the four the
// board uses — "building" becomes doing, "later" folds into idea, and
// "blocked" becomes next-up with the held flag set.

export type SeedStatus = "done" | "building" | "next" | "later" | "idea" | "blocked";

export interface RoadmapItem {
  title: string;
  /** Why it matters, or what's undecided. Kept short. */
  note?: string;
  status: SeedStatus;
}

export interface RoadmapArea {
  name: string;
  blurb?: string;
  items: RoadmapItem[];
}

export const areas: RoadmapArea[] = [
  {
    name: "foundation",
    blurb:
      "The structural work everything else depends on. Both of these are done and sitting in open PRs.",
    items: [
      {
        title: "Real URLs for each section",
        note: "Tabs were useState + hidden divs, so nothing was linkable and the back button did nothing. Shell moved into a layout so the handprint wall keeps its state across navigation.",
        status: "done",
      },
      {
        title: "MDX content system with validated frontmatter",
        note: "content/**/*.mdx replaces the hand-written data arrays. A bad file fails the build naming the file and the field.",
        status: "done",
      },
      {
        title: "Article reader at /articles/[slug]",
        note: "Build-time Shiki highlighting, its own quiet layout so articles don't sit under the wall.",
        status: "done",
      },
      {
        title: "Drafts",
        note: "draft: true renders under next dev, absent from production. Write in-repo without a branch.",
        status: "done",
      },
    ],
  },
  {
    name: "publishing",
    items: [
      {
        title: "Project pages at /projects/[slug]",
        note: "Hero from frontmatter (thumbnail, links, tags) plus an optional MDX body, so every project gets a page and the ones worth writing up get more.",
        status: "next",
      },
      {
        title: "Article list redesign",
        note: "Per the plan: shrink or drop the 80px thumbnails, lead with the date, remove text-justify, add the ↗ glyph for Medium-hosted pieces.",
        status: "next",
      },
      {
        title: "Notes / TIL",
        note: "Short-form, lower bar than an article. Worth it only if the writing habit actually forms.",
        status: "idea",
      },
      { title: "/now and /uses", status: "idea" },
    ],
  },
  {
    name: "reading experience",
    blurb: "What makes a long technical piece pleasant to actually read.",
    items: [
      {
        title: "Interactive MDX components",
        note: "The strongest answer to 'the site doesn't show my technical side'. A live demo inside a post is something a Medium article structurally cannot do.",
        status: "later",
      },
      { title: "Table of contents", status: "later" },
      { title: "Reading time", status: "later" },
      { title: "Prev / next and related-by-tag", status: "later" },
      { title: "Copy-code button", status: "later" },
      { title: "Footnotes, series / multi-part", status: "idea" },
      { title: "Image captions and click-to-zoom", status: "idea" },
    ],
  },
  {
    name: "discovery",
    items: [
      {
        title: "/tags/[tag] across sections",
        note: "Tag pills already carry cursor-pointer and hover states, so the affordance is built and promises something that doesn't happen. Small fix, turns tags into the navigation spine.",
        status: "next",
      },
      {
        title: "Cmd+K command palette",
        note: "The keybind already exists and merely focuses an input. Overlay, results grouped by section, links to routes, plus commands (copy email, go to github). Replaces the current inline search entirely.",
        status: "next",
      },
      {
        title: "RSS / JSON feed",
        note: "The thing that makes a mailing list optional for a chunk of readers.",
        status: "next",
      },
      { title: "sitemap.xml + robots", status: "next" },
      {
        title: "Per-page OG images",
        note: "The OG renderer already exists for the wall — extend it to articles and projects.",
        status: "later",
      },
      { title: "Archive by year", status: "idea" },
    ],
  },
  {
    name: "audience",
    items: [
      {
        title: "Mailing list — provider decision",
        note: "Self-hosted (Mongo + Resend, matches the existing Turnstile/Mongo patterns, you own the list) vs hosted (Buttondown/Kit, less code, they handle compliance and deliverability). Everything below waits on this.",
        status: "blocked",
      },
      {
        title: "Subscribe form + double opt-in",
        note: "Capture is provider-agnostic and can be built either way; only sending is coupled to the choice.",
        status: "blocked",
      },
      { title: "Unsubscribe + preferences", status: "blocked" },
      { title: "Past issues as a browsable section", status: "idea" },
    ],
  },
  {
    name: "depth",
    blurb:
      "The part that answers 'this doesn't represent the extent of my technical side'. Still undecided — see the open questions.",
    items: [
      {
        title: "CTF writeups as a real table",
        note: "The strongest idea in the plan. Writeups are genuinely tabular (event, category, points, date) and a sharp mono table is on-style while looking nothing like the rest of the site. That variety is what makes it read as a place rather than a template.",
        status: "idea",
      },
      { title: "Open-source contributions", status: "idea" },
      { title: "Gallery — masonry, no borders, captions on hover", status: "idea" },
      { title: "Games — large tiles, embed where possible", status: "idea" },
      { title: "CV / resume page", status: "idea" },
      { title: "Timeline", status: "idea" },
    ],
  },
  {
    name: "polish",
    items: [
      {
        title: "Dark mode toggle",
        note: "darkMode: \"class\" is already configured with nothing to toggle it. Also decides the Shiki theme pairing, which is currently light-only.",
        status: "later",
      },
      { title: "A real 404", status: "later" },
      { title: "Accessibility pass", status: "later" },
      { title: "Analytics", status: "idea" },
    ],
  },
  {
    name: "authoring workflow",
    items: [
      { title: "Preview links for unpublished drafts", status: "idea" },
      { title: "Scheduled publishing", status: "idea" },
      { title: "Image pipeline for article assets", status: "idea" },
    ],
  },
  {
    name: "known issues",
    blurb:
      "Found while reading, not part of any feature. Carried over from the plan's incidental findings.",
    items: [
      {
        title: "Dead onClick wrapping the showcase",
        note: "app/page.jsx had onClick={cycleFrame} around the whole showcase area with a one-entry frames array — clicking anywhere in projects/articles ran a no-op. Removed when the page was split into routes.",
        status: "done",
      },
      {
        title: "Global img { max-width: unset !important }",
        note: "Narrowed for article bodies via a scoped counter-rule rather than removed — the wall still depends on it, and narrowing it properly needs a visual pass over the framed canvas.",
        status: "done",
      },
      {
        title: "/tags is an unlinked dev-only playground",
        note: "A palette playground that notFound()s in production. Fine as-is, but don't mistake it for a real route when building /tags/[tag].",
        status: "later",
      },
      {
        title: "Vestigial prefers-color-scheme gradient",
        note: "globals.css sets an effectively invisible body gradient. Delete during the dark mode work.",
        status: "later",
      },
      {
        title: "ProjectGallery.jsx vs the parked .tsx",
        note: "A .tsx version is parked on feature/projects-mobile-view along with the BottomDrawer primitive the Cmd+K palette wants on mobile. That branch needs landing or abandoning before it drifts further.",
        status: "later",
      },
    ],
  },
];

/** Things I can't decide for you. Answering these unblocks the areas above. */
export const openQuestions: string[] = [
  "What does \"the extent of my technical side\" mean concretely — CTFs, systems work, open source? This decides whether depth means a CTF table, a deep-writeup format with interactive demos, or something else entirely.",
  "Mailing list: self-hosted or hosted? Everything in `audience` is blocked on this.",
  "Does home stay tab-based, or become a compact index? The plan says tabs up to ~4 sections, index past that — and CTFs + gallery + games would put it past 4.",
  "Do the Medium posts stay on Medium forever, or does a canonical copy eventually live here?",
];
