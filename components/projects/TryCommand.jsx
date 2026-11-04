"use client";

import { useEffect, useState } from "react";

// A project's install command, as a terminal line with a copy button — the
// one thing a project page asks you to do.
export default function TryCommand({ command }) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;
        const t = setTimeout(() => setCopied(false), 1500);
        return () => clearTimeout(t);
    }, [copied]);

    return (
        <div className="flex items-center gap-3 px-4 py-3 border border-[var(--rule)] rounded-lg bg-[var(--surface)] font-mono text-[0.85rem]">
            <span aria-hidden className="text-gray-400 select-none">$</span>
            <code className="flex-1 min-w-0 overflow-x-auto whitespace-nowrap no-scrollbar">{command}</code>
            <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(command).then(() => setCopied(true))}
                className="shrink-0 font-sans text-xs text-gray-500 hover:text-black"
            >
                {copied ? "copied" : "copy"}
            </button>
        </div>
    );
}
