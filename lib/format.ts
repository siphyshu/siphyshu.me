// Client-safe: no filesystem, no server-only imports. ArticleItem and the
// reader page both render dates, and one of them is a client component, so
// this cannot live in lib/content.ts.

/**
 * Formats a YYYY-MM-DD content date for display.
 *
 * Both the locale and the time zone are pinned. `toLocaleDateString` with
 * neither would resolve against the machine's settings, which differ between
 * the build server and the visitor's browser — that is a hydration mismatch
 * that only shows up for readers in some time zones, on some dates.
 *
 * The date is parsed as UTC midnight for the same reason: `new Date("2023-12-04")`
 * is already UTC per spec, but formatting it back in a negative-offset zone
 * lands on December 3rd.
 */
export function formatContentDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
