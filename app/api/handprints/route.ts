import { NextResponse } from "next/server";
import { revalidateTag, unstable_cache } from "next/cache";
import clientPromise from "@/lib/mongodb";
import { handprintInputSchema, type Handprint } from "@/lib/schemas/handprint";

const DB_NAME = "handprintdb";
const COLLECTION = "handprints";

const getHandprints = unstable_cache(
  async (): Promise<Handprint[]> => {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const documents = await db.collection(COLLECTION).find({}).toArray();
    return documents.map(({ _id, ...rest }) => rest as Handprint);
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

  const parsed = handprintInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid handprint", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const handprint: Handprint = {
      ...parsed.data,
      timestamp: new Date().toISOString(),
    };
    const result = await db.collection(COLLECTION).insertOne(handprint);

    // Bust the cache for everyone, not just this submitter.
    revalidateTag("handprints");

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to add handprint:", error);
    return NextResponse.json(
      { error: "Failed to add handprint" },
      { status: 500 }
    );
  }
}
