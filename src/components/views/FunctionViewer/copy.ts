// The Function Viewer's user-facing strings, so wording changes in one place.
// Maths in a string is set by MathText (italic letters, upright names).

import { formatNumber } from "#src/util/format/number.ts"

import type { TransformParam } from "./math/form.ts"

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
