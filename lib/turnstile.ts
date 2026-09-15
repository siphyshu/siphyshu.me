// Server-only: reads TURNSTILE_SECRET_KEY, which must never reach the client.
// Enforced by convention rather than by the `server-only` package, which isn't
// a dependency here — the one import site is the route handler below it.

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * How long to wait on Cloudflare before giving up. Short on purpose: this call
 * sits directly in the path of a POST the visitor is waiting on, and a hung
 * request would hold a serverless invocation open for its whole duration.
 */
const VERIFY_TIMEOUT_MS = 5000;

/**
 * The action the widget stamps into its tokens, checked again on the way back.
 *
 * A token is bound to a site key, not to a form, so without this a token minted
 * by any other widget on the same key would spend perfectly well here. There is
 * only one widget today, which is exactly why this is worth setting now — it
 * costs one comparison and it stops the second widget, whenever it arrives,
 * from silently becoming a way in.
 *
 * Must match the `action` passed in components/handprint-wall/useTurnstile.ts.
 */
const EXPECTED_ACTION = "handprint";

export type TurnstileResult =
  | { ok: true }
  /** The token is absent, malformed, replayed, or not ours. The visitor's fault
   *  or a bot's — either way, retrying unchanged won't help. */
  | { ok: false; kind: "rejected"; codes: string[] }
  /** Cloudflare didn't answer. Nothing is known about the token, good or bad. */
  | { ok: false; kind: "unavailable" };

/**
 * Whether a secret is configured at all.
 *
 * Kept separate from verification so the route can be explicit about the
 * unconfigured case rather than having it fall out of a truthiness check
 * somewhere in the middle of the happy path.
 */
export function turnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

/**
 * Checks a Turnstile token with Cloudflare.
 *
 * Two deliberate asymmetries in how failure is handled, both of which the
 * caller has to honour:
 *
 *   - **Unconfigured is open.** With no TURNSTILE_SECRET_KEY set this returns
 *     ok without calling anything, so a clone of the repo and a local dev
 *     server work with no Cloudflare account. The cost is that forgetting to
 *     set the secret in production silently disables the check — which is why
 *     turnstileConfigured() exists and why the route logs once when it's off.
 *
 *   - **Unreachable is closed.** If Cloudflare times out, the token's validity
 *     is unknown, and treating unknown as valid is exactly the window an
 *     attacker would aim for. The trade is that a Cloudflare outage stops the
 *     wall accepting prints; that's recoverable by waiting, whereas a wall full
 *     of spam is manual cleanup. The route distinguishes this case with a 503
 *     so the visitor is told to retry rather than told they failed a check.
 *
 * `remoteip` is optional and passed because it lets Cloudflare correlate the
 * solve with the address that requested the challenge. It discloses the
 * visitor's IP to Cloudflare, which is not new information to them — the
 * browser fetched the widget from challenges.cloudflare.com to get this token
 * in the first place — and it is not stored here or anywhere else.
 */
export async function verifyTurnstile(
  token: string | undefined,
  remoteip: string | null
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true };

  if (typeof token !== "string" || token.length === 0) {
    return { ok: false, kind: "rejected", codes: ["missing-input-response"] };
  }

  const form = new URLSearchParams({ secret, response: token });
  if (remoteip) form.set("remoteip", remoteip);

  let response: Response;
  try {
    response = await fetch(VERIFY_URL, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
      // This is an outbound check whose answer is single-use by definition —
      // tokens are consumed on first verify. Caching it would be wrong.
      cache: "no-store",
    });
  } catch (error) {
    console.error("Turnstile siteverify unreachable:", error);
    return { ok: false, kind: "unavailable" };
  }

  if (!response.ok) {
    console.error("Turnstile siteverify returned", response.status);
    return { ok: false, kind: "unavailable" };
  }

  let payload: { success?: boolean; action?: string; "error-codes"?: string[] };
  try {
    payload = await response.json();
  } catch {
    return { ok: false, kind: "unavailable" };
  }

  if (payload.success === true) {
    if (payload.action !== EXPECTED_ACTION) {
      // A genuine solve, but for something other than this form.
      return { ok: false, kind: "rejected", codes: ["unexpected-action"] };
    }
    return { ok: true };
  }

  const codes = payload["error-codes"] ?? [];
  // A bad secret is a deployment mistake, not a visitor failing a challenge,
  // and it would otherwise present as every single submission being spam.
  if (codes.includes("invalid-input-secret")) {
    console.error("Turnstile secret is invalid — every submission will fail.");
  }
  return { ok: false, kind: "rejected", codes };
}

/**
 * Best guess at the caller's address.
 *
 * x-forwarded-for is a list when proxies chain; the leftmost entry is the
 * original client. It is trivially spoofable in general, which is why it is
 * only ever passed to Cloudflare as a correlation hint and never used to make
 * an allow/deny decision here.
 */
export function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim() || null;
  return request.headers.get("x-real-ip");
}
