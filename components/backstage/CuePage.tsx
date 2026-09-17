"use client";

import { startTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { deleteItemAction, updateItemAction } from "@/app/backstage/actions";
import { STATUSES, type CueDetail, type Patch } from "@/lib/schemas/backstage";

function day(iso: string): string {
  return new Date(iso)
    .toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    .toLowerCase();
}

/**
 * An item's own page: title, status, notes. Local state is the source of truth
 * while you're here — each change shows at once and is saved behind it.
 */
export default function CuePage({ cue: initial }: { cue: CueDetail }) {
  const [cue, setCue] = useState(initial);
  const [saving, setSaving] = useState(0);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const save = (patch: Patch) => {
    setCue((current) => ({
      ...current,
      ...patch,
      ...(patch.held === false ? { heldReason: "" } : {}),
    }));
    setSaving((n) => n + 1);
    startTransition(async () => {
      const result = await updateItemAction({ id: cue.id, ...patch });
      setSaving((n) => n - 1);
      if (!result.ok) {
        setSaved(false);
        return setError(result.error);
      }
      setError(null);
      setSaved(true);
      setCue((current) => ({ ...current, history: result.data }));
    });
  };

  return (
    <article className="backstage pt-10 pb-40">
      <nav className="flex items-baseline justify-between gap-4">
        <Link href="/backstage" className="bs-button">
          ← backstage
        </Link>
        <span className="bs-meta" role="status" aria-live="polite">
          {error ? (
            <span className="bs-error">{error}</span>
          ) : saving > 0 ? (
            "saving…"
          ) : saved ? (
            "saved"
          ) : null}
        </span>
      </nav>

      <p className="bs-cue-label mt-12">cue {cue.cue}</p>
      <Title value={cue.title} onCommit={(title) => save({ title })} />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Status" className="bs-segmented">
          {STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              aria-pressed={cue.status === status}
              onClick={() => cue.status !== status && save({ status })}
            >
              {status}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="bs-toggle"
          aria-pressed={cue.held}
          onClick={() => save({ held: !cue.held })}
        >
          held
        </button>
      </div>

      {cue.held && (
        <input
          className="bs-field mt-3"
          defaultValue={cue.heldReason}
          maxLength={300}
          placeholder="held on what?"
          aria-label="Why it's held"
          onBlur={(event) => {
            const heldReason = event.target.value.trim();
            if (heldReason !== cue.heldReason) save({ heldReason });
          }}
          onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
        />
      )}

      <Notes value={cue.body} onCommit={(body) => save({ body })} />

      <footer className="bs-meta mt-16 flex flex-wrap items-baseline justify-between gap-4">
        <span>
          {cue.history.map((entry) => `${entry.text.toLowerCase()} ${day(entry.at)}`).join(" · ")}
        </span>
        <button
          type="button"
          className="bs-button bs-danger"
          onClick={() =>
            startTransition(async () => {
              const result = await deleteItemAction(cue.id);
              if (!result.ok) return setError(result.error);
              router.push(`/backstage?deleted=${cue.id}`);
            })
          }
        >
          delete
        </button>
      </footer>
    </article>
  );
}

function Title({ value, onCommit }: { value: string; onCommit: (value: string) => void }) {
  const [draft, setDraft] = useState(value);
  return (
    <textarea
      className="bs-title-input mt-1"
      value={draft}
      rows={1}
      maxLength={200}
      aria-label="Title"
      onChange={(event) => setDraft(event.target.value.replace(/\n/g, " "))}
      onBlur={() => {
        const title = draft.trim();
        // An emptied title reverts rather than failing validation.
        if (!title) return setDraft(value);
        if (title !== value) onCommit(title);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === "Escape") {
          event.preventDefault();
          if (event.key === "Escape") setDraft(value);
          const target = event.currentTarget;
          requestAnimationFrame(() => target.blur());
        }
      }}
    />
  );
}

/** Rendered markdown; click to edit, click away to save. */
function Notes({ value, onCommit }: { value: string; onCommit: (value: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  return (
    <section className="mt-10">
      <h2 className="bs-h2">notes</h2>
      {editing || !value ? (
        <textarea
          autoFocus={editing}
          className="bs-notes-input mt-3"
          value={draft}
          maxLength={20000}
          placeholder="markdown works. - [ ] makes a checklist."
          aria-label="Notes"
          onChange={(event) => setDraft(event.target.value)}
          onFocus={() => setEditing(true)}
          onBlur={() => {
            setEditing(false);
            if (draft !== value) onCommit(draft);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") event.currentTarget.blur();
          }}
        />
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label="Edit notes"
          className="bs-notes mt-3"
          onClick={(event) => {
            // Links in the notes open; anywhere else starts editing.
            if (!(event.target as HTMLElement).closest("a")) setEditing(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && event.target === event.currentTarget) {
              event.preventDefault();
              setEditing(true);
            }
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
            }}
          >
            {value}
          </ReactMarkdown>
        </div>
      )}
    </section>
  );
}
