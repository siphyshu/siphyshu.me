import type { Handprint } from "@/lib/schemas/handprint";

export interface AgedHandprint extends Handprint {
  /** 0 = looks brand new, 1 = fully weathered. */
  age: number;
}

const DAY_MS = 86_400_000;

/**
 * How long a print stays completely fresh before it starts to weather.
 * Without this, only the single most recent print renders at full colour and
 * everything else is faded to some degree — which is what made the whole wall
 * look washed out rather than layered.
 */
const FRESH_DAYS = 180;

/**
 * After the fresh window, a print loses half its remaining vividness every
 * this many days. Decay rather than a linear ramp because the wall's history
 * is lopsided: most prints cluster in a few bursts, so a linear map crushed
 * the middle of the distribution into uniform mid-grey.
 *
 * Has to stay well under the wall's overall span or the curve does nothing.
 * At 550 days the oldest dated print — 750 days behind the newest — only
 * reached age 0.51, so every dated print sat in a narrow 0.87-1.00 band and
 * the only visibly old hands were the undated ones. 300 spreads the dated
 * prints across a range you can actually see.
 */
const HALF_LIFE_DAYS = 300;

/**
 * How much older than the oldest dated print to assume an undated one is.
 * They predate the timestamp field, so "older than everything dated" is all
 * that's really known. Pinning them to a hard age of 1 put them on the far
 * side of a visible cliff; placing them just beyond the oldest dated print
 * keeps the wall one continuous gradient.
 */
const UNDATED_MARGIN_DAYS = 90;

/**
 * Weathering for a print, measured against the most recent one on the wall
 * rather than against today. Anchoring to the newest print means the wall
 * always has something vivid in it — if the site goes quiet for a year, it
 * ages gracefully instead of uniformly dimming to nothing.
 */
function weathering(elapsedDays: number): number {
  if (elapsedDays <= FRESH_DAYS) return 0;
  return 1 - 0.5 ** ((elapsedDays - FRESH_DAYS) / HALF_LIFE_DAYS);
}

/**
 * Orders handprints oldest-first and tags each with a normalized age.
 *
 * Order matters visually, not just semantically: markers are absolutely
 * positioned siblings with no z-index, so paint order is DOM order. Emitting
 * oldest-first means newer hands layer over older ones the way pigment
 * accumulates on a real wall. The API returns documents in Mongo's natural
 * order, which is close to insertion order but not guaranteed to be — sorting
 * here makes the layering actually true rather than incidentally close.
 *
 * Documents predating the timestamp field share one age just past the oldest
 * dated print, so they read as the bottom layer without being cut off from
 * the gradient. They still flatten into a single stratum — there's no data to
 * spread them across.
 */
export function withAges(handprints: Handprint[]): AgedHandprint[] {
  const times = handprints.map((h) =>
    h.timestamp ? new Date(h.timestamp).getTime() : null
  );
  const known = times.filter((t): t is number => t !== null && !Number.isNaN(t));

  const newest = known.length ? Math.max(...known) : 0;
  const oldestElapsedDays = known.length ? (newest - Math.min(...known)) / DAY_MS : 0;

  return handprints
    .map((h, i) => {
      const t = times[i];
      let age: number;
      if (known.length === 0) {
        // No timeline to measure against. Render the wall as current —
        // uniformly faded hands read as broken, not old.
        age = 0;
      } else if (t === null) {
        age = weathering(oldestElapsedDays + UNDATED_MARGIN_DAYS);
      } else {
        age = weathering((newest - t) / DAY_MS);
      }
      return { ...h, age };
    })
    .sort((a, b) => b.age - a.age);
}
