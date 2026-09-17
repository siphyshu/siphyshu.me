import { ObjectId, type Collection, type Db, type UpdateFilter } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { areas, openQuestions, type SeedStatus } from "@/data/roadmap";
import {
  STATUS_LABELS,
  countTasks,
  type BoardItem,
  type CreateItemInput,
  type CueDetail,
  type HistoryEntry,
  type OpenStatus,
  type Status,
  type UpdateItemInput,
} from "@/lib/schemas/backstage";

// Server-only: talks to MongoDB. Every function here assumes its caller has
// already checked the unlock cookie — this module does no authorization of its
// own. The server actions in app/backstage/actions.ts are the only callers, and
// each one checks before it calls in.
//
// MONGODB_URI is the same value in every Vercel environment and in .env.local,
// so local edits land on the live list.

const DB_NAME = "backstage";

interface ItemDoc {
  _id: ObjectId;
  title: string;
  status: Status;
  /** What the item was before it was marked done, so un-ticking puts it back. */
  previousStatus: OpenStatus | null;
  held: boolean;
  heldReason: string;
  createdAt: string;
  updatedAt: string;
  doneAt: string | null;
  /** Soft delete, so undo is a field flip rather than a re-insert. */
  deletedAt: string | null;
  cue?: number;
  body?: string;
  /** Status changes, oldest first. */
  history?: HistoryEntry[];
  // Left over from the sectioned board. Read once, when an item is first
  // opened, and folded into what replaced them.
  section?: string | null;
  order?: number;
  note?: string;
}

interface MetaDoc {
  _id: string;
  at?: string;
  n?: number;
}

async function db(): Promise<Db> {
  return (await clientPromise).db(DB_NAME);
}

const items = (d: Db): Collection<ItemDoc> => d.collection("items");
const meta = (d: Db): Collection<MetaDoc> => d.collection("meta");

function now(): string {
  return new Date().toISOString();
}

/** The old six statuses onto the new four, with blocked becoming a flag. */
function fromSeedStatus(status: SeedStatus): { status: Status; held: boolean } {
  switch (status) {
    case "building":
      return { status: "doing", held: false };
    case "later":
      return { status: "idea", held: false };
    case "blocked":
      return { status: "next", held: true };
    default:
      return { status, held: false };
  }
}

/**
 * Seeds the list from data/roadmap.ts, once, ever. The marker insert is the
 * lock: a second concurrent first visit gets a duplicate-key error and backs
 * off, and deleting every item later leaves an empty list rather than quietly
 * restoring the original roadmap.
 */
export async function ensureSeeded(): Promise<void> {
  const d = await db();
  try {
    await meta(d).insertOne({ _id: "seeded", at: now() });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return;
    throw error;
  }

  const timestamp = now();
  const seeds = [
    ...openQuestions.map((question) => ({
      title: question,
      note: "",
      status: "next" as Status,
      held: false,
    })),
    ...areas.flatMap((area) =>
      area.items.map((item) => ({
        title: item.title,
        note: item.note ?? "",
        ...fromSeedStatus(item.status),
      }))
    ),
  ];

  await items(d).insertMany(
    seeds.map((seed, index) => ({
      title: seed.title,
      body: seed.note,
      status: seed.status,
      previousStatus: null,
      held: seed.held,
      heldReason: "",
      createdAt: timestamp,
      updatedAt: timestamp,
      doneAt: seed.status === "done" ? timestamp : null,
      deletedAt: null,
      cue: index + 1,
      history: [],
    })) as unknown as ItemDoc[]
  );
  await meta(d).updateOne({ _id: "cue-counter" }, { $set: { n: seeds.length } }, { upsert: true });
}

/**
 * Gives every item a cue number, once, for lists seeded before cue numbers
 * existed. After that, each new item takes the next number from a counter and
 * numbers are never reused, even when an item is deleted.
 */
let cuesReady = false;
export async function ensureCues(): Promise<void> {
  if (cuesReady) return;
  const d = await db();
  try {
    await meta(d).insertOne({ _id: "cues-v1", at: now() });
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    cuesReady = true;
    return;
  }

  const all = await items(d).find().sort({ createdAt: 1, order: 1 }).toArray();
  await Promise.all(
    all.map((doc, index) => items(d).updateOne({ _id: doc._id }, { $set: { cue: index + 1 } }))
  );
  await meta(d).updateOne({ _id: "cue-counter" }, { $set: { n: all.length } }, { upsert: true });
  cuesReady = true;
}

async function nextCue(d: Db): Promise<number> {
  const counter = await meta(d).findOneAndUpdate(
    { _id: "cue-counter" },
    { $inc: { n: 1 } },
    { upsert: true, returnDocument: "after" }
  );
  return counter?.n ?? 0;
}

/** Items from the sectioned board kept their one-line note separately. */
function bodyOf(doc: ItemDoc): string {
  return doc.body ?? doc.note ?? "";
}

function toBoardItem(doc: ItemDoc): BoardItem {
  return {
    id: doc._id.toHexString(),
    title: doc.title,
    status: doc.status,
    previousStatus: doc.previousStatus,
    held: doc.held,
    heldReason: doc.heldReason,
    cue: doc.cue ?? 0,
    tasks: countTasks(bodyOf(doc)),
  };
}

export async function getBoard(): Promise<BoardItem[]> {
  const d = await db();
  const docs = await items(d).find({ deletedAt: null }).sort({ cue: 1 }).toArray();
  return docs.map(toBoardItem);
}

export async function getCue(id: string): Promise<CueDetail | null> {
  const d = await db();
  const doc = await items(d).findOne({ _id: new ObjectId(id), deletedAt: null });
  if (!doc) return null;
  return { ...toBoardItem(doc), body: bodyOf(doc), history: doc.history ?? [] };
}

/** An item's id from its cue number, for addressing items the way the list shows them. */
export async function idForCue(cue: number): Promise<string | null> {
  const d = await db();
  const doc = await items(d).findOne({ cue, deletedAt: null }, { projection: { _id: 1 } });
  return doc ? doc._id.toHexString() : null;
}

export async function createItem({ title, status = "idea", body = "" }: CreateItemInput): Promise<BoardItem> {
  const d = await db();
  const timestamp = now();
  const doc: Omit<ItemDoc, "_id"> = {
    title,
    body,
    // Anything added from the list is an idea until it's been decided on.
    status,
    previousStatus: null,
    held: false,
    heldReason: "",
    createdAt: timestamp,
    updatedAt: timestamp,
    doneAt: status === "done" ? timestamp : null,
    deletedAt: null,
    cue: await nextCue(d),
    history: [{ at: timestamp, text: "Added" }],
  };
  const result = await items(d).insertOne(doc as ItemDoc);
  return toBoardItem({ ...doc, _id: result.insertedId });
}

/** Returns the item's history after the edit, or null if the item is gone. */
export async function updateItem(patch: UpdateItemInput): Promise<HistoryEntry[] | null> {
  const d = await db();
  const { id, ...fields } = patch;
  const _id = new ObjectId(id);

  const current = await items(d).findOne({ _id, deletedAt: null });
  if (!current) return null;

  const timestamp = now();
  const set: Partial<ItemDoc> = { ...fields, updatedAt: timestamp };
  const added: HistoryEntry[] = [];

  if (fields.status && fields.status !== current.status) {
    added.push({ at: timestamp, text: STATUS_LABELS[fields.status] });
    if (fields.status === "done") {
      set.doneAt = timestamp;
      set.previousStatus = current.status === "done" ? null : current.status;
    } else {
      set.doneAt = null;
      set.previousStatus = null;
    }
  }

  if (fields.held !== undefined && fields.held !== current.held) {
    added.push({ at: timestamp, text: fields.held ? "Held" : "Released" });
    // Clearing the flag clears its reason, so re-holding later starts blank.
    if (!fields.held) set.heldReason = "";
  }

  const update: UpdateFilter<ItemDoc> = { $set: set };
  if (added.length > 0) update.$push = { history: { $each: added } };
  // Once the body is written, the old separate note has been folded into it.
  if (fields.body !== undefined) update.$unset = { note: "" };

  await items(d).updateOne({ _id }, update);
  return [...(current.history ?? []), ...added];
}

/** Tick or un-tick. Un-ticking restores whatever the item was before. */
export async function toggleDone(id: string): Promise<Status | null> {
  const d = await db();
  const current = await items(d).findOne({ _id: new ObjectId(id), deletedAt: null });
  if (!current) return null;

  const next: Status = current.status === "done" ? (current.previousStatus ?? "next") : "done";
  await updateItem({ id, status: next });
  return next;
}

export async function deleteItem(id: string): Promise<boolean> {
  const d = await db();
  const result = await items(d).updateOne(
    { _id: new ObjectId(id), deletedAt: null },
    { $set: { deletedAt: now(), updatedAt: now() } }
  );
  return result.matchedCount === 1;
}

export async function restoreItem(id: string): Promise<boolean> {
  const d = await db();
  const result = await items(d).updateOne(
    { _id: new ObjectId(id), deletedAt: { $ne: null } },
    { $set: { deletedAt: null, updatedAt: now() } }
  );
  return result.matchedCount === 1;
}
