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
  type Status,
} from "@/lib/schemas/backstage";

export interface UnlockState {
  error: string | null;
}

export async function unlockAction(
  _previous: UnlockState,
  formData: FormData
): Promise<UnlockState> {
  const submitted = formData.get("password");

  if (typeof submitted !== "string" || submitted.length === 0) {
    return { error: "Say the word." };
  }

  const result = await attemptUnlock(submitted);

  if (result === "unconfigured") {
    return { error: "No password is set on this deployment." };
  }

  if (result === "wrong") {
    // Deliberately says nothing about how wrong. Same message for a typo and
    // for a guess.
    return { error: "That's not it." };
  }

  // The cookie is set, but this render already read the old one. Without this
  // the form would sit there looking like nothing happened.
  revalidatePath("/backstage");
  return { error: null };
}

export async function lockAction(): Promise<void> {
  await lock();
  revalidatePath("/backstage");
}

// --- Board edits -----------------------------------------------------------
//
// Every Server Action is a public POST endpoint. The password gate on the page
// decides what a locked visitor is *shown*; it does nothing to stop someone
// who has an action's ID from calling it directly. So each action below checks
// the unlock cookie itself, first, before touching input or the database.
//
// Results come back as values rather than thrown errors. The board applies
// every edit optimistically, and a returned error is something it can show
// beside the edit that failed, where a thrown one is a generic crash.

const LOCKED: ActionResult<never> = {
  ok: false,
  error: "The book's closed. Unlock backstage again.",
};

const GONE: ActionResult<never> = {
  ok: false,
  error: "That item isn't on the board any more.",
};

function invalid(issues: { message: string }[]): ActionResult<never> {
  return { ok: false, error: issues[0]?.message ?? "That edit wasn't valid." };
}

export async function createItemAction(
  input: unknown
): Promise<ActionResult<BoardItem>> {
  if (!(await isUnlocked())) return LOCKED;

  const parsed = createItemSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues);

  const item = await createItem(parsed.data.section, parsed.data.title);
  if (!item) return { ok: false, error: "That section doesn't exist." };

  revalidatePath("/backstage");
  return { ok: true, data: item };
}

export async function updateItemAction(input: unknown): Promise<ActionResult> {
  if (!(await isUnlocked())) return LOCKED;

  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues);

  if (!(await updateItem(parsed.data))) return GONE;

  revalidatePath("/backstage");
  return { ok: true, data: null };
}

export async function toggleDoneAction(
  id: unknown
): Promise<ActionResult<Status>> {
  if (!(await isUnlocked())) return LOCKED;

  const parsed = itemIdSchema.safeParse(id);
  if (!parsed.success) return invalid(parsed.error.issues);

  const status = await toggleDone(parsed.data);
  if (!status) return GONE;

  revalidatePath("/backstage");
  return { ok: true, data: status };
}

export async function deleteItemAction(id: unknown): Promise<ActionResult> {
  if (!(await isUnlocked())) return LOCKED;

  const parsed = itemIdSchema.safeParse(id);
  if (!parsed.success) return invalid(parsed.error.issues);

  if (!(await deleteItem(parsed.data))) return GONE;

  revalidatePath("/backstage");
  return { ok: true, data: null };
}

export async function restoreItemAction(id: unknown): Promise<ActionResult> {
  if (!(await isUnlocked())) return LOCKED;

  const parsed = itemIdSchema.safeParse(id);
  if (!parsed.success) return invalid(parsed.error.issues);

  if (!(await restoreItem(parsed.data))) {
    return { ok: false, error: "Couldn't bring that back." };
  }

  revalidatePath("/backstage");
  return { ok: true, data: null };
}
