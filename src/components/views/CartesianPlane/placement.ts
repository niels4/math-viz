import type { GlyphDirection } from "#src/components/ui/glyphPaths.ts"

import type { Rect } from "./rect.ts"
import type { Viewport } from "./viewport.ts"

import { inflate, intersects } from "./rect.ts"
import { toMathX, toScreenY } from "./viewport.ts"

// Where the plane's plates go (figma0 prelude-fv.js: fvPlace, fvDrawCanvas).
// Pure: boxes in the plane's CSS pixels, so the rules test without a canvas.

/** A curve as screen points, broken where it has no value. */
export type Polyline = readonly { x: number; y: number }[]

/** Sample spacing for collision tests, in px (figma0's fvCurvePts samples about every 2 px). */
const SAMPLE_PX = 2
/** Off-view values clamp this far past the edges: far enough that no plate inside the plane is near. */
const BAND_PX = 100

/** The curve on screen, sampled every 2 px across the plane. */
export const curvePolylines = (vp: Viewport, fn: (x: number) => number): Polyline[] => {
  const lines: { x: number; y: number }[][] = []
  let line: { x: number; y: number }[] = []
  for (let px = 0; px < vp.width + SAMPLE_PX; px += SAMPLE_PX) {
    const x = Math.min(px, vp.width)
    const y = fn(toMathX(vp, x))
    if (!Number.isFinite(y)) {
      if (line.length > 1) {
        lines.push(line)
      }
      line = []
      continue
    }
    line.push({ x, y: Math.min(vp.height + BAND_PX, Math.max(-BAND_PX, toScreenY(vp, y))) })
  }
  if (line.length > 1) {
    lines.push(line)
  }
  return lines
}

/** Whether the segment from (x1, y1) to (x2, y2) meets the box (Liang–Barsky clipping). */
export const segmentMeetsRect = (x1: number, y1: number, x2: number, y2: number, r: Rect): boolean => {
  const dx = x2 - x1
  const dy = y2 - y1
  let t0 = 0
  let t1 = 1
  // One clip per box side: p is the segment's motion toward the outside, q its distance inside.
  for (const [p, q] of [
    [-dx, x1 - r.x],
    [dx, r.x + r.w - x1],
    [-dy, y1 - r.y],
    [dy, r.y + r.h - y1],
  ] as const) {
    if (p === 0) {
      if (q < 0) {
        return false
      }
      continue
    }
    const t = q / p
    if (p < 0) {
      t0 = Math.max(t0, t)
    } else {
      t1 = Math.min(t1, t)
    }
    if (t0 > t1) {
      return false
    }
  }
  return true
}

/** Whether any curve passes within `margin` px of the box. */
export const curvesMeet = (box: Rect, curves: readonly Polyline[], margin: number): boolean => {
  const r = inflate(box, margin)
  return curves.some((line) =>
    line.some((a, i) => {
      const b = line[i + 1]
      return b !== undefined && segmentMeetsRect(a.x, a.y, b.x, b.y, r)
    }),
  )
}

/** Candidate directions in order: right-up, left-up, right-down, left-down, then the four sides. */
const DIRECTIONS = [
  [1, -1],
  [-1, -1],
  [1, 1],
  [-1, 1],
  [1, 0],
  [-1, 0],
  [0, -1],
  [0, 1],
] as const
/** Rings beyond the gap: 22, 48 and 82 px for point labels. */
const RINGS = [0, 26, 60] as const
/** Vertical offsets are this share of the ring. */
const RING_Y = 0.6
/** Plates keep this far inside the plane's edges. */
const EDGE_MARGIN = 12
/** And this far clear of the curves they avoid. */
const CURVE_CLEAR = 6

export type PlaceOptions = {
  /** First ring's distance from the anchor: 22 for point labels, 10 for plates and tags. */
  gap: number
  curves: readonly Polyline[]
  obstacles: readonly Rect[]
  width: number
  height: number
}

/**
 * fvPlace: the first box of size w × h beside (cx, cy) that stays inside the
 * plane, clear of the curves and the obstacles, trying eight directions on
 * three rings. Nowhere clear, it sits up-right on the first ring, kept inside.
 */
export const placeBeside = (cx: number, cy: number, w: number, h: number, opts: PlaceOptions): Rect => {
  const { gap, curves, obstacles, width, height } = opts
  for (const extra of RINGS) {
    const ring = gap + extra
    for (const [dx, dy] of DIRECTIONS) {
      const box = {
        x: dx > 0 ? cx + ring : dx < 0 ? cx - ring - w : cx - w / 2,
        y: dy > 0 ? cy + ring * RING_Y : dy < 0 ? cy - ring * RING_Y - h : cy - h / 2,
        w,
        h,
      }
      const inside =
        box.x >= EDGE_MARGIN &&
        box.y >= EDGE_MARGIN &&
        box.x + w <= width - EDGE_MARGIN &&
        box.y + h <= height - EDGE_MARGIN
      if (inside && !curvesMeet(box, curves, CURVE_CLEAR) && !obstacles.some((o) => intersects(box, o))) {
        return box
      }
    }
  }
  return {
    x: clamp(cx + gap, EDGE_MARGIN, width - EDGE_MARGIN - w),
    y: clamp(cy - gap - h, EDGE_MARGIN, height - EDGE_MARGIN - h),
    w,
    h,
  }
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(Math.max(v, lo), Math.max(lo, hi))

/** An off-view point's edge marker points the way it lies furthest past the view; null while in view. */
export const edgeDirection = (
  sx: number,
  sy: number,
  width: number,
  height: number,
): GlyphDirection | null => {
  const overX = sx < 0 ? -sx : sx > width ? sx - width : 0
  const overY = sy < 0 ? -sy : sy > height ? sy - height : 0
  if (overX === 0 && overY === 0) {
    return null
  }
  return overY >= overX ? (sy < 0 ? "up" : "down") : sx < 0 ? "left" : "right"
}

/** Along its edge, an edge marker stays this far from the corners. */
const EDGE_CORNER = 24
/** It sits this far in from its edge, level with the chrome's plates. */
const EDGE_INSET = 22
/** Meeting a chrome plate, it steps inward this far past it (figma0: H − 84, above the tools). */
const EDGE_CHROME_GAP = 26

/**
 * edge-marker-fv's box: on the edge `dir` points at, at the point's x (or
 * y) clamped 24 px from the corners, stepped inward past any chrome plate it
 * would cover.
 */
export const edgeMarkerBox = (
  dir: GlyphDirection,
  at: { x: number; y: number },
  size: { w: number; h: number },
  plane: { width: number; height: number },
  chrome: readonly Rect[],
): Rect => {
  const { w, h } = size
  const { width, height } = plane
  const alongX = clamp(at.x - w / 2, EDGE_CORNER, width - EDGE_CORNER - w)
  const alongY = clamp(at.y - h / 2, EDGE_CORNER, height - EDGE_CORNER - h)
  let box: Rect =
    dir === "up"
      ? { x: alongX, y: EDGE_INSET, w, h }
      : dir === "down"
        ? { x: alongX, y: height - EDGE_INSET - h, w, h }
        : dir === "left"
          ? { x: EDGE_INSET, y: alongY, w, h }
          : { x: width - EDGE_INSET - w, y: alongY, w, h }
  for (let pass = 0; pass < chrome.length; pass++) {
    const plate = chrome.find((c) => intersects(box, c))
    if (plate === undefined) {
      break
    }
    box =
      dir === "up"
        ? { ...box, y: plate.y + plate.h + EDGE_CHROME_GAP }
        : dir === "down"
          ? { ...box, y: plate.y - EDGE_CHROME_GAP - h }
          : dir === "left"
            ? { ...box, x: plate.x + plate.w + EDGE_CHROME_GAP }
            : { ...box, x: plate.x - EDGE_CHROME_GAP - w }
  }
  return box
}

/** A point this close to the x-axis puts its x tag below the axis (FV 10: tags flip sides). */
const HUG_X_AXIS = 30
const BELOW_AXIS = 16
/** A point this close to the y-axis puts its y tag beside the axis, on the far side. */
const HUG_Y_AXIS = 44
const BESIDE_AXIS = 6
/** With its axis out of view, a tag stays this far inside the nearest edge, like the tick labels. */
const TAG_EDGE = 8

/**
 * axis-tag-fv on the x-axis: centred on the point's x, centred on the axis,
 * or below it when the point sits on the axis (the tag would cover it).
 */
export const xTagBox = (
  sx: number,
  sy: number,
  originY: number,
  size: { w: number; h: number },
  height: number,
): Rect => {
  const { w, h } = size
  const inView = originY >= 0 && originY <= height
  const y = !inView
    ? clamp(originY, TAG_EDGE + h / 2, height - TAG_EDGE - h / 2) - h / 2
    : Math.abs(sy - originY) < HUG_X_AXIS
      ? originY + BELOW_AXIS
      : originY - h / 2
  return { x: sx - w / 2, y, w, h }
}

/**
 * axis-tag-fv on the y-axis: centred on the axis at the point's y, or beside
 * the axis on the far side when the point hugs it.
 */
export const yTagBox = (
  sx: number,
  sy: number,
  originX: number,
  size: { w: number; h: number },
  width: number,
): Rect => {
  const { w, h } = size
  const inView = originX >= 0 && originX <= width
  const x = !inView
    ? clamp(originX, TAG_EDGE + w / 2, width - TAG_EDGE - w / 2) - w / 2
    : Math.abs(sx - originX) < HUG_Y_AXIS
      ? sx > originX
        ? originX - w - BESIDE_AXIS
        : originX + BESIDE_AXIS
      : originX - w / 2
  return { x, y: sy - h / 2, w, h }
}

/** A drag's tag on the x-axis sits this far under it (fvDrawCanvas: the anchor's h tag at OY + 16). */
const DRAG_TAG_BELOW = 16
/** A drag's tag on the y-axis ends this far left of it (the anchor's k tag at OX − 8 − w). */
const DRAG_TAG_BESIDE = 8
/** A handle's grab halo: a drag's tag takes the axis's far side rather than cover it. */
const HANDLE_HALO = 44

const haloBox = (at: { x: number; y: number }): Rect => ({
  x: at.x - HANDLE_HALO / 2,
  y: at.y - HANDLE_HALO / 2,
  w: HANDLE_HALO,
  h: HANDLE_HALO,
})

/** A box kept 8 px inside the plane, like the tick labels and tags (TAG_EDGE). */
const keptInside = (box: Rect, width: number, height: number): Rect => ({
  ...box,
  x: clamp(box.x, TAG_EDGE, width - TAG_EDGE - box.w),
  y: clamp(box.y, TAG_EDGE, height - TAG_EDGE - box.h),
})

/**
 * A drag's tag beside the x-axis, centred on sx: under the axis, or over it
 * when under it would cover the halo of the handle at `clear` (screen px).
 */
export const besideXAxis = (
  sx: number,
  originY: number,
  size: { w: number; h: number },
  plane: { width: number; height: number },
  clear: { x: number; y: number },
): Rect => {
  const { w, h } = size
  const below = { x: sx - w / 2, y: originY + DRAG_TAG_BELOW, w, h }
  const above = { x: sx - w / 2, y: originY - DRAG_TAG_BELOW - h, w, h }
  const halo = haloBox(clear)
  const box = intersects(below, halo) && !intersects(above, halo) ? above : below
  return keptInside(box, plane.width, plane.height)
}

/**
 * A drag's tag beside the y-axis, centred on sy: left of the axis, or right
 * of it when left would cover the halo of the handle at `clear` (screen px).
 */
export const besideYAxis = (
  sy: number,
  originX: number,
  size: { w: number; h: number },
  plane: { width: number; height: number },
  clear: { x: number; y: number },
): Rect => {
  const { w, h } = size
  const left = { x: originX - DRAG_TAG_BESIDE - w, y: sy - h / 2, w, h }
  const right = { x: originX + DRAG_TAG_BESIDE, y: sy - h / 2, w, h }
  const halo = haloBox(clear)
  const box = intersects(left, halo) && !intersects(right, halo) ? right : left
  return keptInside(box, plane.width, plane.height)
}

/** A plate centred `gap` px above (cx, cy), kept inside the plane like fvPlace's (h's annotation). */
export const placeAbove = (
  cx: number,
  cy: number,
  size: { w: number; h: number },
  gap: number,
  plane: { width: number; height: number },
): Rect => ({
  x: clamp(cx - size.w / 2, EDGE_MARGIN, plane.width - EDGE_MARGIN - size.w),
  y: clamp(cy - gap - size.h, EDGE_MARGIN, plane.height - EDGE_MARGIN - size.h),
  w: size.w,
  h: size.h,
})
