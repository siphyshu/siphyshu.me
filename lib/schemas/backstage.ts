import { z } from "zod";

// Client-safe: no database, no server-only imports. The board component needs
// these types, and the server actions need the validators.

/**
 * Four states and a flag, not six states.
 *
 * The old roadmap had idea / later / next / building / blocked / done. "Later"
 * and "idea" described the same thing from two angles, and "blocked" isn't a
 * stage of progress at all — a next-up item can be blocked, so can one that's
 * half built. It's a flag on top of a status, carrying the reason it's stuck.
 */
export const STATUSES = ["idea", "next", "doing", "done"] as const;
export type Status = (typeof STATUSES)[number];
export type OpenStatus = Exclude<Status, "done">;

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Not an item id");

const title = z.string().trim().min(1, "An item needs a title").max(200);

export const createItemSchema = z
  .object({
    section: z.string().trim().min(1).max(60),
    title,
  })
  .strict();

// Every field optional: each edit sends only what changed. An empty note is a
// legitimate value — it's how a note gets cleared — so it has no minimum.
export const updateItemSchema = z
  .object({
    id: objectId,
    title: title.optional(),
    note: z.string().trim().max(2000).optional(),
    status: z.enum(STATUSES).optional(),
    held: z.boolean().optional(),
    heldReason: z.string().trim().max(300).optional(),
  })
  .strict();

export const itemIdSchema = objectId;

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;

/** What the board renders. Plain and serializable — it crosses to the client. */
export interface BoardItem {
  id: string;
  section: string;
  title: string;
  note: string;
  status: Status;
  /** Where un-ticking returns it to. Null unless the item is done. */
  previousStatus: OpenStatus | null;
  held: boolean;
  heldReason: string;
}

export interface BoardSection {
  slug: string;
  name: string;
  blurb: string | null;
  items: BoardItem[];
}

export type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string };
