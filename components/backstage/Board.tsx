"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  createItemAction,
  deleteItemAction,
  lockAction,
  restoreItemAction,
  toggleDoneAction,
  updateItemAction,
} from "@/app/backstage/actions";
import ItemRow, { type Patch } from "@/components/backstage/ItemRow";
import type {
  ActionResult,
  BoardItem,
  BoardSection,
} from "@/lib/schemas/backstage";

// --- Optimistic model --------------------------------------------------------
//
// Every edit is applied here first and sent to the server second, so a tick
// lands on the frame you click rather than a round trip later. When the
// action finishes, revalidatePath hands the page fresh sections from the
// database and React drops these pending ops in favour of the real state —
// there's no manual reconciliation to get wrong.

type Op =
  | { type: "toggle"; id: string }
  | { type: "update"; id: string; patch: Patch }
  | { type: "create"; item: BoardItem }
  | { type: "delete"; id: string }
  | { type: "restore"; item: BoardItem; index: number };

function mapItems(
  sections: BoardSection[],
  fn: (items: BoardItem[], section: BoardSection) => BoardItem[]
): BoardSection[] {
  return sections.map((section) => ({ ...section, items: fn(section.items, section) }));
}

/** Mirrors the store's rules, so the optimistic state matches what the server will write. */
function applyPatch(item: BoardItem, patch: Patch): BoardItem {
  const next: BoardItem = { ...item, ...patch };
  if (patch.status && patch.status !== item.status) {
    next.previousStatus =
      patch.status === "done" && item.status !== "done" ? item.status : null;
  }
  if (patch.held === false) next.heldReason = "";
  return next;
}

function reduce(sections: BoardSection[], op: Op): BoardSection[] {
  switch (op.type) {
    case "create":
      return mapItems(sections, (items, section) =>
        section.slug === op.item.section ? [...items, op.item] : items
      );
    case "restore":
      return mapItems(sections, (items, section) => {
        if (section.slug !== op.item.section) return items;
        if (items.some((item) => item.id === op.item.id)) return items;
        const copy = [...items];
        copy.splice(Math.min(op.index, copy.length), 0, op.item);
        return copy;
      });
    case "delete":
      return mapItems(sections, (items) => items.filter((item) => item.id !== op.id));
    case "toggle":
      return mapItems(sections, (items) =>
        items.map((item) => {
          if (item.id !== op.id) return item;
          return item.status === "done"
            ? applyPatch(item, { status: item.previousStatus ?? "next" })
            : applyPatch(item, { status: "done" });
        })
      );
    case "update":
      return mapItems(sections, (items) =>
        items.map((item) => (item.id === op.id ? applyPatch(item, op.patch) : item))
      );
  }
}

// --- Summary -----------------------------------------------------------------

function summarize(sections: BoardSection[]): string {
  const all = sections.flatMap((section) => section.items);
  if (all.length === 0) return "Nothing pencilled in yet.";

  const struck = all.filter((item) => item.status === "done").length;
  const onStage = all.filter((item) => item.status === "doing").length;
  const held = all.filter((item) => item.held && item.status !== "done").length;

  // Zero clauses are dropped rather than printed as "0 held" — except struck,
  // which is the one number that means something even at zero.
  const clauses = [`${struck} struck`];
  if (onStage > 0) clauses.push(`${onStage} on stage`);
  if (held > 0) clauses.push(`${held} held`);
  return `${clauses.join(", ")}.`;
}

// --- Board -------------------------------------------------------------------

interface Undo {
  item: BoardItem;
  index: number;
  /** Undo stays disabled until the delete has actually landed, or a fast undo
   *  could race it — restore first, then the delete arrives and wins. */
  ready: boolean;
}

const UNDO_MS = 8000;

export default function Board({ sections }: { sections: BoardSection[] }) {
  const [board, apply] = useOptimistic(sections, reduce);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [undo, setUndo] = useState<Undo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSlug, setActiveSlug] = useState<string | null>(
    sections[0]?.slug ?? null
  );
  const reduceMotion = useReducedMotion();

  const run = useCallback(
    <T,>(op: Op, send: () => Promise<ActionResult<T>>, after?: (result: ActionResult<T>) => void) => {
      startTransition(async () => {
        apply(op);
        const result = await send();
        setError(result.ok ? null : result.error);
        after?.(result);
      });
    },
    [apply]
  );

  const toggleDone = (item: BoardItem) =>
    run({ type: "toggle", id: item.id }, () => toggleDoneAction(item.id));

  const update = (item: BoardItem, patch: Patch) =>
    run({ type: "update", id: item.id, patch }, () =>
      updateItemAction({ id: item.id, ...patch })
    );

  const create = (section: string, title: string) =>
    run(
      {
        type: "create",
        item: {
          id: `temp-${crypto.randomUUID()}`,
          section,
          title,
          note: "",
          status: "idea",
          previousStatus: null,
          held: false,
          heldReason: "",
        },
      },
      () => createItemAction({ section, title })
    );

  const remove = (item: BoardItem) => {
    const section = board.find((candidate) => candidate.slug === item.section);
    const index = section?.items.findIndex((candidate) => candidate.id === item.id) ?? 0;
    setEditingId(null);
    setUndo({ item, index, ready: false });
    run({ type: "delete", id: item.id }, () => deleteItemAction(item.id), (result) => {
      setUndo((current) =>
        current?.item.id === item.id
          ? result.ok
            ? { ...current, ready: true }
            : null
          : current
      );
    });
  };

  const restore = () => {
    if (!undo?.ready) return;
    const { item, index } = undo;
    setUndo(null);
    run({ type: "restore", item, index }, () => restoreItemAction(item.id));
  };

  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), UNDO_MS);
    return () => clearTimeout(timer);
  }, [undo]);

  // The rail follows the reading position. The band sits in the upper third of
  // the viewport, which is where your eye is when a section heading counts as
  // "the one you're in".
  const sectionEls = useRef(new Map<string, HTMLElement>());
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) {
          setActiveSlug((visible[0].target as HTMLElement).dataset.slug ?? null);
        }
      },
      { rootMargin: "-15% 0px -70% 0px" }
    );
    sectionEls.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [board.length]);

  const summary = useMemo(() => summarize(board), [board]);

  return (
    <div className="promptbook pt-14 pb-40">
      <header>
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-[2.75rem] leading-none tracking-[-0.02em]">backstage</h1>
          <form action={lockAction}>
            <button type="submit" className="pb-quiet pb-link text-sm">
              lock
            </button>
          </form>
        </div>
        <p className="pb-graphite mt-3">{summary}</p>
        {/* Reserves its line so an error appearing doesn't shove the board down. */}
        <p role="status" aria-live="polite" className="pb-held mt-1 min-h-[1.45em]">
          {error}
        </p>
      </header>

      <div className="mt-10 lg:grid lg:grid-cols-[9.5rem_minmax(0,1fr)] lg:gap-12">
        <nav aria-label="Sections" className="pb-rail hidden lg:block">
          <ul className="sticky top-10 space-y-1.5 text-[0.9375rem]">
            {board.map((section) => {
              const open = section.items.filter((item) => item.status !== "done").length;
              const current = section.slug === activeSlug;
              return (
                <li key={section.slug}>
                  <a
                    href={`#${section.slug}`}
                    aria-current={current}
                    className="flex items-baseline justify-between gap-2"
                    onClick={(event) => {
                      event.preventDefault();
                      document.getElementById(section.slug)?.scrollIntoView({
                        behavior: reduceMotion ? "auto" : "smooth",
                        block: "start",
                      });
                      history.replaceState(null, "", `#${section.slug}`);
                    }}
                  >
                    <span>{section.name}</span>
                    {open > 0 && <span className="tabular-nums">{open}</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-16">
          {board.map((section) => (
            <section
              key={section.slug}
              id={section.slug}
              data-slug={section.slug}
              ref={(el) => {
                if (el) sectionEls.current.set(section.slug, el);
                else sectionEls.current.delete(section.slug);
              }}
              className="scroll-mt-10"
            >
              <h2 className="text-[1.375rem] leading-tight tracking-[-0.01em]">
                {section.name}
              </h2>
              {section.blurb && (
                <p className="pb-note mt-1">{section.blurb}</p>
              )}

              <ul className="mt-4">
                {section.items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    editing={editingId === item.id}
                    onOpen={() => setEditingId(item.id)}
                    onClose={() =>
                      setEditingId((current) => (current === item.id ? null : current))
                    }
                    onToggleDone={() => toggleDone(item)}
                    onUpdate={(patch) => update(item, patch)}
                    onDelete={() => remove(item)}
                  />
                ))}
              </ul>

              <AddItem onCreate={(title) => create(section.slug, title)} />
            </section>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {undo && (
          <motion.div
            key={undo.item.id}
            role="status"
            // Enters and leaves along the same path, from just below where it sits.
            initial={{ opacity: 0, transform: "translate(-50%, 8px)" }}
            animate={{ opacity: 1, transform: "translate(-50%, 0px)" }}
            exit={{ opacity: 0, transform: "translate(-50%, 8px)" }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="fixed bottom-6 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] items-baseline gap-3 rounded-full bg-black px-5 py-2.5 text-[0.9375rem] text-white"
          >
            <span className="truncate">
              Deleted “{undo.item.title}”.
            </span>
            <button
              type="button"
              className="pb-link shrink-0 disabled:opacity-50"
              disabled={!undo.ready}
              onClick={restore}
            >
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddItem({ onCreate }: { onCreate: (title: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pb-quiet grid w-full grid-cols-[2rem_1fr] gap-x-2 py-1.5 text-left"
      >
        <span aria-hidden className="text-center">+</span>
        <span>pencil something in</span>
      </button>
    );
  }

  return (
    <div className="grid grid-cols-[2rem_1fr] gap-x-2 py-1.5">
      <span aria-hidden className="pb-graphite text-center">+</span>
      <input
        ref={input}
        className="pb-input pb-title"
        value={value}
        maxLength={200}
        placeholder="what is it?"
        aria-label="New item"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && value.trim()) {
            event.preventDefault();
            // Stays open for the next one: adding is usually several in a row.
            onCreate(value.trim());
            setValue("");
          } else if (event.key === "Escape") {
            setValue("");
            setOpen(false);
          }
        }}
        onBlur={() => {
          if (value.trim()) onCreate(value.trim());
          setValue("");
          setOpen(false);
        }}
      />
    </div>
  );
}
