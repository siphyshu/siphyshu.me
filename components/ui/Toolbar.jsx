"use client";

import { useEffect, useRef, useState } from "react";

function countNoun(label) {
    return label.replace(/^all\s+/, "");
}

/**
 * A "filter" dropdown: multi-select. Layout never changes; the trigger shows
 * the single selected option's name, or a count once more than one is
 * picked, plus a color shift so it's clear something's active. Every option
 * renders an always-visible checkbox on its trailing edge (filled when
 * selected) so the unselected state never looks like missing UI. A
 * "clear all" row appears inside the menu once anything is selected.
 */
function FilterDropdown({ label, options, value, onChange, open, onToggle }) {
    const selected = value ?? [];
    const triggerText =
        selected.length === 0
            ? label
            : selected.length === 1
                ? (options.find((o) => (o.value ?? o) === selected[0])?.label ?? selected[0])
                : `${selected.length} ${countNoun(label)}`;

    const toggleValue = (optValue) => {
        onChange(
            selected.includes(optValue)
                ? selected.filter((v) => v !== optValue)
                : [...selected, optValue]
        );
    };

    return (
        <div className="relative">
            <button
                onClick={onToggle}
                aria-expanded={open}
                className={`transition-colors ${selected.length > 0 ? "text-black" : "hover:text-black"}`}
            >
                {triggerText} <span aria-hidden="true">▾</span>
            </button>
            {open && (
                <div className="absolute right-0 mt-2 border border-black bg-white shadow-md py-1 min-w-[160px] z-10 text-left">
                    <button
                        onClick={selected.length > 0 ? () => onChange([]) : undefined}
                        disabled={selected.length === 0}
                        className={`block w-full text-left px-3 py-1.5 ${
                            selected.length > 0
                                ? "text-gray-400 hover:bg-gray-50 hover:text-black"
                                : "text-gray-300 cursor-default"
                        }`}
                    >
                        clear all
                    </button>
                    <hr className="border-gray-200 my-1" />
                    {options.map((opt) => {
                        const optValue = opt.value ?? opt;
                        const isSelected = selected.includes(optValue);
                        return (
                            <button
                                key={optValue}
                                onClick={() => toggleValue(optValue)}
                                className={`flex items-center justify-between gap-3 w-full text-left px-3 py-1.5 hover:bg-gray-50 ${isSelected ? "text-black" : "text-gray-500"}`}
                            >
                                <span>{opt.label ?? opt}</span>
                                <span
                                    aria-hidden="true"
                                    className={`w-3 h-3 border shrink-0 ${isSelected ? "bg-black border-black" : "border-gray-400"}`}
                                />
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/** A "toggle" dropdown: single-select, label itself shows the current state (e.g. latest/oldest). */
function ToggleDropdown({ label, options, value, onChange, open, onToggle }) {
    return (
        <div className="relative">
            <button
                onClick={onToggle}
                aria-expanded={open}
                className={`transition-colors ${value ? "text-black" : "hover:text-black"}`}
            >
                {value ?? label} <span aria-hidden="true">▾</span>
            </button>
            {open && (
                <div className="absolute right-0 mt-2 border border-black bg-white shadow-md py-1 min-w-[140px] z-10 text-left">
                    {options.map((opt) => (
                        <button
                            key={opt.value ?? opt}
                            onClick={() => onChange(opt.value ?? opt)}
                            className={`block w-full text-left px-3 py-1.5 hover:bg-gray-50 ${(opt.value ?? opt) === value ? "text-black" : "text-gray-500"}`}
                        >
                            {opt.label ?? opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * dropdowns: [{ id, label, type: "filter" | "toggle", options: string[] | {value,label}[], value, onChange }]
 * "filter" (default) is multi-select — value is an array, layout stays fixed, state shown via
 *   trigger text + checkboxes inside the menu. Menu stays open across selections.
 * "toggle" is an always-on two-way state (e.g. sort direction) — value is a single item,
 *   selecting one closes the menu.
 * Only one dropdown's menu is open at a time; clicking outside closes it.
 */
export default function Toolbar({ dropdowns }) {
    const [openId, setOpenId] = useState(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!openId) return;
        const handler = (e) => {
            if (!containerRef.current?.contains(e.target)) setOpenId(null);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [openId]);

    return (
        <div ref={containerRef} className="flex gap-6 text-xs text-gray-400">
            {dropdowns.map((d) => {
                const open = openId === d.id;
                const onToggle = () => setOpenId(open ? null : d.id);

                if (d.type === "toggle") {
                    return (
                        <ToggleDropdown
                            key={d.id}
                            label={d.label}
                            options={d.options}
                            value={d.value}
                            onChange={(v) => { d.onChange(v); setOpenId(null); }}
                            open={open}
                            onToggle={onToggle}
                        />
                    );
                }
                return (
                    <FilterDropdown
                        key={d.id}
                        label={d.label}
                        options={d.options}
                        value={d.value}
                        onChange={d.onChange}
                        open={open}
                        onToggle={onToggle}
                    />
                );
            })}
        </div>
    );
}
