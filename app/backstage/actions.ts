"use server";

import { revalidatePath } from "next/cache";
import { attemptUnlock, isUnlocked, lock } from "@/lib/backstage";
import {
  createItem,
  deleteItem,
  restoreItem,
  toggleDone,
  updateItem,
} from "@/lib/backstage-store";
import {
  createItemSchema,
  itemIdSchema,
  updateItemSchema,
  type ActionResult,
  type BoardItem,
  type HistoryEntry,
  type Status,
} from "@/lib/schemas/backstage";

/** The list and every cue page under it. */
function revalidateBoard() {
  revalidatePath("/backstage", "layout");
}

export interface UnlockState {
  error: string | null;
}

export async function unlockAction(
  _previous: UnlockState,
  formData: FormData
): Promise<UnlockState> {
  const submitted = formData.get("password");

  if (typeof submitted !== "string" || submitted.length === 0) {
    return { error: "Enter the password." };
  }

  const result = await attemptUnlock(submitted);

  if (result === "unconfigured") {
    return { error: "No password is set on this deployment." };
  }

  if (result === "wrong") {
    // Same message for a typo and for a guess.
    return { error: "Wrong password." };
  }

  // The cookie is set, but this render already read the old one. Without this
  // the form would sit there looking like nothing happened.
  revalidateBoard();
  return { error: null };
}

// No revalidation: the list calls this while the curtain is closing over it,
// and a re-render into the password gate would show through mid-close. The
// page reads the cookie on every request, so the next visit is locked anyway.
export async function lockAction(): Promise<void> {
  await lock();
}

// --- Edits -----------------------------------------------------------------
//
// Every Server Action is a public POST endpoint. The password gate on the page
// decides what a locked visitor is *shown*; it does nothing to stop someone
// who has an action's ID from calling it directly. So each action below checks
// the unlock cookie itself, first, before touching input or the database.

const LOCKED: ActionResult<never> = {
  ok: false,
  error: "Backstage is locked. Unlock it again.",
};

const GONE: ActionResult<never> = {
  ok: false,
  error: "That item no longer exists.",
};

function invalid(issues: { message: string }[]): ActionResult<never> {
  return { ok: false, error: issues[0]?.message ?? "That edit wasn't valid." };
}

export async function createItemAction(input: unknown): Promise<ActionResult<BoardItem>> {
  if (!(await isUnlocked())) return LOCKED;

  const parsed = createItemSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues);

  const item = await createItem({ title: parsed.data.title });
  revalidateBoard();
  return { ok: true, data: item };
}

export async function updateItemAction(input: unknown): Promise<ActionResult<HistoryEntry[]>> {
  if (!(await isUnlocked())) return LOCKED;

  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues);

  const history = await updateItem(parsed.data);
  if (!history) return GONE;

  revalidateBoard();
  return { ok: true, data: history };
}

export async function toggleDoneAction(id: unknown): Promise<ActionResult<Status>> {
  if (!(await isUnlocked())) return LOCKED;

  const parsed = itemIdSchema.safeParse(id);
  if (!parsed.success) return invalid(parsed.error.issues);

  const status = await toggleDone(parsed.data);
  if (!status) return GONE;

  revalidateBoard();
  return { ok: true, data: status };
}

export async function deleteItemAction(id: unknown): Promise<ActionResult> {
  if (!(await isUnlocked())) return LOCKED;

  const parsed = itemIdSchema.safeParse(id);
  if (!parsed.success) return invalid(parsed.error.issues);

  if (!(await deleteItem(parsed.data))) return GONE;

  revalidateBoard();
  return { ok: true, data: null };
}

export async function restoreItemAction(id: unknown): Promise<ActionResult> {
  if (!(await isUnlocked())) return LOCKED;

  const parsed = itemIdSchema.safeParse(id);
  if (!parsed.success) return invalid(parsed.error.issues);

  if (!(await restoreItem(parsed.data))) {
    return { ok: false, error: "Couldn't restore that item." };
  }

  revalidateBoard();
  return { ok: true, data: null };
}
