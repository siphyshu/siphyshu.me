import { NextResponse } from "next/server";
import { revalidateTag, unstable_cache } from "next/cache";
import clientPromise from "@/lib/mongodb";
import { handprintInputSchema, type Handprint } from "@/lib/schemas/handprint";
import { clientIp, turnstileConfigured, verifyTurnstile } from "@/lib/turnstile";

const DB_NAME = "handprintdb";
const COLLECTION = "handprints";

/**
 * A circuit breaker on the wall as a whole, not a per-visitor rate limit.
 *
 * Per-IP limiting already happens in front of this, in the Vercel firewall,
 * where it costs nothing and never touches the database. Duplicating it here
 * would mean storing addresses — the one piece of personal data this app has
 * so far managed not to collect — to defend against a case the edge already
 * covers.
 *
 * What the firewall cannot do is notice that the wall is filling up. This can.
 * The whole collection is under a hundred prints accumulated over about two
 * years, so thirty in one hour is far outside anything organic and far above
 * anything a genuine burst of visitors would produce. It is a backstop for the
 * case where something has gone wrong — a loop, a script, a bug of mine —
 * rather than a limit anyone should ever meet.
 *
 * It is deliberately collective: one attacker can spend the hour's budget and
 * lock everyone else out. That is an acceptable failure for a personal site,
 * where a wall that stops accepting prints for an hour is a far smaller
 * problem than a wall that has to be cleaned out by hand.
 */
const WALL_BURST_LIMIT = 30;
const WALL_BURST_WINDOW_MS = 60 * 60 * 1000;

let missingSecretLogged = false;

const getHandprints = unstable_cache(
  async (): Promise<Handprint[]> => {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const documents = await db.collection(COLLECTION).find({}).toArray();
    // Expose _id as a plain string `id` rather than dropping it — the client
    // needs a stable identity per print for React keys and optimistic rollback.
    return documents.map(
      ({ _id, ...rest }) => ({ ...rest, id: _id.toString() }) as Handprint
    );
  },
  ["handprints"],
  { revalidate: 60, tags: ["handprints"] }
);

export async function GET() {
  try {
    const result = await getHandprints();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch handprints:", error);
    return NextResponse.json(
      { error: "Failed to fetch handprints" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Split the anti-spam token off before validation. handprintInputSchema is
  // .strict(), so an extra key would be rejected outright — and it should stay
  // strict: the token is a credential for this request, not a field of the
  // handprint, and it must never reach the insert.
  let turnstileToken: string | undefined;
  if (body && typeof body === "object" && "turnstileToken" in body) {
    const { turnstileToken: token, ...rest } = body as Record<string, unknown>;
    turnstileToken = typeof token === "string" ? token : undefined;
    body = rest;
  }

  const parsed = handprintInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid handprint", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // After validation, so a malformed body is still a 400 rather than spending a
  // round trip to Cloudflare to tell a bot which check it failed first.
  if (!turnstileConfigured()) {
    if (!missingSecretLogged) {
      missingSecretLogged = true;
      console.warn(
        "TURNSTILE_SECRET_KEY is not set — handprint submissions are unverified."
      );
    }
  } else {
    const verdict = await verifyTurnstile(turnstileToken, clientIp(request));
    if (!verdict.ok) {
      if (verdict.kind === "unavailable") {
        // Nothing is known about the token. See lib/turnstile — unknown is
        // treated as a failure, but as a transient one, so the visitor is told
        // to try again rather than told they look like a bot.
        return NextResponse.json(
          { error: "Could not verify right now. Please try again." },
          { status: 503 }
        );
      }
      console.warn("Turnstile rejected a submission:", verdict.codes);
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 403 }
      );
    }
  }

  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // Timestamps are stored as ISO-8601 UTC strings of fixed width, so a
    // lexicographic $gte is chronological. Comparing strings rather than
    // converting the field keeps this a plain indexable predicate. The
    // sixteen documents predating the timestamp field simply don't match,
    // which is correct — they are years old.
    const since = new Date(Date.now() - WALL_BURST_WINDOW_MS).toISOString();
    const recent = await db
      .collection(COLLECTION)
      .countDocuments({ timestamp: { $gte: since } });

    if (recent >= WALL_BURST_LIMIT) {
      console.warn(`Wall burst limit hit: ${recent} prints in the last hour.`);
      return NextResponse.json(
        { error: "The wall is busy right now. Please try again later." },
        { status: 429 }
      );
    }

    // No `id` here: Mongo assigns _id on insert, and GET derives `id` from it.
    const handprint: Omit<Handprint, "id"> = {
      ...parsed.data,
      timestamp: new Date().toISOString(),
    };
    const result = await db.collection(COLLECTION).insertOne(handprint);

    // Bust the cache for everyone immediately, not just the submitter.
    // profile "max" (Next 16's default recommendation) is stale-while-revalidate,
    // NOT immediate — it wouldn't show the new handprint until the next background
    // revisit. { expire: 0 } is Next's documented pattern for exactly this case:
    // an external request (this POST) needing tagged data to expire right away.
    revalidateTag("handprints", { expire: 0 });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to add handprint:", error);
    return NextResponse.json(
      { error: "Failed to add handprint" },
      { status: 500 }
    );
  }
}
