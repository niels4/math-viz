import type { ThemeColors } from "#src/state/useAppTheme.ts"

// What the owner hands the plane to draw. Generic: no view's meaning lives
// here, so the Function Viewer and the Tangent Explorer describe their marks
// in the same terms. Later milestones add handles and annotations.

/** A theme colour, resolved for canvas by useAppTheme. */
export type Ink = keyof ThemeColors

export type PlaneCurve = {
  id: string
  /** y for each math x; non-finite values break the line. */
  fn: (x: number) => number
  ink: Ink
  /** Stroke width in px. */
  width: number
  /** Data ink glows where the theme gives it a glow (`--sig-curve-glow`). */
  glow?: boolean
  /** Dash and gap lengths in px, e.g. the ghost original's 6 6. */
  dash?: readonly number[]
  /** Opacity of the whole stroke, 0–1. */
  alpha?: number
  /** Point labels keep clear of this curve, as they do of the data curve (not of a ghost). */
  avoid?: boolean
}

/**
 * bullseye: knock-out Ø24, 2.5 px foreground ring, Ø12 core in `ink` (a pinned point).
 * ring: knock-out Ø24, 3 px ring in `ink`, Ø6 foreground centre (a probe).
 */
export type PointStyle = "bullseye" | "ring"

export type PlanePoint = {
  id: string
  x: number
  y: number
  style: PointStyle
  ink: Ink
  /** The point's letter: a label "P (2, 4)" beside it, and the letter of its edge marker. */
  name?: string
  /** Lit: a Ø48 halo behind the marker (hovered, focused or dragged). */
  focus?: boolean
  /** Dashed drop lines to both axes, and a tag on each writing x and y. */
  axisTags?: boolean
  /** While off the view, an edge marker on the nearest edge points at it; a click pans it into view. */
  edgeMarker?: boolean
  /** Its 48 px box takes the pointer: a press there drags the point instead of panning. */
  draggable?: boolean
}

/** A full-height dashed line at the pointer's x, under a probe. */
export type PlaneGuide = { kind: "pointer-x"; x: number }

export type PlaneScene = {
  /** Painted in order: a ghost before the curve it ghosts. */
  curves: readonly PlaneCurve[]
  /** Painted in order, each with its label: the last one on top. */
  points: readonly PlanePoint[]
  guides: readonly PlaneGuide[]
}
