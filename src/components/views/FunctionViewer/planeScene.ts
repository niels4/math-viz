import type { Ink, PlaneScene } from "../CartesianPlane/scene.ts"
import type { FvState } from "./model/state.ts"

import { curveAt } from "./model/selectors.ts"

/** Decision D3: P draws in --chart-point-1, Q in --chart-point-2. */
export const POINT_INK = { p: "chartPoint1", q: "chartPoint2" } as const satisfies Record<string, Ink>

/** Specs › Plane: the curve is 3.5 px of --chart-line. */
const CURVE_WIDTH = 3.5

export type PlaneSceneInput = Pick<FvState, "fn" | "params" | "pX" | "qX">

// The view's state as the plane's scene: the transformed curve (data ink,
// so it glows where the theme does), P pinned on it, Q under the pointer,
// Q painted last as on the design's boards. M7 adds labels, guides, tags,
// edge markers and the ghost; M8 the handles and annotations.
export const buildPlaneScene = (state: PlaneSceneInput): PlaneScene => {
  const f = (x: number) => curveAt(state, x)
  return {
    curves: [{ id: "f", fn: f, ink: "chartLine", width: CURVE_WIDTH, glow: true }],
    points: [
      { id: "p", x: state.pX, y: f(state.pX), style: "bullseye", ink: POINT_INK.p },
      ...(state.qX === null
        ? []
        : [{ id: "q", x: state.qX, y: f(state.qX), style: "ring" as const, ink: POINT_INK.q }]),
    ],
  }
}
