"use server";

import { revalidatePath } from "next/cache";
import { attemptUnlock, lock } from "@/lib/backstage";

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
