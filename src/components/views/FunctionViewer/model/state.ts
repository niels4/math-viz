import type { NumberFieldEdit } from "#src/components/ui/NumberField.tsx"
import type { ScrubMode } from "#src/components/ui/scrub.ts"

import type { PlaneView } from "../../CartesianPlane/viewport.ts"
import type { BaseFunctionSlug } from "../math/baseFunctions.ts"

import { DEFAULT_PARAMS, type TransformParam, type TransformParams } from "../math/form.ts"

/** Decision D4: P starts at x = 2 (before v2 it started at 0). */
export const DEFAULT_P_X = 2

/** Decision D7: the dashed original is on by default; it shows once a transform is set (selectors.ts). */
export const DEFAULT_GHOST_ON = true

export const DEFAULT_FUNCTION: BaseFunctionSlug = "x2"

/** What the pointer, the focus, a drag or an edit can be on: a transform's control, P (its card), the plane. */
export type FvPart = TransformParam | "p" | "plane"

/** A drag in progress: a ruler's mode (fine, snap), or "coarse" for P's scrubber. */
export type FvDrag = { part: FvPart; mode: ScrubMode }

/** A value being typed: the refusal of its text, if any, and the value Esc puts back. */
export type FvEdit = { part: FvPart; error: string | null; base: number }

export type FvState = {
  /** The base function g. */
  fn: BaseFunctionSlug
  /** a, b, h, k as stored: at most 3 decimals, so stored = shown. */
  params: TransformParams
  /** P's x, pinned, on the 0.01 lattice. */
  pX: number
  /** Q's x while the pointer is on the plane (0.01 lattice), else null. */
  qX: number | null
  /** The Original toggle. */
  ghostOn: boolean
  /** The plane's zoom and visible range, as it reports them; null before its first layout. */
  view: PlaneView | null
  /** The part under the pointer. */
  hover: FvPart | null
  /** The part holding the keyboard focus. */
  focus: FvPart | null
  /** Which of the two moved last: the hint speaks about that one first. */
  lead: "hover" | "focus"
  drag: FvDrag | null
  edit: FvEdit | null
}

export const initialFvState: FvState = {
  fn: DEFAULT_FUNCTION,
  params: DEFAULT_PARAMS,
  pX: DEFAULT_P_X,
  qX: null,
  ghostOn: DEFAULT_GHOST_ON,
  view: null,
  hover: null,
  focus: null,
  lead: "hover",
  drag: null,
  edit: null,
}

/** What a panel part reports about itself; the view turns each report into its part's action. */
export type PartEvents = {
  onHover: (on: boolean) => void
  onFocus: (on: boolean) => void
  onDrag: (mode: ScrubMode | null) => void
  onEdit: (edit: NumberFieldEdit | null) => void
}
