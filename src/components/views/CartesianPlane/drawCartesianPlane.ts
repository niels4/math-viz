import type { ThemeVars } from "#src/state/useAppTheme.ts"

import type { CanvasFace } from "./faces.ts"
import type { Rect } from "./rect.ts"
import type { PlaneScene } from "./scene.ts"

import { ORIGIN_FACE, TICK_LABEL_FACE } from "./faces.ts"
import { layoutGrid } from "./grid.ts"
import { paintCurve } from "./paint/curve.ts"
import { paintGrid } from "./paint/grid.ts"
import { paintPoint } from "./paint/markers.ts"
import { makeViewport } from "./viewport.ts"

export type DrawCartesianPlaneProps = {
  ctx: CanvasRenderingContext2D
  themeVars: ThemeVars
  width: number
  height: number
  dpr: number
  zoom: number
  panX: number
  panY: number
  scene: PlaneScene
  /** Chrome boxes the tick labels stay out of. */
  keepOut: readonly Rect[]
}

// The painter pipeline, back to front: grid and axes with their labels, then
// the scene's curves, then its points. The DOM chrome sits above the canvas.
export const drawCartesianPlane = (props: DrawCartesianPlaneProps) => {
  const { ctx, themeVars, width, height, dpr, scene } = props
  if (width === 0 || height === 0) {
    return
  }
  const vp = makeViewport({ width, height, dpr }, props)
  const measure = (face: CanvasFace, text: string) => {
    ctx.font = face.font
    return ctx.measureText(text).width
  }
  const grid = layoutGrid(vp, {
    labelWidth: (text) => measure(TICK_LABEL_FACE, text),
    originWidth: measure(ORIGIN_FACE, "O"),
    keepOut: props.keepOut,
  })
  paintGrid(ctx, grid, themeVars, vp)
  for (const curve of scene.curves) {
    paintCurve(ctx, vp, curve, themeVars, dpr)
  }
  for (const point of scene.points) {
    paintPoint(ctx, vp, point, themeVars)
  }
}
