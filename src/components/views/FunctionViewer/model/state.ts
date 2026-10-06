import type { PlaneView } from "../../CartesianPlane/viewport.ts"
import type { BaseFunctionSlug } from "../math/baseFunctions.ts"

import { DEFAULT_PARAMS, type TransformParams } from "../math/form.ts"

/** Decision D4: P starts at x = 2 (before v2 it started at 0). */
export const DEFAULT_P_X = 2

/** Decision D7: the dashed original is on by default; it shows once a transform is set (selectors.ts). */
export const DEFAULT_GHOST_ON = true

export const DEFAULT_FUNCTION: BaseFunctionSlug = "x2"

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
}

export const initialFvState: FvState = {
  fn: DEFAULT_FUNCTION,
  params: DEFAULT_PARAMS,
  pX: DEFAULT_P_X,
  qX: null,
  ghostOn: DEFAULT_GHOST_ON,
  view: null,
}
