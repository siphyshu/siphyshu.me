import { revalidatePath } from "next/cache";
import { backstageConfigured, isUnlocked } from "@/lib/backstage";
import { ensureCues, idForCue } from "@/lib/backstage-store";
import { itemIdSchema } from "@/lib/schemas/backstage";

// Shared by the JSON routes under /backstage/api. Same rule as the server
// actions: every handler checks the unlock cookie before it reads anything.
// The cookie is scoped to /backstage and SameSite=Lax, so a cross-site POST
// arrives without it.

export function error(status: number, message: string): Response {
  return Response.json({ error: message }, { status });
}

/** Null when the request may go ahead; otherwise the response to send. */
export async function guard(): Promise<Response | null> {
  // A missing password looks like a missing page, as it does for the list.
  if (!backstageConfigured()) return error(404, "Not found.");
  if (!(await isUnlocked())) return error(401, "Backstage is locked.");
  await ensureCues();
  return null;
}

/** An item is addressed by its cue number, as the list shows it, or by its id. */
export async function resolveRef(ref: string): Promise<string | null> {
  if (/^\d+$/.test(ref)) return idForCue(Number(ref));
  return itemIdSchema.safeParse(ref).success ? ref : null;
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

/** The list and every cue page under it. */
export function revalidateBoard() {
  revalidatePath("/backstage", "layout");
}
