# handprint wall — roadmap

Status: **item 1 done, items 2-8 open**. Written 2026-09-14, updated 2026-09-15.

Features and fixes for the handprint canvas, decided in discussion. Each item
records the decision *and* the reasoning, so picking one up later doesn't mean
re-deriving the design. Ordered roughly by the sequence we settled on.

Related: [redesign-plan.md](./redesign-plan.md) — the dedicated wall page in
item 8 belongs to that plan's route architecture.

---

## Decisions already locked

Things not to relitigate when starting an item:

- **The stat/counter lives in page-level chrome, not on the artwork.** Every
  on-canvas and on-frame treatment we prototyped (placard, mount strip, frame
  plate, burnt inscription, hanging tag, `(i)` marker) was rejected. The current
  bottom-left box stays until chrome exists. See item 8 — layer navigation is
  what gives that chrome a job.
- **Arrows/carousel are not built speculatively.** They arrive with layers,
  navigating time. Nav for a single item looks broken.
- **A date in the hover label was considered and rejected.**
- **Handprint mirroring was prototyped on the live wall and rejected** — half
  the prints flipped with `scaleX(-1)` read as unsettling rather than varied.
  No schema change is pending for it.
- **The mobile sheet does not track the keyboard.** Several attempts to lift it
  with visualViewport all mispositioned it on iOS, in three different ways. The
  sheet stays anchored, the keyboard covers its lower part, and the form scrolls
  inside its own box. A knowing compromise — see 68b737e for what was tried.

---

## 1. Touch: labels are unreachable — DONE (87bc82f)

**Problem.** Labels are `onMouseEnter`-only. Tapping a marker calls
`stopPropagation` and opens its link, so a print *without* a link is inert and
its name can't be read at all. The core interaction of a guestbook is
unavailable to touch visitors.

**Key detail:** key off hover capability, **not width** —
`@media (hover: hover) and (pointer: fine)` / `matchMedia`. A touchscreen laptop
reports both; an iPad reports neither. `MOBILE_BREAKPOINT` (640) stays for form
*positioning*, which genuinely is a layout question. Don't conflate the two.

**Interaction:**

- tap a hand → label appears and stays
- the link becomes a tappable element *inside* the label, not the hand itself —
  separates "who is this" from "go there"
- tap elsewhere → dismiss

**Conflict to handle:** tapping empty canvas places a print. With a label open,
that tap must dismiss *and be consumed*, or reading a name then tapping away
opens the placement form every time.

Also on no-hover devices: drop the custom cursor (`showCursor` is meaningless
without a pointer) and skip the `handleCanvasHover` mousemove work.

---

## Done, but never on this list

The form was rewritten across a565ca5, 002db2c, 1276ccb and b1e5d18. It came out
of item 1 and grew well past it:

- **Desktop form moved inside the frame.** It was a popover pinned to wherever
  you clicked, so it landed somewhere different every time and routinely covered
  the print it had just created. Now a panel anchored to one side of the canvas,
  flipping to sit opposite the fresh print.
- **Both surfaces share one visual language** — serif, lowercase, hairline
  black, square corners, dashed underlines — and one set of rules, via
  `useHandprintForm`, `useLinkErrorFeedback` and `usePreviewTilt`.
- **The panel scales with the canvas** using container queries, not viewport
  units, so it tracks the artwork rather than the window.
- A rejected link now recoils and hands the value back selected instead of
  spending a line on a message.

---

## 2. Dynamic OG image

`app/opengraph-image.tsx` with `ImageResponse`. The share card renders the live
wall.

**Two constraints:**

- **Satori renders a CSS subset.** Expect `filter: saturate()/sepia()` not to
  render — plan on opacity-only weathering, but test rather than assume. Same
  for the frame's `border-image`; may need a plain border or a pre-baked
  background image.
- **Platforms cache OG images hard.** Slack/Discord/X will hold a stale copy for
  a long time, so "updates as people sign" is laggier in practice than in
  theory. A count-derived cache-buster on the `og:image` URL fixes it for *new*
  shares, which is the case that matters.

**Side effect:** OG is 1200×630 and the wall is 3.5:1, so it letterboxes — frame
on top, title and count below. That's the chrome layout arrived at from another
direction. Worth noting when item 8 gets to designing it for real.

---

## 3. Rate limiting

**Framing correction:** the POST *cannot* be made non-public — anonymous
visitors have to reach it, that's the feature. Origin/Referer checks are
spoofable in one curl flag. The goal is making abuse expensive, not access
control.

**Cloudflare Turnstile** — works regardless of whether DNS is on Cloudflare.
Widget in the form → token → POST carries it → server verifies against
siteverify → reject on failure. Single-use, short-lived tokens kill replay.
Usually invisible, which matters for a guestbook where friction defeats the
purpose.

**Plus a cap**, because Turnstile doesn't stop a human clicking thirty times. IP
is an imperfect key (CGNAT, mobile carriers) but there's no better anonymous
identifier that isn't equally forgeable, and at a generous cap (~3/hour) the
collision cost is near zero. A `countDocuments` over the last hour is enough —
no Redis, no new infra.

**Check first:** if hosted on Vercel, its firewall does per-path rate limiting
with no code at all.

---

## 4. Edit/delete your own mark  +  5. "Yours" indicator

One mechanism, two features — do them together.

**Token design.** On POST the server generates a secret, stores
**`sha256(secret)`** on the document, returns the plaintext once. Client keeps
it in `localStorage` (an array — people leave more than one). `PATCH`/`DELETE`
require presenting the secret; server hashes and compares.

**Do not skip the hashing.** Stored in the clear, one careless `GET` projection
hands everyone the ability to delete anything on the wall.

**Accepted trade-off:** clear your browser, lose control of your mark forever.
The alternative is collecting an email — storing PII for a guestbook, not worth
it. Say so in the UI copy. (Item 8's search-by-name is the real cross-device
"find my mark".)

**The indicator (5).** The same `localStorage` array tells you which prints are
yours, so this is free. **Don't reuse the pinned treatment** (scale +
saturation) — that's a property of the *print*, whereas "yours" is a property of
*your view*. Put it outside the hand: a thin ring or soft halo on the wall
behind it, reading as annotation rather than status. Private by construction,
since nobody else's browser holds your token.

---

## 6. Permalink to a print

**Don't build "copy someone else's link" UI.** Permalinks are for sharing your
own mark.

- **Surface it on submit** — the success toast becomes "your mark is on the wall
  · copy link". That's the moment people want it; nobody hovers a stranger's
  hand thinking they should share it.
- Secondarily, once item 4 exists, your own prints' labels carry a copy action
  next to the edit affordance. Hover labels are a bad home for actions in
  general (moving toward them can dismiss them), but item 1 gives your own
  prints a persistent tapped panel on touch, so it lands naturally there.

**Receiving end:** `?hand=<id>` holds that print at full opacity, dims the rest
slightly, shows its label, clears on first interaction.

---

## 7. Server-render the wall

**Buys:** no empty-frame flash; 86 names in the HTML (screen-reader fallback for
free, and indexable); one fewer round trip; same data path the OG image wants.

**Costs — design for these, don't wave them off:**

- **Availability coupling.** Today Mongo being down means the page loads and
  only the wall fails. Server-rendered, Mongo is in the critical path for the
  whole homepage. Needs a cached read and a graceful empty state.
- **Two invalidation surfaces.** `revalidateTag("handprints")` currently busts
  the API; the page needs revalidating too, and after a POST the submitter needs
  `router.refresh()` to reconcile the optimistic print against server truth.
- **`useHandprints` changes shape** — "seed from props, mutate optimistically,
  refresh on demand" instead of "fetch on mount". The optimistic-insert logic
  gets subtler.

Pairs naturally with item 2; they want the same data path.

---

## 8. Layers + a dedicated wall page

The biggest item by a wide margin, and the one that resolves several others.

**The concept.** When the live wall fills, it closes and becomes a **layer** —
read-only, no new prints. A fresh canvas opens. A dedicated page holds writing
about what it means to leave a mark in the digital age (the history, the
30,000-years thread) plus every layer, browsable.

**Trigger: density, not time.** Monthly boundaries give twelve sparse layers in
a quiet year and correspond to nothing. Closing when the wall is genuinely
*full* is the honest metaphor and guarantees every layer is worth looking at.
Target ~120–150 prints (86 currently reads well; tune from there), with maybe a
12-month backstop so a slow year still gets a boundary.

**Reset the age anchor per layer.** This is the real fix for "the whole canvas
looks faded", and it's cleaner than any curve tuning. Today everything anchors
to the single globally-newest print, which is why 82 of 86 sit in a narrow band.
Per-layer anchoring gives every closed layer a full internal gradient from its
own oldest to its own newest. Small change to `age.ts`.

**Don't dim closed layers as a whole.** A layer washed to 60% is just a worse
layer. Let the chrome say "Layer I · closed March 2026" and keep the pixels at
full internal range. **Age as caption, not as opacity.**

**Home keeps the live layer**; the dedicated page has the essay and all layers,
and the home wall links through. Don't render the interactive wall twice.

**Scrolling layers on that page *is* the carousel** — arrows navigating time,
which is the meaningful job decorative arrows lacked. This resolves the chrome
question as a byproduct rather than as its own project.

**Search by name** beats permalinks as "find my mark": works across devices and
survives a cleared browser, which item 4 doesn't.

**No prep work needed now.** When layer 1 closes, stamp existing docs with
`layer: 1` in a single migration. Nothing to add today, no decision to lock in
early.

---

## Undecided

- **The 30,000-years line.** Currently the best copy on the site, shown for
  three seconds once. Natural home is the essay in item 8, or an `(i)`
  affordance if one ever ships. Parked.

---

## Carried over, not part of this roadmap

- `README.md` rewrite — done, deliberately uncommitted.
- 7 handprints with broken links, 4 off-canvas bot rows — user to decide.
  (Duplicates from the double-submit bug were deleted; backup in
  `deleted-handprints-backup.json`, gitignored.)
- `img { max-width: unset !important }` in `globals.css` — needs a visual pass
  before narrowing.
- Hover labels are fully opaque: `bg-opacity-2` is not on Tailwind's opacity
  scale and is a silent no-op. Same bug on the counter box and the toasts.
- `master` branch deletion — now provably safe.
