import type { ThemeColors } from "#src/state/useAppTheme.ts"

// What the owner hands the plane to draw. Generic: no view's meaning lives
// here, so the Function Viewer and the Tangent Explorer describe their marks
// in the same terms. Later milestones add guides, handles and annotations.

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
}

export type PlaneScene = {
  curves: readonly PlaneCurve[]
  points: readonly PlanePoint[]
}
