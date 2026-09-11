import { z } from "zod";

// The 6 colors selectable in the form's color picker (rendered by
// components/handprint-wall/HandprintForm.tsx). "paw" also exists in
// public/handprints/ as a one-off Santa easter egg inserted directly in the
// database, not through this API, so it's intentionally not part of the set
// POST accepts.
export const HANDPRINT_COLORS = [
  "blue",
  "aqua",
  "red",
  "green",
  "yellow",
  "skin",
] as const;

export type HandprintColor = (typeof HANDPRINT_COLORS)[number];

// What the API accepts from a client submission. `timestamp` is deliberately
// excluded here — the server sets it itself rather than trusting a
// client-supplied value.
export const handprintInputSchema = z
  .object({
    name: z.string().trim().min(1).max(40),
    link: z.url().nullable().optional(),
    color: z.enum(HANDPRINT_COLORS),
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
    angle: z.number().min(-60).max(60),
  })
  .strict();

export type HandprintInput = z.infer<typeof handprintInputSchema>;

// What GET returns: stored input plus the server-assigned timestamp. `color`
// is a plain string here (not the enum) since historical/manually-inserted
// documents like "paw" must still round-trip through reads. `timestamp` is
// optional because 16 of the 95 documents currently in the DB predate this
// field being written at all (confirmed via a one-off audit).
//
// `id` is the stringified Mongo _id, so the client has a stable React key.
// It's optimistically generated client-side for a print that hasn't been
// persisted yet, hence not part of what POST accepts.
export interface Handprint extends Omit<HandprintInput, "color"> {
  id: string;
  color: string;
  timestamp?: string;
}
