import { z } from "zod";

// One validator, shared by the form and the API. These used to be two
// different rules with a string mutation in between: the form checked an HTML
// `pattern` attribute, the client prepended "https://" to anything not already
// starting with "http", and the API then ran z.url() over the result. Each
// step was individually reasonable and the combination let junk through.
//
// Two things that actually reached the database under the old rules:
//   "https://:)"                   — a smiley, prepended into a "URL"
//   "https://javascript:alert(1)"  — a scheme masked by the prepend
//
// The second is the important one. Bare z.url() accepts javascript:, data:,
// vbscript: and file: URLs, so a direct POST (bypassing the form entirely)
// could store a link that HandprintMarker later hands to window.open.

const MAX_LINK_LENGTH = 200;

// Matches a URL scheme at the start of the string, per RFC 3986.
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

// A last label that's either a normal TLD or a punycode IDN one. Requiring
// alphabetic characters here is also what rejects bare IPs and "localhost",
// neither of which is useful to another visitor clicking a handprint.
const VALID_TLD = /^([a-z]{2,63}|xn--[a-z0-9-]+)$/i;

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Adds a default scheme only when the string has none. Critically it does not
 * prepend in front of an existing scheme — doing that is what turned
 * "javascript:alert(1)" into a string that looked like an https URL.
 */
export function addDefaultScheme(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return HAS_SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export type LinkResult =
  | { ok: true; value: string }
  | { ok: false; reason: string };

/**
 * Validates a user-supplied link. Returns the normalized value on success and
 * a human-readable reason on failure — the form shows that reason inline, and
 * the API turns it into a 400.
 */
export function validateLink(raw: string): LinkResult {
  const candidate = addDefaultScheme(raw);

  if (!candidate) return { ok: false, reason: "Link is empty" };
  if (candidate.length > MAX_LINK_LENGTH)
    return { ok: false, reason: `Link must be under ${MAX_LINK_LENGTH} characters` };
  if (/\s/.test(candidate))
    return { ok: false, reason: "Link can't contain spaces" };

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return { ok: false, reason: "That doesn't look like a valid link" };
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol))
    return { ok: false, reason: "Only http and https links are allowed" };

  const labels = url.hostname.split(".");
  if (labels.length < 2 || !VALID_TLD.test(labels[labels.length - 1]))
    return { ok: false, reason: "Needs a full domain, like example.com" };

  return { ok: true, value: candidate };
}

/** The Zod form, so the API enforces exactly what the form enforces. */
export const handprintLinkSchema = z.string().transform((raw, ctx) => {
  const result = validateLink(raw);
  if (!result.ok) {
    ctx.addIssue({ code: "custom", message: result.reason });
    return z.NEVER;
  }
  return result.value;
});
