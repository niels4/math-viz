import type {
  AnnotationLine,
  Ink,
  MathPoint,
  PlaneAnnotation,
  PlaneCurve,
  PlaneHandle,
  PlaneScene,
} from "../CartesianPlane/scene.ts"
import type { FvActive } from "./model/selectors.ts"
import type { FvHandle, FvState } from "./model/state.ts"

import { POINT_NAMES } from "./copy.ts"
import { BASE_FUNCTIONS } from "./math/baseFunctions.ts"
import { anchorPoint, unitPoint } from "./math/form.ts"
import { curveAt, ghostVisible } from "./model/selectors.ts"

/** Decision D3: P draws in --chart-point-1, Q in --chart-point-2. */
export const POINT_INK = { p: "chartPoint1", q: "chartPoint2" } as const satisfies Record<string, Ink>

/** Specs › Plane: the curve is 3.5 px of --chart-line. */
const CURVE_WIDTH = 3.5

/** Specs › Original (ghost): the untransformed g, 2 px dashed 6 6, --foreground-muted at 75 %. */
const GHOST = { width: 2, dash: [6, 6], alpha: 0.75 } as const

/** Handles and annotations draw in --primary (fvDrawCanvas). */
const LINK_INK = "primary" satisfies Ink

// fvDrawCanvas's annotation geometry, in px.
/** A shift's dimension line, and the tick where it starts. */
const DIMENSION = { width: 2.5, startTick: 9 } as const
/** The unit box: dashed 5 4, at 80 % while a ruler or a term is active. */
const BOX = { width: 1.5, dash: [5, 4] } as const
const BOX_ALPHA = 0.8
/** The measured side of the unit box, and its end ticks. */
const SIDE = { width: 3 } as const
const SIDE_ENDS = 7
/** The anchor's drop lines while it is dragged. */
const DROP = { width: 1.5, dash: [5, 4] } as const

export type PlaneSceneInput = Pick<FvState, "fn" | "params" | "pX" | "qX" | "ghostOn"> & {
  /** P's partners are lit (selectors.pLit): its halo and drop lines. */
  pLit: boolean
  /** The value whose meaning the plane draws (selectors.active). */
  active: FvActive
  /** The handle with its grab halo, and the one held (selectors.handleLit, handleHeld). */
  handleLit: FvHandle | null
  handleHeld: FvHandle | null
  /** f(P) where a transform's drag found it, while P's ghost shows (FV 04); null otherwise. */
  pWas: number | null
}

/** The unit box's four sides, from the anchor to the unit point. */
const boxSides = (from: MathPoint, to: MathPoint, style: Partial<AnnotationLine>): AnnotationLine[] => {
  const corners = [from, { x: to.x, y: from.y }, to, { x: from.x, y: to.y }]
  return corners.map((corner, i) => ({
    from: corner,
    to: corners[(i + 1) % corners.length] ?? from,
    width: BOX.width,
    dash: BOX.dash,
    ...style,
  }))
}

// What the active value means on the plane (FV 04 › Partner map, FV 11):
// k the shift from y = 0 to y = k at x = h; h the shift from x = 0 to x = h
// at y = k; a and b the unit box's sides from the anchor to the unit point
// (D14), under the curve. A dragged anchor drops h and k onto the axes; a
// dragged stretch grip draws the box with both sides; above the curve.
// Lines alone: no plate prints a, b, h or k on the plane (the user's ruling,
// 2026-10-08: "the a,b,k, and h tags on the grid also dont look very good");
// the panel prints them.
const annotationsFor = (state: PlaneSceneInput): PlaneAnnotation[] => {
  const { active, params } = state
  if (active === null) {
    return []
  }
  const anchor = anchorPoint(params)
  const unit = unitPoint(BASE_FUNCTIONS[state.fn], params)
  const corner = { x: unit.x, y: anchor.y }
  if (active === "anchor" || active === "stretch") {
    if (active === "anchor") {
      return [
        {
          layer: "over",
          ink: LINK_INK,
          // The board draws one path from the y-axis through the anchor
          // down to the x-axis, so the k leg's dashes start on the axis.
          lines: [
            { from: { x: 0, y: anchor.y }, to: anchor, ...DROP },
            { from: anchor, to: { x: anchor.x, y: 0 }, ...DROP },
          ],
        },
      ]
    }
    return [
      {
        layer: "over",
        ink: LINK_INK,
        lines: [
          ...boxSides(anchor, unit, {}),
          { from: anchor, to: corner, ...SIDE },
          { from: corner, to: unit, ...SIDE },
        ],
      },
    ]
  }
  const under = (lines: AnnotationLine[]): PlaneAnnotation[] => [{ layer: "under", ink: LINK_INK, lines }]
  switch (active) {
    case "k":
      return under([{ from: { x: anchor.x, y: 0 }, to: anchor, ...DIMENSION, arrow: true }])
    case "h":
      return under([{ from: { x: 0, y: anchor.y }, to: anchor, ...DIMENSION, arrow: true }])
    case "a":
      return under([
        ...boxSides(anchor, unit, { alpha: BOX_ALPHA }),
        { from: corner, to: unit, ...SIDE, endTicks: SIDE_ENDS },
      ])
    case "b":
      return under([
        ...boxSides(anchor, unit, { alpha: BOX_ALPHA }),
        { from: anchor, to: corner, ...SIDE, endTicks: SIDE_ENDS },
      ])
  }
}

// The view's state as the plane's scene: the ghost original under
// everything (data ink, so it glows where the theme does), the active
// value's annotation, the transformed curve, the handles (D21: the anchor
// ◆ at (h, k), the stretch grip ■ at the unit point), P pinned on the curve
// with its ghost while a transform's drag moves it, and Q under the pointer
// with its guide and drop lines, painted last as on the design's boards.
// Each point carries its label and its edge marker; P and the handles can be
// dragged. Each label holds one place up-right of its point, moving only to
// stay in view (the user's rulings, P's 2026-10-07, Q's 2026-10-08: placed
// clear of the curve and the marks, they jumped side to side, worst on
// sin x); where they meet, Q's covers P's. The labels alone print the
// coordinates: no tag on the axes (the user's ruling, 2026-10-08, "too many
// boxes on the screen at once").
export const buildPlaneScene = (state: PlaneSceneInput): PlaneScene => {
  const f = (x: number) => curveAt(state, x)
  const ghost: PlaneCurve[] = ghostVisible(state)
    ? [{ id: "original", fn: BASE_FUNCTIONS[state.fn].g, ink: "foregroundMuted", back: true, ...GHOST }]
    : []
  const anchor = anchorPoint(state.params)
  const unit = unitPoint(BASE_FUNCTIONS[state.fn], state.params)
  const handles: PlaneHandle[] = (
    [
      { id: "anchor", ...anchor, shape: "diamond" },
      { id: "stretch", ...unit, shape: "square" },
    ] as const
  ).map((handle) => ({
    ...handle,
    ink: LINK_INK,
    halo: state.handleLit === handle.id,
    held: state.handleHeld === handle.id,
  }))
  return {
    curves: [...ghost, { id: "f", fn: f, ink: "chartLine", width: CURVE_WIDTH, glow: true }],
    annotations: annotationsFor(state),
    handles,
    points: [
      {
        id: "p",
        x: state.pX,
        y: f(state.pX),
        style: "bullseye",
        ink: POINT_INK.p,
        name: POINT_NAMES.p,
        labelPlace: "fixed",
        focus: state.pLit,
        dropLines: state.pLit,
        edgeMarker: true,
        draggable: true,
        ...(state.pWas === null ? {} : { was: { x: state.pX, y: state.pWas, ink: LINK_INK } }),
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
              labelPlace: "fixed" as const,
              dropLines: true,
              edgeMarker: true,
            },
          ]),
    ],
    guides: state.qX === null ? [] : [{ kind: "pointer-x", x: state.qX }],
  }
}
