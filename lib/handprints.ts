import { unstable_cache } from "next/cache";
import clientPromise from "@/lib/mongodb";
import type { Handprint } from "@/lib/schemas/handprint";

/** Revalidated by the API's POST, so a new print reaches everyone at once. */
export const HANDPRINTS_TAG = "handprints";

/**
 * Direct read, used by server routes that render the wall without going
 * through the API — the OG image and its dev preview. Same shape the API
 * returns, including `id` derived from Mongo's `_id`.
 */
export async function readHandprints(): Promise<Handprint[]> {
  const client = await clientPromise;
  const docs = await client.db("handprintdb").collection("handprints").find({}).toArray();
  // Expose _id as a plain string `id` rather than dropping it — the client
  // needs a stable identity per print for React keys and optimistic rollback.
  return docs.map(({ _id, ...rest }) => ({ ...rest, id: _id.toString() }) as Handprint);
}

/**
 * The cached read behind both the API's GET and the site layout.
 *
 * The layout is the one that matters for speed: because this is tagged data
 * rather than a request-time read, the layout stays prerendered, and the wall
 * ships inside the static HTML from the edge. The alternative — fetching
 * /api/handprints after hydration — waited on the JS bundle first and then on
 * a function in iad1 that, cold, took over two seconds to answer from Mumbai.
 */
export const getHandprints = unstable_cache(readHandprints, [HANDPRINTS_TAG], {
  revalidate: 60,
  tags: [HANDPRINTS_TAG],
});
