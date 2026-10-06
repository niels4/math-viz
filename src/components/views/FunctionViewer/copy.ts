// The Function Viewer's user-facing strings, so wording changes in one place.
// Maths in a string is set by MathText (italic letters, upright names).

import type { Phrase } from "#src/components/ui/Phrases.tsx"

import { formatNumber } from "#src/util/format/number.ts"

import { ZERO_SCALE, type TransformParam } from "./math/form.ts"

export const VIEW_TITLE = "Function Viewer"
export const VIEW_SUBTITLE = "Functions · transformations"

/** The panel's numbered sections, in reading order. */
export const SECTIONS = {
  function: { step: 1, title: "Function" },
  transform: { step: 2, title: "Transform" },
  points: { step: 3, title: "Points" },
} as const

export const PICKER_LABEL = "Base function"

/** The caps label before the equation's general form. */
export const FORM_LABEL = "Form"

/** Each parameter's name, and the short one its control shows beside the letter chip. */
export const PARAM_NAMES: Readonly<Record<TransformParam, { name: string; short: string }>> = {
  a: { name: "Vertical scale", short: "Scale" },
  k: { name: "Vertical shift", short: "Shift" },
  b: { name: "Horizontal scale", short: "Scale" },
  h: { name: "Horizontal shift", short: "Shift" },
}

/** Section 2's columns mirror the equation: outside f( ) moves vertically, inside horizontally. */
export const TRANSFORM_GROUPS = [
  { axis: "Vertical", where: "outside", params: ["a", "k"] },
  { axis: "Horizontal", where: "inside", params: ["b", "h"] },
] as const satisfies readonly { axis: string; where: string; params: readonly TransformParam[] }[]

/** Set by MathText after a group's "outside" or "inside". */
export const GROUP_MATH = "f( )"

export const RESET_ALL = "Reset all"

export const resetLabel = (param: TransformParam, to: number): string =>
  `Reset ${param} to ${formatNumber(to)}`

/** The flip toggles (FV 13): a turns the curve upside down, b mirrors it. */
export const FLIP_LABELS: Readonly<Record<"a" | "b", string>> = {
  a: "Flip upside down",
  b: "Mirror left to right",
}

/** The badge that takes the name's place while a modifier is held mid-drag. */
export const modeBadge = (mode: "fine" | "snap", scale: boolean): string =>
  mode === "fine" ? "Fine ×0.1" : scale ? "Snap ¼" : "Snap 1"

/** Decision D2: the pinned point is P, the one under the pointer Q. */
export const POINT_NAMES = { p: "P", q: "Q" } as const

/** Section 3's cards (point-readout-fv): each point's role beside its letter. */
export const POINT_ROLES = { p: "Pinned", q: "Follows pointer" } as const

/** P's role while f(P) lies outside the plane's visible y-range. */
export const OFF_VIEW_ROLES = { above: "Above the view", below: "Below the view" } as const

export const P_NOTE: readonly Phrase[] = [
  { text: "Drag" },
  { math: "P" },
  { text: "here or along the curve" },
]

/**
 * P's badge while a transform's drag moves it (FV 04): "moved +1". Δ isn't
 * in the shipped fonts, so it says "moved" (FV 04 › Rationale).
 */
export const MOVED_LABEL = "moved"
export const movedBy = (dy: number): string =>
  `${dy > 0 && formatNumber(dy) !== "0" ? "+" : ""}${formatNumber(dy)}`

/** Q's note: what it does while the pointer is on the plane, and how to place it while not. */
export const Q_NOTES = {
  live: [{ math: "x" }, { text: "follows your pointer ·" }, { math: "y = f(x)" }],
  empty: [{ text: "Point at the plane to place" }, { math: "Q" }],
} as const satisfies Record<string, readonly Phrase[]>

/** The Original toggle (ghost-toggle-fv): its label, and the original g it draws dashed. */
export const ORIGINAL_LABEL = "Original"
export const originalMath = (g: string): string => `y = ${g}`

/** The plane's keys this view adds to its own, as read aloud (FV 07). */
export const PLANE_KEY_HELP = "[ and ] move P"

/** P's scrubber and the field its Enter opens, as screen readers name them. */
export const P_SCRUBBER_LABEL = "x of P"
export const P_FIELD_LABEL = "x of P, value"

/**
 * A ruler's gestures after their lead: Shift fine, Ctrl snaps (a scale to
 * quarters, plan § 1.8 call 2), a double-click resets to the parameter's own
 * default (call 1: R7's hint says "back to 0" for a too).
 */
const gestures = (lead: readonly Phrase[], scale: boolean, reset: number): Phrase[] => [
  ...lead,
  { key: "Shift" },
  { text: "fine ·" },
  { key: "Ctrl" },
  { text: `${scale ? "quarter" : "whole"} steps · double-click: back to ${formatNumber(reset)}` },
]

// The hint line (hint-bar-fv; decision D8). model/hints.ts picks the
// context; FV 01 › Behaviour rules says what each one covers.
export const HINTS = {
  idle: [
    { text: "Drag a ruler sideways to reshape the curve ·" },
    { text: "point at the plane to read" },
    { math: "f(x)" },
  ],
  /** A control hovered, focused or dragged, or its explainer open: its letter and gestures. */
  transform: (param: TransformParam, scale: boolean, reset: number): Phrase[] =>
    gestures([{ text: "Drag to change" }, { math: param }, { text: "·" }], scale, reset),
  fine: [{ key: "Shift" }, { text: "Fine: a tenth of the speed, steps of 0.001" }],
  snap: [{ key: "Ctrl" }, { text: "Snapping to whole numbers (scales: quarters)" }],
  edit: [
    { key: "Enter" },
    { text: "apply ·" },
    { key: "Esc" },
    { text: "cancel ·" },
    { key: "↑" },
    { key: "↓" },
    { text: "nudge 0.01" },
  ],
  /** Refused text: why, by the field's error code, and the value Esc puts back (FV 07). */
  refused: (error: string, putsBack: string): Phrase[] => [
    {
      text: `${error === ZERO_SCALE ? "A scale of 0 squashes the curve flat. Try 0.1" : "Type a number such as 1.5"} ·`,
    },
    { key: "Esc" },
    { text: `puts back ${putsBack}` },
  ],
  plane: [{ math: "Q" }, { text: "follows your pointer ·" }, { text: "drag to pan · scroll to zoom" }],
  point: [
    { text: "Drag" },
    { math: "P" },
    { text: "along the curve ·" },
    { key: "←" },
    { key: "→" },
    { text: "nudge 0.1" },
  ],
  /** The pointer on a handle (FV 11 › G1: the handles at rest). */
  handles: [{ text: "Drag the diamond to move the curve ·" }, { text: "the square to stretch it" }],
  /** The anchor dragged (R6; FV 11 › G2). */
  anchor: [
    { text: "Moving the anchor sets" },
    { math: "h" },
    { text: "and" },
    { math: "k" },
    { text: "·" },
    { key: "Shift" },
    { text: "locks one axis" },
  ],
  /** The stretch grip dragged (FV 11 › G3). */
  stretch: [
    { text: "Stretching sets" },
    { math: "a" },
    { text: "(height) and" },
    { math: "b" },
    { text: "(width) ·" },
    { key: "Shift" },
    { text: "locks one of them" },
  ],
} as const

// The explainers (help-popover-fv; decisions D10, D12): what each transform
// does, in one sentence, set as the boards set it (plain words; the no-break
// spaces keep "x − 2" on one line), and its place in the form, its letter
// lit. The before-and-after picture is panel/explainerPlots.ts.
export const EXPLAINERS: Readonly<Record<TransformParam, { say: string; snippet: string }>> = {
  a: {
    say: "Multiplies every height by a. a = 2 makes the curve twice as tall; between 0 and 1 it flattens; below 0 it flips upside down.",
    snippet: "a · f(x)",
  },
  k: {
    say: "Adds k to every height, so the whole curve moves up by k (down when k is negative).",
    snippet: "f(x) + k",
  },
  b: {
    say: "Divides x by b before f sees it. b = 2 makes the curve twice as wide; between 0 and 1 it narrows.",
    snippet: "f(x / b)",
  },
  h: {
    say: "Subtracts h from x before f sees it, so the curve moves right by h. Inside f the sign looks backwards: x\u00a0−\u00a02 moves right.",
    snippet: "f(x − h)",
  },
}

/** The caps label before an explainer's snippet. */
export const IN_THE_EQUATION = "In the equation"

/** An explainer's gestures: the ruler's, as the hint says them. */
export const explainerGestures = (scale: boolean, reset: number): Phrase[] =>
  gestures([{ text: "Drag the ruler ·" }], scale, reset)
