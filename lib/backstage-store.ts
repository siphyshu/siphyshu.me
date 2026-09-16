import { ObjectId, type Collection, type Db } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { areas, openQuestions, type SeedStatus } from "@/data/roadmap";
import type {
  BoardItem,
  BoardSection,
  OpenStatus,
  Status,
  UpdateItemInput,
} from "@/lib/schemas/backstage";

// Server-only: talks to MongoDB. Every function here assumes its caller has
// already checked the unlock cookie — this module does no authorization of its
// own. The server actions in app/backstage/actions.ts are the only callers, and
// each one checks before it calls in.
//
// Note that MONGODB_URI is the same value in every Vercel environment and in
// .env.local, so local edits land on the live board. That's the existing
// arrangement for the handprint wall too, and for a single-person board it's
// the useful behaviour rather than a hazard.

const DB_NAME = "backstage";

interface SectionDoc {
  _id: string; // the slug
  name: string;
  blurb: string | null;
  order: number;
}

interface ItemDoc {
  _id: ObjectId;
  section: string;
  title: string;
  note: string;
  status: Status;
  /**
   * What the item was before it was marked done, so un-ticking it puts it back
   * where it was rather than flattening everything to "next".
   */
  previousStatus: OpenStatus | null;
  held: boolean;
  heldReason: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  doneAt: string | null;
  /** Soft delete, so undo is a field flip rather than a re-insert. */
  deletedAt: string | null;
}

interface MetaDoc {
  _id: string;
  at: string;
}

async function db(): Promise<Db> {
  return (await clientPromise).db(DB_NAME);
}

const sections = (d: Db): Collection<SectionDoc> => d.collection("sections");
const items = (d: Db): Collection<ItemDoc> => d.collection("items");
const meta = (d: Db): Collection<MetaDoc> => d.collection("meta");

function now(): string {
  return new Date().toISOString();
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
 * Seeds the board from data/roadmap.ts, once, ever.
 *
 * The marker is written *first*, with a fixed _id, and that insert is the lock.
 * Two first visits arriving together both try it; one gets a duplicate-key
 * error and backs off, so the board can't be seeded twice. It also means
 * deleting every item later leaves an empty board rather than quietly
 * restoring the original roadmap — which is what "seed if empty" would do.
 *
 * The cost of writing the marker first is that a failure partway through the
 * item insert leaves a partial board with no automatic retry. That's logged
 * loudly, and for a board of fifty rows it's recoverable by hand; a board that
 * resurrects deleted items is not.
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
  const sectionDocs: SectionDoc[] = [];
  const itemDocs: Omit<ItemDoc, "_id">[] = [];

  const push = (
    sectionSlug: string,
    order: number,
    title: string,
    note: string,
    seed: { status: Status; held: boolean }
  ) => {
    itemDocs.push({
      section: sectionSlug,
      title,
      note,
      status: seed.status,
      previousStatus: null,
      held: seed.held,
      heldReason: "",
      order,
      createdAt: timestamp,
      updatedAt: timestamp,
      doneAt: seed.status === "done" ? timestamp : null,
      deletedAt: null,
    });
  };

  // Open questions become an ordinary section, first on the board: answering
  // one is ticking it off and writing the answer into its note.
  if (openQuestions.length > 0) {
    sectionDocs.push({ _id: "open-questions", name: "open questions", blurb: null, order: 0 });
    openQuestions.forEach((question, index) =>
      push("open-questions", index, question, "", { status: "next", held: false })
    );
  }

  areas.forEach((area, areaIndex) => {
    const slug = slugify(area.name);
    sectionDocs.push({
      _id: slug,
      name: area.name,
      blurb: area.blurb ?? null,
      order: areaIndex + 1,
    });
    area.items.forEach((item, index) =>
      push(slug, index, item.title, item.note ?? "", fromSeedStatus(item.status))
    );
  });

  try {
    await sections(d).insertMany(sectionDocs);
    await items(d).insertMany(itemDocs as ItemDoc[]);
  } catch (error) {
    console.error(
      "Backstage seed failed after the marker was written — the board is partial and will not reseed on its own:",
      error
    );
    throw error;
  }
}

function toBoardItem(doc: ItemDoc): BoardItem {
  return {
    id: doc._id.toHexString(),
    section: doc.section,
    title: doc.title,
    note: doc.note,
    status: doc.status,
    previousStatus: doc.previousStatus,
    held: doc.held,
    heldReason: doc.heldReason,
  };
}

export async function getBoard(): Promise<BoardSection[]> {
  const d = await db();
  const [sectionDocs, itemDocs] = await Promise.all([
    sections(d).find().sort({ order: 1 }).toArray(),
    items(d)
      .find({ deletedAt: null })
      .sort({ order: 1, createdAt: 1 })
      .toArray(),
  ]);

  const bySection = new Map<string, BoardItem[]>();
  for (const doc of itemDocs) {
    const list = bySection.get(doc.section) ?? [];
    list.push(toBoardItem(doc));
    bySection.set(doc.section, list);
  }

  return sectionDocs.map((section) => ({
    slug: section._id,
    name: section.name,
    blurb: section.blurb,
    items: bySection.get(section._id) ?? [],
  }));
}

export async function createItem(sectionSlug: string, title: string): Promise<BoardItem | null> {
  const d = await db();

  // An unknown section is a stale client or a hand-crafted request. Either way,
  // an item filed under a section the board doesn't render would be invisible.
  const section = await sections(d).findOne({ _id: sectionSlug });
  if (!section) return null;

  const last = await items(d)
    .find({ section: sectionSlug })
    .sort({ order: -1 })
    .limit(1)
    .next();

  const timestamp = now();
  const doc: Omit<ItemDoc, "_id"> = {
    section: sectionSlug,
    title,
    note: "",
    // Anything newly written in is a thought until it's been decided on.
    status: "idea",
    previousStatus: null,
    held: false,
    heldReason: "",
    order: (last?.order ?? -1) + 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    doneAt: null,
    deletedAt: null,
  };

  const result = await items(d).insertOne(doc as ItemDoc);
  return toBoardItem({ ...doc, _id: result.insertedId });
}

export async function updateItem(patch: UpdateItemInput): Promise<boolean> {
  const d = await db();
  const { id, ...fields } = patch;
  const _id = new ObjectId(id);

  const current = await items(d).findOne({ _id, deletedAt: null });
  if (!current) return false;

  const set: Partial<ItemDoc> = { ...fields, updatedAt: now() };

  if (fields.status && fields.status !== current.status) {
    if (fields.status === "done") {
      set.doneAt = now();
      set.previousStatus = current.status === "done" ? null : current.status;
    } else {
      set.doneAt = null;
      set.previousStatus = null;
    }
  }

  // Clearing the flag clears its reason, so re-flagging later starts blank
  // instead of resurfacing an old explanation that may no longer be true.
  if (fields.held === false) set.heldReason = "";

  await items(d).updateOne({ _id }, { $set: set });
  return true;
}

/** Tick or un-tick. Un-ticking restores whatever the item was before. */
export async function toggleDone(id: string): Promise<Status | null> {
  const d = await db();
  const current = await items(d).findOne({ _id: new ObjectId(id), deletedAt: null });
  if (!current) return null;

  const next: Status =
    current.status === "done" ? (current.previousStatus ?? "next") : "done";
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
