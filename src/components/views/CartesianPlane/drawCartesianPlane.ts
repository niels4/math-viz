import type { ThemeVars } from "#src/state/useAppTheme.ts"

import type { CanvasFace } from "./faces.ts"
import type { GridLayout } from "./grid.ts"
import type { MarksLayout } from "./marks.ts"
import type { Rect } from "./rect.ts"
import type { PlaneScene } from "./scene.ts"

import { ORIGIN_FACE, TICK_LABEL_FACE } from "./faces.ts"
import { layoutGrid } from "./grid.ts"
import { paintAnnotation } from "./paint/annotations.ts"
import { paintCurve } from "./paint/curve.ts"
import { paintGrid } from "./paint/grid.ts"
import { paintGuides } from "./paint/guides.ts"
import { paintHandleHalos, paintHandles } from "./paint/handles.ts"
import { paintMarker, paintWas } from "./paint/markers.ts"
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
  /** The scene's marks laid out (marks.ts): annotations, handles, guides, drop lines, tags, points. */
  marks: MarksLayout
  /** Chrome boxes the tick labels stay out of. */
  keepOut: readonly Rect[]
}

// The painter pipeline, back to front (figma0 fvDrawCanvas): grid and axes
// with their labels (skipping those under a tag), the back curves, the
// annotations under the curve, the other curves, the handles' halos, the
// annotations over the curve, the handles, the pointer guides and drop
// lines, the axis tags, then each point in order: where it was, its edge
// marker or its marker, and its label. The DOM chrome sits above. Returns
// the grid it laid out (null for an empty plane).
export const drawCartesianPlane = (props: DrawCartesianPlaneProps): GridLayout | null => {
  const { ctx, themeVars, width, height, dpr, scene, marks } = props
  if (width === 0 || height === 0) {
    return null
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
  ctx.save()
  ctx.globalAlpha = Math.max(0, Math.min(1, scene.gridAlpha ?? 1))
  paintGrid(ctx, grid, themeVars, vp)
  ctx.restore()
  const curves = (back: boolean) => {
    for (const curve of scene.curves) {
      if ((curve.back === true) === back) {
        paintCurve(ctx, vp, curve, themeVars, dpr)
      }
    }
  }
  const annotations = (layer: "under" | "over") => {
    for (const annotation of marks.annotations) {
      if (annotation.layer === layer) {
        paintAnnotation(ctx, annotation, themeVars)
      }
    }
  }
  curves(true)
  annotations("under")
  curves(false)
  paintHandleHalos(ctx, marks.handles, themeVars)
  annotations("over")
  paintHandles(ctx, marks.handles, themeVars)
  paintGuides(ctx, marks, themeVars, height)
  for (const tag of marks.tags) {
    paintPlate(ctx, tag, themeVars)
  }
  for (const layer of marks.points) {
    if (layer.was !== null) {
      paintWas(ctx, layer.was, themeVars)
    }
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
  return grid
}
