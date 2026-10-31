"use client";

import { useSyncExternalStore } from "react";
import { toggleTheme } from "@/lib/theme";

// The light switch: a wall plate with a rocker that flips down when the
// lights go off. The README says it's on your left — it is, in the footer;
// the reader's compact header carries it too, plate only, at the far right.
//
// The theme lives on <html> as data-theme, set before first paint by
// app/theme-script.js. This reads it from there; flipping it goes through
// toggleTheme (lib/theme.js), which the search palette uses too. What the switch shows (rocker position, "lights
// off" / "lights on") is CSS keyed off the same attribute — see .light-switch
// in globals.css — so the server-rendered markup is right before React runs.
// Only aria-pressed waits for the client.

function subscribe(onChange) {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
}

const getTheme = () => document.documentElement.dataset.theme;
// Unknown on the server, so aria-pressed is left off until hydration.
const getServerTheme = () => undefined;

export default function LightSwitch({ label = true, className = "" }) {
    const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);
    const dark = theme === "dark";

    return (
        <button
            type="button"
            className={`light-switch ${className}`}
            aria-label="lights off"
            aria-pressed={theme ? dark : undefined}
            onClick={toggleTheme}
        >
            <span className="light-switch-plate" aria-hidden>
                <span className="light-switch-rocker" />
            </span>
            {label && (
                <span aria-hidden>
                    <span className="when-light">lights off</span>
                    <span className="when-dark">lights on</span>
                </span>
            )}
        </button>
    );
}
