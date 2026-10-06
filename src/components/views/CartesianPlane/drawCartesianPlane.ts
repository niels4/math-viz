import type { ThemeVars } from "#src/state/useAppTheme.ts"

import type { CanvasFace } from "./faces.ts"
import type { MarksLayout } from "./marks.ts"
import type { Rect } from "./rect.ts"
import type { PlaneScene } from "./scene.ts"

import { ORIGIN_FACE, TICK_LABEL_FACE } from "./faces.ts"
import { layoutGrid } from "./grid.ts"
import { paintCurve } from "./paint/curve.ts"
import { paintGrid } from "./paint/grid.ts"
import { paintGuides } from "./paint/guides.ts"
import { paintMarker } from "./paint/markers.ts"
import { paintPlate } from "./paint/plates.ts"
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
  /** The scene's points laid out (marks.ts): guides, drop lines, tags, markers, labels, edge markers. */
  marks: MarksLayout
  /** Chrome boxes the tick labels stay out of. */
  keepOut: readonly Rect[]
}

// The painter pipeline, back to front (figma0 fvDrawCanvas): grid and axes
// with their labels (skipping those under a tag), the scene's curves, the
// pointer guides and drop lines, the axis tags, then each point in order:
// its edge marker or its marker, and its label. The DOM chrome sits above.
export const drawCartesianPlane = (props: DrawCartesianPlaneProps) => {
  const { ctx, themeVars, width, height, dpr, scene, marks } = props
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
    keepOut: [...props.keepOut, ...marks.tickKeepOut],
  })
  paintGrid(ctx, grid, themeVars, vp)
  for (const curve of scene.curves) {
    paintCurve(ctx, vp, curve, themeVars, dpr)
  }
  paintGuides(ctx, marks, themeVars, height)
  for (const tag of marks.tags) {
    paintPlate(ctx, tag, themeVars)
  }
  for (const layer of marks.points) {
    if (layer.edge !== null) {
      paintPlate(ctx, layer.edge, themeVars)
    }
    if (layer.marker !== null) {
      paintMarker(ctx, layer.marker, themeVars)
    }
    if (layer.label !== null) {
      paintPlate(ctx, layer.label, themeVars)
    }
  }
}
