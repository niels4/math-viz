import type { Phrase } from "#src/components/ui/Phrases.tsx"

import { formatMark } from "#src/util/format/number.ts"

// The C3 sidebar's strings where they differ from today's sidebar (copy.ts):
// its rows name a point's role in plain lowercase (figma0 SB3 · C3), and
// Q's role says how to place it or what it does, in place of today's note.

/** Each point's role beside its letter (SB3 · C3 › Points). */
export const C3_POINT_ROLES = {
  p: "pinned",
  /** While the pointer is on the plane, and while it isn't. */
  q: { live: "follows your pointer", empty: "point at the plane" },
} as const

/** P's role while f(P) lies outside the plane's visible y-range. */
export const C3_OFF_VIEW_ROLES = { above: "above the view", below: "below the view" } as const

/**
 * The tips that took the hint bar's place (figma0 SB · B › Where things
 * went: "Gesture help: a tooltip on hover"): the box's gestures in B's
 * words while the pointer rests on it, and its keys (FV 07) while the
 * keyboard's focus is on it. Typing and refused text speak as today's hint.
 */
export const C3_TIPS = {
  drag: (reset: number): Phrase[] => [
    { text: "Drag sideways ·" },
    { text: "Shift for fine ·" },
    { text: `double-click: back to ${formatMark(reset)}` },
  ],
  keys: (reset: number): Phrase[] => [
    { together: [{ key: "←" }, { key: "→" }, { text: "nudge 0.01," }, { key: "Shift" }, { text: "0.1 ·" }] },
    { together: [{ key: "Enter" }, { text: "type ·" }] },
    { together: [{ key: "Backspace" }, { text: `back to ${formatMark(reset)}` }] },
  ],
}

/** The explainer's gestures (D12) start with what C3 has you drag. */
export const C3_GESTURE_LEAD: readonly Phrase[] = [{ text: "Drag the number ·" }]

/** The tour's step 2 (FV 08), on C3's k row. */
export const C3_TOUR_DRAG: readonly Phrase[] = [
  { text: "Drag the" },
  { math: "k" },
  { text: "number sideways: the whole curve moves up or down by" },
  { math: "k." },
  { text: "Every number works the same way." },
]

/** The hint at rest, as screen readers hear it from C3's status line. */
export const C3_IDLE: readonly Phrase[] = [
  { text: "Drag a number sideways to reshape the curve ·" },
  { text: "point at the plane to read" },
  { math: "f(x)" },
]
