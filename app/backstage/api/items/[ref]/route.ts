import { deleteItem, getCue, updateItem } from "@/lib/backstage-store";
import { updateItemSchema } from "@/lib/schemas/backstage";
import { error, guard, readJson, resolveRef, revalidateBoard } from "../../respond";

type Context = { params: Promise<{ ref: string }> };

const GONE = "No item with that cue or id.";

/** GET /backstage/api/items/12 — one item with its notes and history. */
export async function GET(_request: Request, { params }: Context) {
  const blocked = await guard();
  if (blocked) return blocked;

  const id = await resolveRef((await params).ref);
  const item = id && (await getCue(id));
  return item ? Response.json(item) : error(404, GONE);
}

/** PATCH /backstage/api/items/12 — any of { title, status, held, heldReason, body }. */
export async function PATCH(request: Request, { params }: Context) {
  const blocked = await guard();
  if (blocked) return blocked;

  const id = await resolveRef((await params).ref);
  if (!id) return error(404, GONE);

  const body = await readJson(request);
  const parsed = updateItemSchema.safeParse({ ...(body as object), id });
  if (!parsed.success) return error(400, parsed.error.issues[0]?.message ?? "Invalid edit.");

  if (!(await updateItem(parsed.data))) return error(404, GONE);
  revalidateBoard();
  return Response.json(await getCue(id));
}

/** DELETE /backstage/api/items/12 — soft delete, restorable from the list's undo. */
export async function DELETE(_request: Request, { params }: Context) {
  const blocked = await guard();
  if (blocked) return blocked;

  const id = await resolveRef((await params).ref);
  if (!id || !(await deleteItem(id))) return error(404, GONE);
  revalidateBoard();
  return new Response(null, { status: 204 });
}
