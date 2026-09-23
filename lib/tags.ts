import { tags as registry, tagColorVariants, type Tag, type TagColor } from "@/data/tags";

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

/**
 * Just a colour's text and border, for pills that sit inside a bigger link
 * (an article row). The full variant's hover fill and pointer would promise a
 * click the pill doesn't have. The classes still appear whole in data/tags.ts,
 * so Tailwind generates them.
 */
export function tagInkClasses(color: TagColor): string {
  return tagColorVariants[color]
    .split(" ")
    .filter((c) => c.startsWith("text-") || c.startsWith("border-"))
    .join(" ");
}
