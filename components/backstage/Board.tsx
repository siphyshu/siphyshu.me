"use client";

import { startTransition, useEffect, useOptimistic, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  createItemAction,
  lockAction,
  restoreItemAction,
  toggleDoneAction,
} from "@/app/backstage/actions";
import { useCurtain } from "@/components/backstage/Curtain";
import type { ActionResult, BoardItem, Status } from "@/lib/schemas/backstage";

// Every edit is applied here first and sent to the server second, so a tick
// lands on the frame you click. When the action finishes, revalidatePath hands
// the page fresh items and React drops the pending ops for the real state.

type Op = { type: "toggle"; id: string } | { type: "create"; item: BoardItem };

function reduce(items: BoardItem[], op: Op): BoardItem[] {
  if (op.type === "create") return [...items, op.item];
  return items.map((item) => {
    if (item.id !== op.id) return item;
    // Mirrors the store: un-ticking restores what it was before.
    return item.status === "done"
      ? { ...item, status: item.previousStatus ?? "next", previousStatus: null }
      : { ...item, status: "done", previousStatus: item.status };
  });
}

const GROUPS: { status: Status; label: string }[] = [
  { status: "doing", label: "doing" },
  { status: "next", label: "next" },
  { status: "idea", label: "ideas" },
];

const UNDO_MS = 8000;

export default function Board({
  items: serverItems,
  deletedId,
}: {
  items: BoardItem[];
  deletedId: string | null;
}) {
  const [items, apply] = useOptimistic(serverItems, reduce);
  const [error, setError] = useState<string | null>(null);
  const [undoId, setUndoId] = useState(deletedId);
  const [showDone, setShowDone] = useState(false);
  // An item ticked during this visit stays where it was, so you see it struck
  // instead of watching it jump to the bottom.
  const [justDone, setJustDone] = useState<Set<string>>(() => new Set());
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const curtain = useCurtain();

  const run = <T,>(op: Op | null, send: () => Promise<ActionResult<T>>) =>
    startTransition(async () => {
      if (op) apply(op);
      const result = await send();
      setError(result.ok ? null : result.error);
    });

  const toggle = (item: BoardItem) => {
    if (item.status !== "done") setJustDone((set) => new Set(set).add(item.id));
    run({ type: "toggle", id: item.id }, () => toggleDoneAction(item.id));
  };

  const create = (title: string) =>
    run(
      {
        type: "create",
        item: {
          id: `temp-${crypto.randomUUID()}`,
          title,
          status: "idea",
          previousStatus: null,
          held: false,
          heldReason: "",
          cue: 0,
          tasks: { done: 0, total: 0 },
        },
      },
      () => createItemAction({ title })
    );

  const clearUndo = () => {
    setUndoId(null);
    router.replace("/backstage", { scroll: false });
  };

  const restore = () => {
    if (!undoId) return;
    const id = undoId;
    clearUndo();
    run(null, () => restoreItemAction(id));
  };

  useEffect(() => {
    if (!undoId) return;
    const timer = setTimeout(clearUndo, UNDO_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undoId]);

  const groupOf = (item: BoardItem): Status =>
    item.status === "done" && justDone.has(item.id) ? (item.previousStatus ?? "next") : item.status;

  const done = items.filter((item) => groupOf(item) === "done");
  const open = items.filter((item) => item.status !== "done").length;
  const held = items.filter((item) => item.held && item.status !== "done").length;

  return (
    <div className="backstage pt-14 pb-40">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="bs-h1">backstage</h1>
          <p className="bs-meta mt-2">
            {open} open · {items.length - open} done{held > 0 && ` · ${held} held`}
          </p>
        </div>
        <button
          type="button"
          className="bs-button"
          onClick={() => {
            // The curtain closes over the list, and the cookie goes with it.
            curtain.draw("/");
            void lockAction();
          }}
        >
          lock
        </button>
      </header>

      <AddItem onCreate={create} />
      <p role="status" aria-live="polite" className="bs-error mt-2 min-h-[1.5rem]">
        {error}
      </p>

      <div className="mt-8 space-y-12">
        {GROUPS.map(({ status, label }) => {
          const group = items.filter((item) => groupOf(item) === status);
          if (group.length === 0) return null;
          return (
            <section key={status} aria-labelledby={`group-${status}`}>
              <h2 id={`group-${status}`} className="bs-h2">
                {label} <span className="bs-count">{group.length}</span>
              </h2>
              <ul className="mt-3">
                {group.map((item) => (
                  <Row key={item.id} item={item} onToggle={() => toggle(item)} />
                ))}
              </ul>
            </section>
          );
        })}

        {done.length > 0 && (
          <section aria-labelledby="group-done">
            <h2 id="group-done" className="bs-h2">
              <button
                type="button"
                className="bs-disclosure"
                aria-expanded={showDone}
                onClick={() => setShowDone((value) => !value)}
              >
                done <span className="bs-count">{done.length}</span>
                <span aria-hidden className="bs-chevron">›</span>
              </button>
            </h2>
            {showDone && (
              <ul className="mt-3">
                {done.map((item) => (
                  <Row key={item.id} item={item} onToggle={() => toggle(item)} />
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      <AnimatePresence>
        {undoId && (
          <motion.div
            key={undoId}
            role="status"
            initial={{ opacity: 0, transform: "translate(-50%, 8px)" }}
            animate={{ opacity: 1, transform: "translate(-50%, 0px)" }}
            exit={{ opacity: 0, transform: "translate(-50%, 8px)" }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="fixed bottom-6 left-1/2 z-50 flex items-baseline gap-4 rounded-full bg-black px-5 py-2.5 text-[0.9375rem] text-white"
          >
            <span>item deleted</span>
            <button type="button" className="font-semibold underline underline-offset-4" onClick={restore}>
              undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ item, onToggle }: { item: BoardItem; onToggle: () => void }) {
  const done = item.status === "done";
  // Optimistically created items have no database id yet.
  const pending = item.id.startsWith("temp-");

  return (
    <li className="bs-row">
      <span className="bs-cue" aria-hidden>
        {item.cue || ""}
      </span>
      <button
        type="button"
        className="bs-mark"
        data-done={done}
        aria-pressed={done}
        aria-label={done ? `Mark “${item.title}” not done` : `Mark “${item.title}” done`}
        disabled={pending}
        onClick={onToggle}
      >
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
          <circle cx="8" cy="8" r="6.5" />
          <path d="M4.8 8.4 7 10.6 11.4 5.6" />
        </svg>
      </button>
      <div className="min-w-0 py-1">
        {pending ? (
          <span className="bs-title">{item.title}</span>
        ) : (
          <Link href={`/backstage/${item.id}`} className="bs-title" data-done={done}>
            {item.title}
          </Link>
        )}
        {(item.tasks.total > 0 || item.held) && (
          <span className="bs-meta ml-2 whitespace-nowrap">
            {item.tasks.total > 0 && `${item.tasks.done}/${item.tasks.total}`}
            {item.tasks.total > 0 && item.held && " · "}
            {item.held && <span className="bs-held">held</span>}
          </span>
        )}
      </div>
    </li>
  );
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

function AddItem({ onCreate }: { onCreate: (title: string) => void }) {
  const [value, setValue] = useState("");
  const input = useRef<HTMLInputElement>(null);

  // n jumps to the add field from anywhere on the page.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "n" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTyping(event.target)) return;
      event.preventDefault();
      input.current?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <form
      className="bs-add mt-10"
      onSubmit={(event) => {
        event.preventDefault();
        if (!value.trim()) return;
        onCreate(value.trim());
        setValue("");
      }}
    >
      <span aria-hidden className="bs-add-icon">+</span>
      <input
        ref={input}
        className="bs-add-input"
        value={value}
        maxLength={200}
        placeholder="add an item"
        aria-label="Add an item"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setValue("");
            event.currentTarget.blur();
          }
        }}
      />
      <kbd className="bs-kbd" aria-hidden>
        n
      </kbd>
    </form>
  );
}
