"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULTS = {
  cell: 22, // px per cell
  seedDensity: 0.1,
  tickMs: 240,
  stagnantLimit: 6, // regenerations with no change (or no population) before reseeding — a backstop, `noiseRate` below should keep this from ever firing
  tickArm: 3.1, // half-length of each cross stroke, px
  opacity: 0.06, // resting ink, 0-1
  opacityBorn: 0.11, // ink on the tick a cell is born, fading to `opacity` next tick
  noiseRate: 0.004, // fraction of all cells sparked alive each tick, regardless of Life's own rules — keeps the board from ever settling into a dead or static grid
};

// Breathing room around a masked element's real bounding box, so ticks don't
// render flush against a letter's edge.
const MASK_PADDING = 48;

// Archived, not deleted: tuning settled on values that work, so the panel
// no longer renders even in dev. Flip back to `process.env.NODE_ENV !==
// "production"` to bring it back for another round of tuning — the
// component and its state are untouched below.
const isDev = false;

// A quiet Conway's Game of Life running behind the page — the board is sized
// to the viewport in cells, stepped on a slow interval so it reads as a
// texture (like the wood-frame or tape-wall assets) rather than motion you
// track. Canvas over DOM nodes: a page-sized grid is thousands of cells, and
// this only ever needs to be painted, never hit-tested or styled per-node.
//
// No blanket "content column" mask: a single width can't fit how different
// each section's content actually is (a centered, narrower-than-the-column
// hero versus a full-width card grid), and it leaves real empty space
// unlit — the exact gap reported in review. Instead, elements that sit on a
// transparent background and need to stay legible carry a `data-gol-mask`
// attribute (see HeaderSection2); every draw() reads their *real*, current
// getBoundingClientRect() and skips any tick that falls inside one. Elements
// with their own solid background (cards, images, the wood frame) never
// needed this — they already occlude the canvas for free, same as before,
// since the canvas sits behind everything in normal stacking order.
export default function GameOfLifeBackground() {
  const canvasRef = useRef(null);
  const paramsRef = useRef(DEFAULTS);
  const resizeRef = useRef(null);
  const reseedRef = useRef(null);
  const skipNextCellEffect = useRef(true);

  const [params, setParams] = useState(DEFAULTS);
  const [paused, setPaused] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  // The render loop reads this ref every tick rather than re-running the
  // effect below on every slider drag — only `cell` needs a real resize +
  // reseed (handled separately), everything else just takes effect on the
  // next scheduled step/draw.
  useEffect(() => {
    paramsRef.current = { ...params, paused };
  }, [params, paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const reduceMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    let reducedMotion = reduceMotionQuery.matches;

    let cols = 0;
    let rows = 0;
    let cells = null; // Uint8Array, current generation
    let born = null; // Uint8Array, cells that just turned alive this step
    let dpr = 1;
    let stagnantTicks = 0;
    let timeoutId = null;
    let resizeTimeoutId = null;
    let cancelled = false;

    function seed() {
      const density = paramsRef.current.seedDensity;
      cells = new Uint8Array(cols * rows);
      for (let i = 0; i < cells.length; i++) {
        cells[i] = Math.random() < density ? 1 : 0;
      }
      born = new Uint8Array(cols * rows);
      stagnantTicks = 0;
    }

    function resize() {
      const cellSize = paramsRef.current.cell;
      const { innerWidth, innerHeight } = window;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      canvas.width = Math.round(innerWidth * dpr);
      canvas.height = Math.round(innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(innerWidth / cellSize) + 1;
      rows = Math.ceil(innerHeight / cellSize) + 1;
      seed();
      draw();
    }

    function step() {
      const next = new Uint8Array(cols * rows);
      const nextBorn = new Uint8Array(cols * rows);
      let changed = false;
      let alive = 0;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const idx = y * cols + x;
          let neighbours = 0;

          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              // Wraps at the edges (a torus) so the board has no dead border
              // where gliders and blinkers pile up and stall out.
              const nx = (x + dx + cols) % cols;
              const ny = (y + dy + rows) % rows;
              neighbours += cells[ny * cols + nx];
            }
          }

          const alive_ = cells[idx];
          const survives = alive_ ? neighbours === 2 || neighbours === 3 : neighbours === 3;
          next[idx] = survives ? 1 : 0;
          if (survives) {
            alive++;
            if (!alive_) nextBorn[idx] = 1;
          }
          if (survives !== alive_) changed = true;
        }
      }

      // Sparked in on top of Life's own rules, not part of them — a steady
      // trickle of fresh cells so the board never actually reaches "heat
      // death" (dies out, or settles into still lifes/oscillators that just
      // repeat forever). That's what a texture that's meant to always be
      // quietly moving needs; strict Life alone doesn't guarantee it.
      const total = cols * rows;
      const sparks = Math.round(total * paramsRef.current.noiseRate);
      for (let i = 0; i < sparks; i++) {
        const idx = Math.floor(Math.random() * total);
        if (!next[idx]) {
          if (!cells[idx]) alive++;
          next[idx] = 1;
          nextBorn[idx] = 1;
          changed = true;
        }
      }

      cells = next;
      born = nextBorn;

      // A backstop, not the main mechanism now that noiseRate keeps things
      // moving: only fires if noise is tuned to 0 and the board genuinely
      // settles, so it doesn't just freeze as wallpaper.
      if (!changed || alive === 0) {
        stagnantTicks++;
      } else {
        stagnantTicks = 0;
      }
      if (stagnantTicks >= paramsRef.current.stagnantLimit) {
        seed();
      }
    }

    function maskedRects() {
      const nodes = document.querySelectorAll("[data-gol-mask]");
      const rects = [];
      for (const node of nodes) {
        const r = node.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue; // display:none etc.
        rects.push({
          left: r.left - MASK_PADDING,
          right: r.right + MASK_PADDING,
          top: r.top - MASK_PADDING,
          bottom: r.bottom + MASK_PADDING,
        });
      }
      return rects;
    }

    function isMasked(cx, cy, rects) {
      for (const r of rects) {
        if (cx > r.left && cx < r.right && cy > r.top && cy < r.bottom) {
          return true;
        }
      }
      return false;
    }

    function draw() {
      const cellSize = paramsRef.current.cell;
      const arm = paramsRef.current.tickArm;
      const color = `rgba(20, 18, 14, ${paramsRef.current.opacity})`;
      const colorBorn = `rgba(20, 18, 14, ${paramsRef.current.opacityBorn})`;
      const rects = maskedRects();

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 1;
      ctx.lineCap = "round";

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const idx = y * cols + x;
          if (!cells[idx]) continue;
          const cx = x * cellSize + cellSize / 2;
          const cy = y * cellSize + cellSize / 2;
          if (isMasked(cx, cy, rects)) continue;
          ctx.strokeStyle = born[idx] ? colorBorn : color;
          ctx.beginPath();
          ctx.moveTo(cx - arm, cy);
          ctx.lineTo(cx + arm, cy);
          ctx.moveTo(cx, cy - arm);
          ctx.lineTo(cx, cy + arm);
          ctx.stroke();
        }
      }
    }

    // Self-rescheduling rather than setInterval: each call reads the
    // *current* tickMs when it books the next one, so a debug-panel change
    // to speed takes effect on the very next tick instead of needing the
    // interval torn down and restarted.
    function loop() {
      if (cancelled) return;
      if (!reducedMotion && !paramsRef.current.paused) {
        step();
        draw();
      }
      timeoutId = window.setTimeout(loop, paramsRef.current.tickMs);
    }

    resize();
    loop();

    resizeRef.current = resize;
    reseedRef.current = seed;

    function handleReducedMotionChange(event) {
      reducedMotion = event.matches;
    }

    function handleResize() {
      window.clearTimeout(resizeTimeoutId);
      resizeTimeoutId = window.setTimeout(resize, 200);
    }

    window.addEventListener("resize", handleResize);
    reduceMotionQuery.addEventListener("change", handleReducedMotionChange);

    return () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      window.clearTimeout(resizeTimeoutId);
      window.removeEventListener("resize", handleResize);
      reduceMotionQuery.removeEventListener("change", handleReducedMotionChange);
    };
  }, []);

  // `cell` changes the grid's dimensions, so it needs a real resize + reseed
  // rather than just being picked up on the next tick.
  useEffect(() => {
    if (skipNextCellEffect.current) {
      skipNextCellEffect.current = false;
      return;
    }
    resizeRef.current?.();
  }, [params.cell]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
      />
      {isDev && (
        <GameOfLifeDebugPanel
          params={params}
          setParams={setParams}
          paused={paused}
          setPaused={setPaused}
          open={panelOpen}
          setOpen={setPanelOpen}
          onReseed={() => reseedRef.current?.()}
          onReset={() => setParams(DEFAULTS)}
        />
      )}
    </>
  );
}

const CONTROLS = [
  { key: "cell", label: "cell size", min: 10, max: 40, step: 1, unit: "px" },
  { key: "seedDensity", label: "seed density", min: 0.02, max: 0.4, step: 0.01 },
  { key: "tickMs", label: "tick rate", min: 80, max: 1500, step: 10, unit: "ms" },
  { key: "stagnantLimit", label: "reseed after", min: 1, max: 20, step: 1, unit: " stagnant" },
  { key: "tickArm", label: "tick arm", min: 1, max: 10, step: 0.5, unit: "px" },
  { key: "opacity", label: "opacity", min: 0.02, max: 0.3, step: 0.01 },
  { key: "opacityBorn", label: "opacity (born)", min: 0.02, max: 0.4, step: 0.01 },
  { key: "noiseRate", label: "noise rate", min: 0, max: 0.02, step: 0.0005 },
];

// Dev-only tuning panel — not part of the site's design language on
// purpose, it should read as a devtool overlay, not a page element.
function GameOfLifeDebugPanel({
  params,
  setParams,
  paused,
  setPaused,
  open,
  setOpen,
  onReseed,
  onReset,
}) {
  function updateParam(key, raw) {
    setParams((prev) => ({ ...prev, [key]: Number(raw) }));
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 font-mono text-xs text-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="block border border-white/25 bg-black/85 px-2.5 py-1.5 backdrop-blur-sm"
      >
        {open ? "close gol debug" : "gol debug"}
      </button>

      {open && (
        <div className="mt-2 w-72 space-y-3 border border-white/25 bg-black/85 p-3 backdrop-blur-sm">
          {CONTROLS.map(({ key, label, min, max, step, unit }) => (
            <label key={key} className="block">
              <div className="mb-1 flex items-center justify-between">
                <span>{label}</span>
                <span className="text-white/60">
                  {params[key]}
                  {unit || ""}
                </span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={params[key]}
                onChange={(e) => updateParam(key, e.target.value)}
                className="w-full"
              />
            </label>
          ))}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="flex-1 border border-white/25 px-2 py-1 hover:bg-white/10"
            >
              {paused ? "resume" : "pause"}
            </button>
            <button
              type="button"
              onClick={onReseed}
              className="flex-1 border border-white/25 px-2 py-1 hover:bg-white/10"
            >
              reseed
            </button>
            <button
              type="button"
              onClick={onReset}
              className="flex-1 border border-white/25 px-2 py-1 hover:bg-white/10"
            >
              reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
