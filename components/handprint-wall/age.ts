import type { Handprint } from "@/lib/schemas/handprint";
import { isPinned } from "./pinned";

export interface AgedHandprint extends Handprint {
  /** 0 = looks brand new, 1 = fully weathered. */
  age: number;
  /** Held at full colour regardless of date. See ./pinned. */
  pinned: boolean;
}

const DAY_MS = 86_400_000;

/**
 * How long a print stays completely fresh before it starts to weather.
 * Without this, only the single most recent print renders at full colour and
 * everything else is faded to some degree — which is what made the whole wall
 * look washed out rather than layered.
 */
const FRESH_DAYS = 90;

/**
 * Where the undated prints sit: starting this far beyond the oldest dated one,
 * spread across the window below.
 *
 * They predate the timestamp field, so "older than everything dated" is all
 * that's really known. Giving them one shared age stacked sixteen prints into a
 * single flat band — a fifth of the wall at exactly one tone, which read as a
 * rendering artefact rather than as age. Spreading them across a plausible
 * window makes that band a gradient instead, without inventing a date for any
 * individual print: the order used is the collection's own, which is close to
 * insertion order, so it's the best available guess at their relative age.
 */
const UNDATED_LEAD_DAYS = 30;
const UNDATED_WINDOW_DAYS = 180;

/**
 * Elapsed days for every print, with the undated ones spread rather than
 * stacked. Measured against the most recent print rather than against today,
 * so the wall always has something vivid in it — if the site goes quiet for a
 * year it ages gracefully instead of uniformly dimming to nothing.
 */
function elapsedDays(times: (number | null)[]): number[] {
  const known = times.filter((t): t is number => t !== null);
  if (known.length === 0) return times.map(() => 0);

  const newest = Math.max(...known);
  const oldestElapsed = (newest - Math.min(...known)) / DAY_MS;
  const undatedCount = times.filter((t) => t === null).length;
  let undatedSeen = 0;

  return times.map((t) => {
    if (t !== null) return (newest - t) / DAY_MS;
    const step = undatedCount > 1 ? undatedSeen / (undatedCount - 1) : 0;
    undatedSeen += 1;
    return oldestElapsed + UNDATED_LEAD_DAYS + step * UNDATED_WINDOW_DAYS;
  });
}

/**
 * Orders handprints oldest-first and tags each with a normalized age.
 *
 * Age maps linearly across the wall's own span rather than decaying by
 * half-life. Decay was tried first and saturates: past roughly two half-lives
 * every print sits at the floor and becomes indistinguishable, so the oldest
 * third of the wall flattened into one tone — and because nothing ever reached
 * age 1, the floor wasn't reachable either and the usable opacity range was
 * 0.20 against a configured 0.26. Normalising to the span means the oldest
 * print is always at the floor and the full range is always in use, however
 * long the wall runs.
 *
 * The trade is that age is relative to this wall's history rather than to a
 * number of days: a burst of visitors shows up as a cluster of similarly-aged
 * prints, which is true — they are. Ranking prints by position was also tried
 * and spread them perfectly evenly, but made age mean "how many came after
 * you": thirty prints arriving in one day aged everything else by a sixth of
 * the range while no time had passed at all.
 *
 * Order matters visually, not just semantically: markers are absolutely
 * positioned siblings with no z-index, so paint order is DOM order. Emitting
 * oldest-first means newer hands layer over older ones the way pigment
 * accumulates on a real wall.
 */
export function withAges(handprints: Handprint[]): AgedHandprint[] {
  const times = handprints.map((h) =>
    h.timestamp ? new Date(h.timestamp).getTime() : null
  );
  const hasDates = times.some((t) => t !== null && !Number.isNaN(t));
  const elapsed = elapsedDays(times);
  const oldest = Math.max(...elapsed, 0);
  // Everything inside the fresh window, so there's no range to map across.
  const range = oldest - FRESH_DAYS;

  return handprints
    .map((h, i) => {
      const pinned = isPinned(h);
      let age: number;
      if (pinned || !hasDates || range <= 0) {
        // Pinned prints never weather. Also the no-timeline case: nothing to
        // measure against, and uniformly faded hands read as broken, not old.
        age = 0;
      } else {
        age = Math.min(1, Math.max(0, (elapsed[i] - FRESH_DAYS) / range));
      }
      return { ...h, age, pinned };
    })
    // Oldest first, so newer hands layer over older ones. Pinned prints sort
    // past everything else rather than relying on their age of 0 — that only
    // put them level with the newest prints, which could still overlap them.
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? 1 : -1;
      return b.age - a.age;
    });
}
