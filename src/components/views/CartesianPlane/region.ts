import type { GridLabel } from "./grid.ts"
import type { MarksLayout } from "./marks.ts"
import type { Rect } from "./rect.ts"
import type { PlaneCurve, PlaneScene } from "./scene.ts"
import type { Viewport } from "./viewport.ts"

import { toMathX, toScreenY } from "./viewport.ts"

// Where named parts of a scene sit on the plane, as last drawn: what an
// owner points at from outside the plane (a tour's spotlight). Pure, in
// plane pixels.

/** A marker's knock-out disc covers this far around its point (Ø24). */
const MARKER_HALF = 12

/** What the plane drew last: the questions below read it. */
export type DrawnPlane = {
  vp: Viewport
  scene: PlaneScene
  marks: MarksLayout
  /** The tick labels as laid out (grid.ts). */
  labels: readonly GridLabel[]
}

const union = (a: Rect | null, b: Rect): Rect => {
  if (a === null) {
    return b
  }
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y }
}

const clip = (r: Rect, width: number, height: number): Rect | null => {
  const x = Math.max(0, r.x)
  const y = Math.max(0, r.y)
  const w = Math.min(width, r.x + r.w) - x
  const h = Math.min(height, r.y + r.h) - y
  return w > 0 && h > 0 ? { x, y, w, h } : null
}

/** A curve's visible part with its stroke: one sample per px across the plane, those inside it. */
export const curveBox = (vp: Viewport, curve: PlaneCurve): Rect | null => {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (let px = 0; px <= vp.width; px++) {
    const sy = toScreenY(vp, curve.fn(toMathX(vp, px)))
    if (!Number.isFinite(sy) || sy < 0 || sy > vp.height) {
      continue
    }
    minX = Math.min(minX, px)
    maxX = Math.max(maxX, px)
    minY = Math.min(minY, sy)
    maxY = Math.max(maxY, sy)
  }
  if (minX > maxX) {
    return null
  }
  const half = curve.width / 2
  return { x: minX - half, y: minY - half, w: maxX - minX + curve.width, h: maxY - minY + curve.width }
}

const centre = (r: Rect, axis: "x" | "y"): number => (axis === "x" ? r.x + r.w / 2 : r.y + r.h / 2)

/**
 * The box the named curves and points cover on the plane: a curve's visible
 * part, a point's marker and label (or its edge marker while off the view).
 * The tick labels along an axis that crosses that box join it, where they
 * sit within its span: they read the part's values. Clipped to the plane;
 * null when nothing named shows.
 */
export const regionOf = (drawn: DrawnPlane, ids: readonly string[]): Rect | null => {
  const { vp, scene, marks } = drawn
  let box: Rect | null = null
  for (const curve of scene.curves) {
    const b = ids.includes(curve.id) ? curveBox(vp, curve) : null
    if (b !== null) {
      box = union(box, b)
    }
  }
  for (const layer of marks.points) {
    if (!ids.includes(layer.id)) {
      continue
    }
    if (layer.marker !== null) {
      const { x, y } = layer.marker
      box = union(box, { x: x - MARKER_HALF, y: y - MARKER_HALF, w: 2 * MARKER_HALF, h: 2 * MARKER_HALF })
    }
    for (const plate of [layer.label, layer.edge]) {
      if (plate !== null) {
        box = union(box, plate.box)
      }
    }
  }
  if (box === null) {
    return null
  }
  const marked: Rect = box
  for (const label of drawn.labels) {
    const crosses =
      label.axis === "x"
        ? vp.originY >= marked.y && vp.originY <= marked.y + marked.h
        : vp.originX >= marked.x && vp.originX <= marked.x + marked.w
    const along = centre(label.box, label.axis)
    const [from, size] = label.axis === "x" ? [marked.x, marked.w] : [marked.y, marked.h]
    if (crosses && along >= from && along <= from + size) {
      box = union(box, label.box)
    }
  }
  return clip(box, vp.width, vp.height)
}
