# handprint wall — roadmap

Status: **items 1 and 3 done, item 2 shipped but its design is being redone by
hand, items 4-8 open**. Written 2026-09-14, updated 2026-09-16.

**Parked here deliberately** — work moved to other parts of the site. Pick up at
item 4; it's the prerequisite for the most other things (it unblocks the
DB-backed pinning flag, and item 5 comes free with it).

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
- **Weathering stays opacity + saturation + sepia.** Erosion, chipping, warp and
  a combination were all built and compared on the real wall, then rejected.
  See "Explored and rejected" below for the findings, which are worth reading
  before anyone tries again.

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

**Handprints no longer run into the frame** (da1cdfe). `EDGE_CLIP_PX` moves the
crop boundary inward via `clip-path`, on a layer wrapping the markers alone —
not the canvas, which carries the wall texture and would leave a bare ring
inside the frame. Clipping rather than refusing placement: a no-place strip
either eats clicks or, if the position is clamped instead, pools every edge
click onto one coordinate, so three corner clicks give three hands in a
straight line. Useful side effect: `clip-path` clips hit-testing as well as
paint, so the undrawn part of a cropped hand is correctly non-interactive.

---

## 2. Dynamic OG image — SHIPPED, design pending (c8ed069, 53f5517, 2161a3a)

`app/opengraph-image.tsx` renders the live wall through `ImageResponse`. Markup
lives in `components/og/OgCard.tsx`, shared with two dev-only previews —
`/og-preview` (HTML, fast to iterate) and `/api/og-preview?v=` (real PNG,
authoritative). Both `notFound()` in production.

**The layout is a placeholder.** Three variants were built and none were
accepted; the design is being done by hand and handed over. Everything below is
the plumbing, which stands regardless of what the card ends up looking like.

**Satori's failure modes, all found the hard way:**

- **Any element with more than one child must declare `display: flex`**, or the
  render dies silently — the response stream just ends, nothing logged. A
  string next to an interpolation counts as two children.
- **Variable fonts crash it.** Gelasio killed the render with an empty reply;
  static PT Serif is vendored in `public/fonts/` for this reason.
- No CSS filters (weathering is opacity-only in the card), no `border-image`
  (the frame is a gradient), `flexGrow` ignored.
- Emoji need `emoji: "twemoji"`, which fetches from a CDN at render time — the
  only network dependency, and the first thing to suspect if the wave vanishes.

**When a render breaks, bisect against a known-good control.** Restoring the
last committed version and confirming HTTP 200 is what makes the other results
trustworthy; one bisect was wasted removing elements while leaving their
module-scope `const`s in place.

**Still open:** the count-derived cache-buster on the `og:image` URL. Platforms
hold stale copies hard, so "updates as people sign" needs it to work for new
shares. Also unverified: the route reads fonts and images from `public/` via
`fs`, which has not been checked on a real Vercel deploy.

**Side effect:** OG is 1200×630 and the wall is 3.5:1, so it letterboxes — frame
on top, title and count below. That's the chrome layout arrived at from another
direction. Worth noting when item 8 gets to designing it for real.

---

## 3. Rate limiting — DONE (f36743e)

**Framing correction:** the POST *cannot* be made non-public — anonymous
visitors have to reach it, that's the feature. Origin/Referer checks are
spoofable in one curl flag. The goal is making abuse expensive, not access
control.

**Rate limiting was the wrong tool for the abuse actually seen.** The four spam
rows deleted in 988024f managed at most **two requests in any 60-second
window** — gaps of 23s, 91 days, 109s. The Vercel firewall rule (5 req/60s per
IP → Deny) would not have blocked any of it. It's kept as burst protection for
the scripted-flood case, which it does handle, for free, without touching the
database.

**Do not add keys to the firewall rule.** The dropdown offers JA4 Digest and
User Agent alongside IP, and limits are computed over the *combination* — so
each extra key makes the bucket narrower, not the rule stricter. User Agent is
client-controlled, so a bot rotating it gets a fresh allowance per string. IP
alone.

**Cloudflare Turnstile** is what addresses the real pattern, since it's bot
detection rather than volume. Implemented in `lib/turnstile.ts` (server) and
`components/handprint-wall/useTurnstile.ts` (client):

- **`execution: "execute"` + `appearance: "interaction-only"`.** Nothing runs
  until submit and the widget reserves no space. Structural, not cosmetic: the
  desktop panel sits inside a 245px-tall frame, so a permanently visible 65px
  widget would have meant redesigning the form around an anti-spam control
  almost nobody sees. The widget is mounted once at the wall and centred on the
  viewport, so one instance serves both the sheet and the panel.
- **Token minted immediately before the write**, not when the form opens —
  tokens expire in five minutes and people pause to think about what to type.
- **Bound to `action: "handprint"`**, checked server-side. Tokens are bound to a
  site key, not to a form, so without this any future widget on the same key
  would mint tokens that spend here.
- **Unconfigured is open, unreachable is closed.** No secret set → check skipped
  entirely (a clone with no Cloudflare account still works), warning logged
  once. Cloudflare unreachable → 503, because a token of unknown validity is the
  window an attacker aims for; 503 rather than 403 so the visitor is told to
  retry, not told they look like a bot.
- Single-use *is* enforced. A replay appearing to succeed is siteverify's
  short response cache; after ~45s it correctly returns `timeout-or-duplicate`.

**Plus a cap** — `WALL_BURST_LIMIT = 30`/hour in the route, via `countDocuments`
over an indexable ISO-string `$gte`. Deliberately **global, not per-IP**: per-IP
is already handled at the edge, and doing it here would mean storing addresses,
the one piece of personal data this app has avoided collecting. What the edge
can't see is the wall filling up. It's a circuit breaker against a loop or a
bug, not a limit anyone should meet, and it's knowingly collective — one
attacker can spend the hour's budget for everyone.

**Operational, easy to get wrong:**

- `localhost` must be in the widget's hostname list or it fails with error
  `110200` and no token is ever minted.
- Set **both** `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` on
  Vercel, or neither. Secret alone 403s every submission. The public key is
  inlined at build time, so changing it needs a redeploy.

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

## Explored and rejected

### Alternative weathering (SVG filters)

A bench at `/weathering-preview` compared four treatments against the current
one on the real 82-print wall, then was deleted. Rejected — weathering stays as
it is. Kept here because the findings cost real time and none of them are
obvious:

- **These filters are element-size-relative.** `feTurbulence`'s `baseFrequency`
  and `feDisplacementMap`'s `scale` are in user units, so the same filter is a
  different effect at a different size. The first bench drew hands at 120px and
  was actively misleading: `baseFrequency 0.035` looked like a lovely warp
  there, but at the 30px the wall ships it puts a noise cell *wider than the
  hand*, so the print just slides sideways. Any future bench must render at
  30px and scale up with CSS.
- **Put the SVG filter on the inner `<img>`, never on `.handprint-marker`.** A
  filter list containing `url()` can't be interpolated, so merging it with the
  existing `saturate/sepia/blur` chain kills the hover colour-restore
  transition. Split across two elements, the colour still animates and the wear
  stays put — which reads better anyway: hover should reveal what colour a
  print *was*, not repair it.
- **Performance is a non-issue.** All five treatments measured 13.3–13.4ms
  median, p90 ~14ms across four interleaved rounds, including during the blur
  transition. First-pass numbers suggesting otherwise were cold-cache artifacts;
  the tell was the *heaviest* treatment posting the best figures. Untested on a
  low-end phone.
- **`fractalNoise` luminance clusters tightly around 0.5**, so the threshold
  band between "a few flakes" and "gone" is very narrow. A first attempt at
  chipping erased most of the hand by its second step.
- The one idea worth resurrecting if this ever reopens: **warp is the only
  treatment that breaks sprite-repetition.** The wall draws one identical glyph
  82 times, and a small *constant* per-print warp (seeded from the id, separate
  from any age-scaled component) makes the hands look individually pressed
  rather than stamped. That's a different problem from weathering and might be
  worth doing on its own.

---

## Undecided

- **The 30,000-years line.** Currently the best copy on the site, shown for
  three seconds once. Natural home is the essay in item 8, or an `(i)`
  affordance if one ever ships. Parked.

---

## Carried over, not part of this roadmap

- `README.md` rewrite — done, deliberately uncommitted.
- `next.config.js` holds a home IP in `allowedDevOrigins` — deliberately
  uncommitted for the same reason.
- 7 handprints with broken links — user to decide. The 4 off-canvas bot rows
  were deleted (988024f). Duplicates from the double-submit bug were deleted
  earlier; backup in `deleted-handprints-backup.json`, gitignored.
- `img { max-width: unset !important }` in `globals.css` — needs a visual pass
  before narrowing.
- Hover labels are fully opaque: `bg-opacity-2` is not on Tailwind's opacity
  scale and is a silent no-op. Same bug on the counter box and the toasts.
- `master` branch deletion — now provably safe.
