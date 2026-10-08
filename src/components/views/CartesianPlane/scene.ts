import type { ThemeColors } from "#src/state/useAppTheme.ts"

// What the owner hands the plane to draw. Generic: no view's meaning lives
// here, so the Function Viewer and the Tangent Explorer describe their marks
// in the same terms.

/** A theme colour, resolved for canvas by useAppTheme. */
export type Ink = keyof ThemeColors

/** A point in math units. */
export type MathPoint = { x: number; y: number }

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
  /** Labels placed clear (`labelPlace`) keep clear of this curve, as they do of the data curve (not of a ghost). */
  avoid?: boolean
  /** Context (an original, a reference): painted under the annotations, which paint under the other curves. */
  back?: boolean
  /** Drawn so far, 0–1: the share of its length inside the plane, from the left (a draw-on's path trim). */
  drawTo?: number
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
  /**
   * Where its label sits. clear (the default): the first spot clear of the
   * curves that ask, the chrome and the other marks (fvPlace), so it moves as
   * they do. fixed: up-right of the point, 22 px out, whatever is around it,
   * moving only to stay in view (inside the plane, off the chrome's plates).
   */
  labelPlace?: "clear" | "fixed"
  /** Lit: a Ø48 halo behind the marker (hovered, focused or dragged). */
  focus?: boolean
  /** Dashed drop lines to both axes. */
  dropLines?: boolean
  /** While off the view, an edge marker on the nearest edge points at it; a click pans it into view. */
  edgeMarker?: boolean
  /** Its 48 px box takes the pointer: a press there drags the point instead of panning. */
  draggable?: boolean
  /**
   * Where the point was before something else moved it: a dashed Ø22 ring
   * there in the point's ink, and an arrow in `ink` to where it is now.
   */
  was?: MathPoint & { ink: Ink }
  /** Opacity of the point and all it draws (marker, label, drop lines, edge marker), 0–1. */
  alpha?: number
  /** The label's opacity under `alpha`: a label arriving after its point. */
  labelAlpha?: number
  /** The label drawn this many px below its place: a label rising into it. */
  labelRise?: number
  /** How far the drop lines reach from the point toward the axes, 0–1: lines growing out of it. */
  reach?: number
}

/** A full-height dashed line at the pointer's x, under a probe. */
export type PlaneGuide = { kind: "pointer-x"; x: number; alpha?: number }

/**
 * A grip on the plane (FV 11): a press on its 44 px box drags it freely,
 * Shift locks the drag to one axis. The owner says what moving it means.
 */
export type PlaneHandle = {
  id: string
  x: number
  y: number
  /** diamond: 22 px, an anchor; square: 18 px, a stretch grip. */
  shape: "diamond" | "square"
  ink: Ink
  /** The Ø44 grab halo in its ink at 26 %: the pointer on it, or a drag. */
  halo?: boolean
  /** Filled with its ink while held. */
  held?: boolean
  /** Opacity, 0–1. */
  alpha?: number
}

/** A straight line between two math points, with px decorations. */
export type AnnotationLine = {
  from: MathPoint
  to: MathPoint
  /** px */
  width: number
  dash?: readonly number[]
  alpha?: number
  /** A tick across `from`, this many px to each side: where a dimension starts. */
  startTick?: number
  /** Ticks across both ends, this many px to each side: a measured side. */
  endTicks?: number
  /** An arrowhead whose tip sits on `to`. */
  arrow?: boolean
}

/**
 * What a value means on the plane, drawn while it is active (FV 04): lines
 * in `ink`. under: above the back curves, under the others; over: above
 * every curve, under the handles.
 */
export type PlaneAnnotation = {
  layer: "under" | "over"
  ink: Ink
  lines: readonly AnnotationLine[]
}

// Motion sets the opacities, the trim, the rise, the reach and the shifts
// (an owner's tweens, FV 05); the plane draws each frame as it is told.
// Layout and hit boxes keep the marks where they rest.
export type PlaneScene = {
  /** Opacity of the grid, the axes, their ticks and labels, and the O (a first paint fades them in). */
  gridAlpha?: number
  /** Painted in order: a ghost before the curve it ghosts. */
  curves: readonly PlaneCurve[]
  /** Painted in order, each with its label: the last one on top. */
  points: readonly PlanePoint[]
  guides: readonly PlaneGuide[]
  /** Painted above the curves and the over annotations, under the points. */
  handles?: readonly PlaneHandle[]
  annotations?: readonly PlaneAnnotation[]
}
