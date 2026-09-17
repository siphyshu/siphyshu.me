import { z } from "zod";

// Client-safe: no database, no server-only imports. The board component needs
// these types, and the server actions need the validators.

/**
 * Four states and a flag. "Held" isn't a stage of progress — a next-up item
 * can be held, so can one that's half done — so it sits on top of a status.
 */
export const STATUSES = ["idea", "next", "doing", "done"] as const;
export type Status = (typeof STATUSES)[number];
export type OpenStatus = Exclude<Status, "done">;

export const STATUS_LABELS: Record<Status, string> = {
  idea: "Idea",
  next: "Next",
  doing: "Doing",
  done: "Done",
};

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Not an item id");
const title = z.string().trim().min(1, "An item needs a title").max(200);

export const createItemSchema = z
  .object({
    title,
    status: z.enum(STATUSES).optional(),
    body: z.string().max(20000).optional(),
  })
  .strict();

export type CreateItemInput = z.infer<typeof createItemSchema>;

// Every field optional: each edit sends only what changed.
export const updateItemSchema = z
  .object({
    id: objectId,
    title: title.optional(),
    status: z.enum(STATUSES).optional(),
    held: z.boolean().optional(),
    heldReason: z.string().trim().max(300).optional(),
    body: z.string().max(20000).optional(),
  })
  .strict();

export const itemIdSchema = objectId;

export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type Patch = Omit<UpdateItemInput, "id">;

/** Markdown task lines in the notes: `- [ ]` and `- [x]`. */
export function countTasks(body: string): { done: number; total: number } {
  const tasks = body.match(/^\s*[-*+] \[[ xX]\]/gm) ?? [];
  return {
    done: tasks.filter((task) => /\[[xX]\]/.test(task)).length,
    total: tasks.length,
  };
}

/** What the list renders. Plain and serializable — it crosses to the client. */
export interface BoardItem {
  id: string;
  title: string;
  status: Status;
  /** Where un-ticking returns it to. Null unless the item is done. */
  previousStatus: OpenStatus | null;
  held: boolean;
  heldReason: string;
  /** Permanent and never reused, so "cue 14" always means the same item. */
  cue: number;
  tasks: { done: number; total: number };
}

export interface HistoryEntry {
  at: string;
  text: string;
}

export interface CueDetail extends BoardItem {
  body: string;
  history: HistoryEntry[];
}

export type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string };
