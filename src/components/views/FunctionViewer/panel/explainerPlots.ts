import type { MiniPlot } from "../../CartesianPlane/MiniPlane.tsx"

import { BASE_FUNCTIONS } from "../math/baseFunctions.ts"
import {
  anchorPoint,
  DEFAULT_PARAMS,
  evaluate,
  isScale,
  TRANSFORM_PARAMS,
  unitPoint,
  type TransformParam,
} from "../math/form.ts"

// Decision D10: each explainer pictures its transform on a fixed example,
// g = x² with the value at 2, so the picture teaches the idea and reads
// the same whatever the current numbers (figma0 FV 02 › Mini plot). The
// original dashed, the example solid, an arrow carrying one point: a scale
// carries the unit point (D14), a shift the anchor.

/** D10: the example's base function and value. */
export const EXPLAINER_EXAMPLE = { fn: "x2", value: 2 } as const

/** The mini plot's frame (help-popover-fv): 268 × 124 at 22 px per unit, lines every 1 and 5 u. */
export const EXPLAINER_PLOT_SIZE = { width: 268, height: 124 } as const
const ZOOM = 22
const STEPS = { minor: 1, major: 5 } as const
const AXIS_WIDTH = 1.5

/** Where each picture puts the origin, so its point's path stays in frame (figma0's builder). */
const ORIGINS: Readonly<Record<TransformParam, { x: number; y: number }>> = {
  a: { x: 134, y: 112 },
  k: { x: 134, y: 104 },
  b: { x: 134, y: 112 },
  h: { x: 80, y: 112 },
}

/** Before: the original, 1.75 px dashed 5 4 in --foreground-muted at 80 %; after: 2.5 px of --chart-line. */
const BEFORE = { width: 1.75, dash: [5, 4], alpha: 0.8 } as const
const AFTER_WIDTH = 2.5

const plotFor = (param: TransformParam): MiniPlot => {
  const base = BASE_FUNCTIONS[EXPLAINER_EXAMPLE.fn]
  const params = { ...DEFAULT_PARAMS, [param]: EXPLAINER_EXAMPLE.value }
  const carried = isScale(param)
    ? { from: unitPoint(base, DEFAULT_PARAMS), to: unitPoint(base, params) }
    : { from: anchorPoint(DEFAULT_PARAMS), to: anchorPoint(params) }
  return {
    zoom: ZOOM,
    origin: ORIGINS[param],
    steps: STEPS,
    axisWidth: AXIS_WIDTH,
    curves: [
      { id: "before", fn: base.g, ink: "foregroundMuted", ...BEFORE },
      { id: "after", fn: (x) => evaluate(base.g, params, x), ink: "chartLine", width: AFTER_WIDTH },
    ],
    arrows: [{ ...carried, ink: "primary", width: 2 }],
    // Where the point was (Ø7, a ring) and where it went (Ø8).
    dots: [
      { at: carried.from, diameter: 7, fill: "background", ring: { ink: "foregroundMuted", width: 1.5 } },
      { at: carried.to, diameter: 8, fill: "primary" },
    ],
  }
}

/** One picture per parameter, built once, so a mini plot repaints only when its theme changes. */
export const EXPLAINER_PLOTS: Readonly<Record<TransformParam, MiniPlot>> = Object.fromEntries(
  TRANSFORM_PARAMS.map((param) => [param, plotFor(param)]),
) as Record<TransformParam, MiniPlot>
