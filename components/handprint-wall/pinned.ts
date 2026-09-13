import type { Handprint } from "@/lib/schemas/handprint";

/**
 * Handprints that never weather.
 *
 * A pinned print holds full colour no matter how old it is, and because
 * weathering also drives paint order, it always layers on top rather than
 * being buried by later hands. For the ones that should stay vivid — people
 * who matter, or marks that aren't really visitor submissions.
 *
 * Deliberately kept in code rather than as a database flag. Pinning is rare
 * and editorial, so it belongs in version control where the reason is visible
 * in the commit — and it means nothing a visitor can submit could ever pin
 * itself. The POST schema is `.strict()`, but not having the field at all is
 * a stronger guarantee than rejecting it.
 *
 * IDs are Mongo `_id`s as strings — the same values GET returns. To find one,
 * hover the handprint on the wall, or look it up by name in the API response.
 */
export const PINNED_HANDPRINT_IDS: ReadonlySet<string> = new Set([
  // "68cce5500b6a8971cf78ed43",
]);

/** Santa the cat — a hand-inserted easter egg, not a visitor submission. */
const EASTER_EGG_COLOR = "paw";

export function isPinned(handprint: Handprint): boolean {
  return (
    PINNED_HANDPRINT_IDS.has(handprint.id) || handprint.color === EASTER_EGG_COLOR
  );
}
