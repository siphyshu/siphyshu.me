import clientPromise from "@/lib/mongodb";
import type { Handprint } from "@/lib/schemas/handprint";

/**
 * Direct read, used by server routes that render the wall without going
 * through the API — the OG image and its dev preview. Same shape the API
 * returns, including `id` derived from Mongo's `_id`.
 */
export async function readHandprints(): Promise<Handprint[]> {
  const client = await clientPromise;
  const docs = await client.db("handprintdb").collection("handprints").find({}).toArray();
  return docs.map(({ _id, ...rest }) => ({ ...rest, id: _id.toString() }) as Handprint);
}
