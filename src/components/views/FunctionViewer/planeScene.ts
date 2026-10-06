import type { Ink, PlaneCurve, PlaneScene } from "../CartesianPlane/scene.ts"
import type { FvState } from "./model/state.ts"

import { POINT_NAMES } from "./copy.ts"
import { BASE_FUNCTIONS } from "./math/baseFunctions.ts"
import { curveAt, ghostVisible } from "./model/selectors.ts"

/** Decision D3: P draws in --chart-point-1, Q in --chart-point-2. */
export const POINT_INK = { p: "chartPoint1", q: "chartPoint2" } as const satisfies Record<string, Ink>

/** Specs › Plane: the curve is 3.5 px of --chart-line. */
const CURVE_WIDTH = 3.5

/** Specs › Original (ghost): the untransformed g, 2 px dashed 6 6, --foreground-muted at 75 %. */
const GHOST = { width: 2, dash: [6, 6], alpha: 0.75 } as const

export type PlaneSceneInput = Pick<FvState, "fn" | "params" | "pX" | "qX" | "ghostOn"> & {
  /** P's partners are lit (selectors.pLit): its halo, drop lines and axis tags. */
  pLit: boolean
}

// The view's state as the plane's scene: the ghost original under the
// transformed curve (data ink, so it glows where the theme does), P pinned
// on the curve, and Q under the pointer with its guide, drop lines and axis
// tags, painted last as on the design's boards. Each point carries its label
// and its edge marker; P can be dragged along the curve. M8 adds the handles
// and annotations.
export const buildPlaneScene = (state: PlaneSceneInput): PlaneScene => {
  const f = (x: number) => curveAt(state, x)
  const ghost: PlaneCurve[] = ghostVisible(state)
    ? [{ id: "original", fn: BASE_FUNCTIONS[state.fn].g, ink: "foregroundMuted", ...GHOST }]
    : []
  return {
    curves: [...ghost, { id: "f", fn: f, ink: "chartLine", width: CURVE_WIDTH, glow: true, avoid: true }],
    points: [
      {
        id: "p",
        x: state.pX,
        y: f(state.pX),
        style: "bullseye",
        ink: POINT_INK.p,
        name: POINT_NAMES.p,
        focus: state.pLit,
        axisTags: state.pLit,
        edgeMarker: true,
        draggable: true,
      },
      ...(state.qX === null
        ? []
        : [
            {
              id: "q",
              x: state.qX,
              y: f(state.qX),
              style: "ring" as const,
              ink: POINT_INK.q,
              name: POINT_NAMES.q,
              axisTags: true,
              edgeMarker: true,
            },
          ]),
    ],
    guides: state.qX === null ? [] : [{ kind: "pointer-x", x: state.qX }],
  }
}
