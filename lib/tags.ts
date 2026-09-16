import { tags as registry, type Tag } from "@/data/tags";

// Client-safe — data/tags.ts is a plain object literal. Both the server-rendered
// lists and the client-side search results resolve pills through here.

/**
 * Turns tag ids from frontmatter into the objects the pills render from.
 *
 * Unknown ids are dropped rather than thrown on. They cannot normally occur:
 * lib/schemas/content validates every id against this same registry while the
 * site builds, so a miss here means a tag was deleted from data/tags.ts without
 * the content being rebuilt. Losing one pill is the right failure for that —
 * it is not worth taking a page down over.
 */
export function resolveTags(ids: readonly string[]): Tag[] {
  return ids.map((id) => registry[id]).filter(Boolean);
}
