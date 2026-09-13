import type { Handprint } from "@/lib/schemas/handprint";

export interface AgedHandprint extends Handprint {
  /** 0 = newest print on the wall, 1 = oldest. */
  age: number;
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
 * The 16 documents that predate the timestamp field are treated as the oldest,
 * which is correct (they are), but flattens them into a single bottom layer
 * rather than a gradient — there's no data to spread them across.
 */
export function withAges(handprints: Handprint[]): AgedHandprint[] {
  const times = handprints.map((h) =>
    h.timestamp ? new Date(h.timestamp).getTime() : null
  );
  const known = times.filter((t): t is number => t !== null && !Number.isNaN(t));

  const newest = known.length ? Math.max(...known) : 0;
  const oldest = known.length ? Math.min(...known) : 0;
  const span = newest - oldest;

  return handprints
    .map((h, i) => {
      const t = times[i];
      let age: number;
      if (known.length === 0) {
        // No timeline to interpolate against. Render the wall as current —
        // uniformly faded hands read as broken, not old.
        age = 0;
      } else if (t === null) {
        age = 1;
      } else if (span === 0) {
        age = 0;
      } else {
        age = 1 - (t - oldest) / span;
      }
      return { ...h, age };
    })
    .sort((a, b) => b.age - a.age);
}
