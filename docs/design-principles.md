# Design principles

Inferred from the homepage as it actually is, not written ahead of it. Each one
names where it shows up today, so it can be checked against the site rather
than taken on faith, and says what it asks of new work.

These replace the "design rules to hold" in `redesign-plan.md`, which were
stricter than the site itself (it has rounded corners and colour in more places
than those rules allowed).

---

## 1. Real objects, not interface

The personality lives in things that exist in the world, rendered faithfully:
a wooden frame around a linen canvas, handprints that press onto a wall, a
bordered placard reading "82 were here", a museum caption beneath it, a cat
asleep in the footer. The interface around them stays plain.

**Asks of new work:** when something needs character, find the physical object
it would be — a prompt book, a pinboard, a ledger, a table of results — and
build that. Don't decorate a generic component.

## 2. Time leaves marks

Handprints weather: after ninety days they fade, desaturate and yellow, and a
hover restores the colour they started with. Undated prints are spread across
a plausible stretch of time rather than stacked at one tone. History shows up
as texture, not as a timestamp.

**Asks of new work:** show state as wear and marking — struck through, faded,
pencilled in, pinned — before reaching for a label or a badge.

## 3. A quiet surface that rewards attention

Nothing on load asks to be looked at. The delight sits one act of curiosity
deep: hover the small drawn avatar and the name scrambles into place; bring
the cursor near the cat and it wakes and blinks; click it and it meows (once a
second, no more); type the Konami code and a curtain draws.

**Asks of new work:** no entrance animations performed at the visitor. Put the
play behind hover, proximity, sequence or discovery, and make it respond to
what the person did.

## 4. One loud thing per screen

On the homepage it's the wall. The hero is modest, the cards are plain, the
tabs are just words. Everything else is black serif on white so the one thing
can be loud.

**Asks of new work:** decide which element is the moment before designing the
rest, and keep the rest quiet. A page with two loud things has none.

## 5. A personal page, not a product

A system serif with no web font loaded. Lowercase headings and a lowercase
voice ("hey, i'm jaiyank! 👋"). Links that are literally underlined web-blue.
Emoji used like punctuation. The README tells you "the light switch is on your
left". It reads like someone's page, not a SaaS landing.

**Asks of new work:** prefer plain, native affordances — an underlined link, a
real button, a text input that looks like one — with one crafted detail rather
than a layer of design-system gloss. Copy is first person, casual in tone and
precise in content.

## 6. Borders mean "this is an object"

Project cards have a black hairline and a shadow, like something you could
pick up. The placard on the wall has a border. The canvas has a frame. Regions
and sections don't — they're separated by space.

**Asks of new work:** border a thing when it's a discrete, holdable object.
Don't box sections, lists or groups; give them room instead.

## 7. Colour is either a material or a signal

The homepage is black and white except for: the handprints and wood (colour
as material), the tag pills and thumbnails (colour as identity), and the links
(colour as the web's own signal for "clickable"). There's no decorative colour.

**Asks of new work:** every colour should be one of those — the natural colour
of a material being depicted, or a signal that means something consistent
across the page. If you can't say which, it's decoration.

---

## Inconsistencies worth deciding

Not principles — places the homepage currently contradicts itself.

- **Corner radius.** Project cards are square; article thumbnails are
  `rounded-xl`; the search bar is `rounded-md`; avatars and pills are round.
  A rule that would fit what's there: *people and handled controls are round,
  frames and cards are square.* The article thumbnails are the outlier.
- **Two border greys.** Cards use black; the search bar uses `gray-200`. Worth
  settling which one an input gets.
- **`text-justify` on card descriptions** opens whitespace rivers at narrow
  widths.
