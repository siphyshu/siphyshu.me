import { createItem, getBoard } from "@/lib/backstage-store";
import { STATUSES, createItemSchema, type Status } from "@/lib/schemas/backstage";
import { error, guard, readJson, revalidateBoard } from "../respond";

/** GET /backstage/api/items[?status=idea|next|doing|done] — every item, by cue. */
export async function GET(request: Request) {
  const blocked = await guard();
  if (blocked) return blocked;

  const status = new URL(request.url).searchParams.get("status");
  if (status && !STATUSES.includes(status as Status)) {
    return error(400, `status must be one of ${STATUSES.join(", ")}.`);
  }

  const items = await getBoard();
  return Response.json(status ? items.filter((item) => item.status === status) : items);
}

/** POST /backstage/api/items — { title, status?, body? }. New items default to idea. */
export async function POST(request: Request) {
  const blocked = await guard();
  if (blocked) return blocked;

  const parsed = createItemSchema.safeParse(await readJson(request));
  if (!parsed.success) return error(400, parsed.error.issues[0]?.message ?? "Invalid item.");

  const item = await createItem(parsed.data);
  revalidateBoard();
  return Response.json(item, { status: 201 });
}
