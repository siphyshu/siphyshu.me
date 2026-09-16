"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type {
  BoardItem,
  OpenStatus,
  UpdateItemInput,
} from "@/lib/schemas/backstage";

export type Patch = Omit<UpdateItemInput, "id">;

/**
 * The words the page uses. The data keeps plain names (idea / next / doing /
 * done); what you read is the prompt book's vocabulary, and it's the same word
 * everywhere — the summary line, these controls, the aria labels — so there's
 * one language on the page, not two.
 */
export const STATUS_WORDS: Record<OpenStatus, string> = {
  idea: "pencilled",
  next: "on deck",
  doing: "on stage",
};

const OPEN_STATUSES: OpenStatus[] = ["idea", "next", "doing"];

interface ItemRowProps {
  item: BoardItem;
  editing: boolean;
  onOpen: () => void;
  /** `refocus` returns focus to the title — for Escape and "close", not for a click elsewhere. */
  onClose: (refocus: boolean) => void;
  onToggleDone: () => void;
  onUpdate: (patch: Patch) => void;
  onDelete: () => void;
}

export default function ItemRow({
  item,
  editing,
  onOpen,
  onClose,
  onToggleDone,
  onUpdate,
  onDelete,
}: ItemRowProps) {
  const done = item.status === "done";
  // Optimistically created items don't have a database id yet, so there's
  // nothing to toggle or edit until the server's copy replaces them.
  const pending = item.id.startsWith("temp-");

  const titleButton = useRef<HTMLButtonElement>(null);
  const refocusTitle = useRef(false);

  useEffect(() => {
    if (!editing && refocusTitle.current) {
      refocusTitle.current = false;
      titleButton.current?.focus();
    }
  }, [editing]);

  const close = useCallback(
    (refocus: boolean) => {
      refocusTitle.current = refocus;
      onClose(refocus);
    },
    [onClose]
  );

  return (
    <li className="grid grid-cols-[2rem_1fr] gap-x-2 py-1.5">
      <button
        type="button"
        className="pb-mark"
        data-status={item.status}
        data-held={item.held}
        aria-pressed={done}
        aria-label={done ? `Unstrike “${item.title}”` : `Strike “${item.title}”`}
        disabled={pending}
        onClick={onToggleDone}
      >
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
          <circle cx="8" cy="8" r="6.25" />
          <path d="M4.6 8.5 7 10.8 11.6 5.4" />
        </svg>
      </button>

      <div className="min-w-0">
        {editing ? (
          <Editor
            item={item}
            onClose={close}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ) : (
          <>
            <button
              ref={titleButton}
              type="button"
              className="pb-title"
              aria-expanded={false}
              disabled={pending}
              onClick={onOpen}
            >
              <span className="pb-text" data-status={item.status}>
                {item.title}
              </span>
            </button>
            {item.note && <p className="pb-note">{item.note}</p>}
            {item.held && (
              <p className="pb-held">
                held{item.heldReason ? `: ${item.heldReason}` : ""}
              </p>
            )}
          </>
        )}
      </div>
    </li>
  );
}

interface EditorProps {
  item: BoardItem;
  onClose: (refocus: boolean) => void;
  onUpdate: (patch: Patch) => void;
  onDelete: () => void;
}

function Editor({ item, onClose, onUpdate, onDelete }: EditorProps) {
  const [title, setTitle] = useState(item.title);
  const [note, setNote] = useState(item.note);
  const [reason, setReason] = useState(item.heldReason);

  const container = useRef<HTMLDivElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const reasonInput = useRef<HTMLInputElement>(null);

  // Commit reads the latest drafts through a ref, so the outside-click
  // listener registered once on mount never saves a stale draft. Synced in a
  // layout effect rather than during render (which React forbids): it runs
  // before the browser can deliver the next click or blur, so no handler ever
  // sees an older value than what's on screen.
  const latest = useRef({ title, note, reason, item });
  useLayoutEffect(() => {
    latest.current = { title, note, reason, item };
  });

  /**
   * Sends only what actually changed. Called on every field blur and again on
   * close; the second call is free because by then the item prop has caught up
   * with the first, so there's nothing left to send.
   */
  const commit = useCallback(() => {
    const { title, note, reason, item } = latest.current;
    const patch: Patch = {};

    const nextTitle = title.trim();
    // An emptied title is treated as a slip, not as intent: it reverts on close
    // rather than failing validation. Deleting is its own, undoable, action.
    if (nextTitle && nextTitle !== item.title) patch.title = nextTitle;
    if (note.trim() !== item.note) patch.note = note.trim();
    if (item.held && reason.trim() !== item.heldReason) {
      patch.heldReason = reason.trim();
    }

    if (Object.keys(patch).length > 0) onUpdate(patch);
  }, [onUpdate]);

  useEffect(() => {
    const input = titleInput.current;
    if (!input) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, []);

  // Clicking anywhere outside closes and keeps what was typed. A document
  // pointerdown rather than the editor's blur: Safari doesn't move focus to a
  // button when it's clicked, so a blur-based close would fire the moment you
  // chose a status inside the editor.
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!container.current?.contains(event.target as Node)) {
        commit();
        onClose(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [commit, onClose]);

  function onFocusOut(event: React.FocusEvent<HTMLDivElement>) {
    // Tabbing out. A null relatedTarget is a click on something unfocusable,
    // which the pointerdown listener above already handles.
    const next = event.relatedTarget as Node | null;
    if (next && !container.current?.contains(next)) {
      commit();
      onClose(false);
    }
  }

  return (
    <div ref={container} onBlur={onFocusOut} className="pb-1">
      <input
        ref={titleInput}
        className="pb-input pb-title"
        value={title}
        maxLength={200}
        aria-label="Title"
        onChange={(event) => setTitle(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
            onClose(true);
          } else if (event.key === "Escape") {
            onClose(true);
          }
        }}
      />

      <textarea
        className="pb-input pb-note mt-2"
        value={note}
        rows={Math.max(1, note.split("\n").length)}
        maxLength={2000}
        placeholder="a note, if it needs one"
        aria-label="Note"
        onChange={(event) => setNote(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            onClose(true);
          } else if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            commit();
            onClose(true);
          }
        }}
      />

      <div className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-2 text-[0.9375rem]">
        <div role="group" aria-label="Status" className="flex gap-3">
          {OPEN_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              className="pb-choice"
              aria-pressed={item.status === status}
              onClick={() => onUpdate({ status })}
            >
              {STATUS_WORDS[status]}
            </button>
          ))}
        </div>

        <label className="pb-quiet flex items-baseline gap-1.5">
          <input
            type="checkbox"
            className="translate-y-[1px] accent-[#c8352e]"
            checked={item.held}
            onChange={(event) => {
              const held = event.target.checked;
              onUpdate({ held });
              if (held) requestAnimationFrame(() => reasonInput.current?.focus());
              else setReason("");
            }}
          />
          held
        </label>

        {item.held && (
          <input
            ref={reasonInput}
            className="pb-input pb-held min-w-[12rem] flex-1"
            value={reason}
            maxLength={300}
            placeholder="on what?"
            aria-label="What it's held on"
            onChange={(event) => setReason(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commit();
              } else if (event.key === "Escape") {
                onClose(true);
              }
            }}
          />
        )}

        <span className="ml-auto flex gap-4">
          <button
            type="button"
            className="pb-link text-[color:var(--pb-red-pencil)]"
            onClick={onDelete}
          >
            delete
          </button>
          <button
            type="button"
            className="pb-link"
            onClick={() => {
              commit();
              onClose(true);
            }}
          >
            close
          </button>
        </span>
      </div>
    </div>
  );
}
