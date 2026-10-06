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

/** The plane's handles (D21): the anchor ◆ is (h, k), the stretch grip ■ g's unit point. */
export type FvHandle = "anchor" | "stretch"

/** The parameters each handle drives: a handle lights both (FV 04: "a plane handle drives two"). */
export const HANDLE_PARAMS: Readonly<Record<FvHandle, readonly [TransformParam, TransformParam]>> = {
  anchor: ["h", "k"],
  stretch: ["a", "b"],
}

/**
 * What the pointer, the focus, a drag or an edit can be on: a transform's
 * control, P (its card), the plane, the equation card ("eq", its terms), or
 * a handle being dragged.
 */
export type FvPart = TransformParam | "p" | "plane" | "eq" | FvHandle

/** A drag in progress: a ruler's or a term's mode (fine, snap), or "coarse" for P and the handles. */
export type FvDrag = { part: FvPart; mode: ScrubMode }

/** What the pointer can be over on the plane: P's marker or a handle (each grabs), or the empty plane (null). */
export type FvPlaneMark = "p" | FvHandle

/**
 * Where P was when a transform's drag began (FV 04): its ghost and the
 * card's "moved ±…" read from here. `moved` once the drag has moved it.
 */
export type FvPBefore = { x: number; y: number; moved: boolean }

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
  /** While the pointer is on the plane: the mark under it or being dragged. */
  planeOver: FvPlaneMark | null
  /** While the pointer is on the equation card: the term under it (its parameter). */
  eqOver: TransformParam | null
  /** The part holding the keyboard focus. */
  focus: FvPart | null
  /** Which of the two moved last: the hint speaks about that one first. */
  lead: "hover" | "focus"
  drag: FvDrag | null
  edit: FvEdit | null
  /** Set while a transform is dragged and for a moment after (the view clears it). */
  pBefore: FvPBefore | null
}

export const initialFvState: FvState = {
  fn: DEFAULT_FUNCTION,
  params: DEFAULT_PARAMS,
  pX: DEFAULT_P_X,
  qX: null,
  ghostOn: DEFAULT_GHOST_ON,
  view: null,
  hover: null,
  planeOver: null,
  eqOver: null,
  focus: null,
  lead: "hover",
  drag: null,
  edit: null,
  pBefore: null,
}

/** What a panel part reports about itself; the view turns each report into its part's action. */
export type PartEvents = {
  onHover: (on: boolean) => void
  onFocus: (on: boolean) => void
  onDrag: (mode: ScrubMode | null) => void
  onEdit: (edit: NumberFieldEdit | null) => void
}
