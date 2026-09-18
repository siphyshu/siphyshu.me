import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Server-only: reads BACKSTAGE_PASSWORD, which must never reach the client.
// Same convention as lib/turnstile.ts — the `server-only` package isn't a
// dependency here, and the import sites are the page and its server action.

export const BACKSTAGE_COOKIE = "backstage";

/** Scoped to the page it unlocks, so it is not sent with every request to the site. */
const COOKIE_PATH = "/backstage";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/**
 * Constant the token is derived from. Bumping it invalidates every issued
 * cookie without needing to change the password.
 */
const TOKEN_PAYLOAD = "backstage-v1";

/**
 * Note the asymmetry with lib/turnstile.ts, which treats an unconfigured
 * secret as *open* so a fresh clone works with no Cloudflare account.
 *
 * This one fails **closed**. Turnstile guards a form against spam; getting it
 * wrong means junk on the wall. This guards content that is private by
 * request, and defaulting to open would publish it the first time the env var
 * was forgotten — which is exactly the deploy where nobody would notice.
 */
export function backstageConfigured(): boolean {
  return Boolean(process.env.BACKSTAGE_PASSWORD);
}

/**
 * The cookie value for a given password.
 *
 * An HMAC keyed by the password rather than a flag like "authed=true": httpOnly
 * stops page scripts reading a cookie, it does nothing to stop someone setting
 * one by hand in devtools. This value cannot be produced without the password,
 * so a hand-set cookie fails verification.
 *
 * Changing the password also invalidates every previously issued cookie, since
 * the key that produced them is gone.
 */
function tokenFor(password: string): string {
  return createHmac("sha256", password).update(TOKEN_PAYLOAD).digest("hex");
}

/** Compares two hex digests without leaking where they diverge. */
function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  // timingSafeEqual throws on a length mismatch, which would itself be a
  // signal; digests are fixed-width, so a difference here means a malformed
  // cookie rather than a near-miss.
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Whether the current request carries a valid unlock cookie.
 *
 * Reading cookies opts the page into dynamic rendering, which is what keeps
 * the roadmap from being prerendered into a static HTML file that would be
 * served to anyone who asked for it.
 */
export async function isUnlocked(): Promise<boolean> {
  const password = process.env.BACKSTAGE_PASSWORD;
  if (!password) return false;

  const provided = (await cookies()).get(BACKSTAGE_COOKIE)?.value;
  if (!provided) return false;

  return safeEqual(provided, tokenFor(password));
}

export type UnlockResult = "ok" | "wrong" | "unconfigured";

/**
 * Checks a submitted password and, on success, sets the unlock cookie.
 *
 * Deliberately not rate limited. The wall's POST route has a burst limit
 * because an open endpoint writing to a database is worth defending; this
 * writes nothing and the only thing behind it is a list of things I intend to
 * build. Online guessing is bounded by a multi-word passphrase and by the page
 * being noindex'd, and adding a counter here would mean either per-IP state —
 * storing addresses this site has so far avoided collecting — or a collective
 * limit that locks me out of my own page.
 */
export async function attemptUnlock(submitted: string): Promise<UnlockResult> {
  const password = process.env.BACKSTAGE_PASSWORD;
  if (!password) return "unconfigured";

  const expected = tokenFor(password);
  if (!safeEqual(tokenFor(submitted), expected)) return "wrong";

  (await cookies()).set(BACKSTAGE_COOKIE, expected, {
    httpOnly: true,
    sameSite: "lax",
    // Off on localhost, where there is no HTTPS to require.
    secure: process.env.NODE_ENV === "production",
    path: COOKIE_PATH,
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });

  return "ok";
}

export async function lock(): Promise<void> {
  (await cookies()).delete({ name: BACKSTAGE_COOKIE, path: COOKIE_PATH });
}
