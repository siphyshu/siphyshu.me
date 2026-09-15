"use client";

import { useState } from "react";

/** Preview tilt, ± this many degrees. */
const PREVIEW_TILT_RANGE = 18;

/** Deterministic 0-1 scatter. The usual sine-hash: same input, same output, so
 *  it's safe to call during render where Math.random isn't. */
function noise(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * A fresh tilt for the selected handprint each time a colour is picked.
 *
 * Not Math.random: React is free to render twice, and a roll during render
 * would answer differently each time and make the hand twitch on every
 * keystroke. A hash of the step survives that while still scattering — a fixed
 * angular step was tried first and marched the hand steadily one way, which
 * read as mechanical rather than playful.
 *
 * Shared so the sheet and the panel tilt identically. Written separately first
 * and the two formulas had already diverged.
 *
 * @param seed distinguishes one instance from another, so two visitors don't
 *   open on the same angle. The panel passes where the print landed.
 */
export function usePreviewTilt(seed = 0) {
  const [step, setStep] = useState(0);
  const tilt = (noise(step + seed) * 2 - 1) * PREVIEW_TILT_RANGE;
  const reroll = () => setStep((n) => n + 1);
  return { tilt, reroll };
}
