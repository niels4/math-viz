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
  /** First ring's distance from the anchor: 22 for point labels. */
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

/**
 * A label that holds its place (the user's rulings for P, 2026-10-07, and Q, 2026-10-08):
 * fvPlace's first spot, up-right of (cx, cy), its left edge `gap` px right of
 * it and its bottom edge 0.6 × gap above it, whatever the curves and the marks
 * around it do, so its text grows away from the point. It moves only to stay
 * in view, and only as far as that takes: 12 px inside the plane's edges, and
 * off the chrome's plates, which hide the plane under them, out across a
 * plate's thin side, away from the plane's edge the plate sits on (down from
 * the caption, up from the scale bar). Where a corner's two edges both hold
 * it, it covers the point.
 */
export const placeFixed = (
  cx: number,
  cy: number,
  w: number,
  h: number,
  opts: { gap: number; chrome: readonly Rect[]; width: number; height: number },
): Rect => {
  const { gap, chrome, width, height } = opts
  const inside = (box: Rect): Rect => ({
    x: clamp(box.x, EDGE_MARGIN, width - EDGE_MARGIN - w),
    y: clamp(box.y, EDGE_MARGIN, height - EDGE_MARGIN - h),
    w,
    h,
  })
  let box = inside({ x: cx + gap, y: cy - gap * RING_Y - h, w, h })
  for (const plate of chrome) {
    if (!intersects(box, plate)) {
      continue
    }
    box =
      plate.w >= plate.h
        ? { ...box, y: plate.y + plate.h / 2 < height / 2 ? plate.y + plate.h : plate.y - h }
        : { ...box, x: plate.x + plate.w / 2 < width / 2 ? plate.x + plate.w : plate.x - w }
  }
  return inside(box)
}

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
