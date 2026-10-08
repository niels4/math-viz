import { describe, expect, it } from "vitest"

import type { Polyline } from "./placement.ts"
import type { Rect } from "./rect.ts"

import {
  curvePolylines,
  curvesMeet,
  edgeDirection,
  edgeMarkerBox,
  placeBeside,
  placeFixed,
  segmentMeetsRect,
  xTagBox,
  yTagBox,
} from "./placement.ts"
import { makeViewport } from "./viewport.ts"

// R2's plane (figma0 FV · Recommended › Key states): 936 × 792 at 50 px per
// unit, the origin at (468, 396).
const R2 = makeViewport({ width: 936, height: 792, dpr: 1 }, { zoom: 50, panX: 0, panY: 0 })
const PLANE = { width: 936, height: 792 }
const x2: Polyline[] = curvePolylines(R2, (x) => x * x)

describe("curvePolylines", () => {
  it("samples the curve every 2 px across the plane, clamped near the view", () => {
    const [line] = x2
    // x = −9.36 is far above the view: held 100 px past the top edge.
    expect(line?.[0]).toEqual({ x: 0, y: -100 })
    expect(line?.find((p) => p.x === 568)).toEqual({ x: 568, y: 196 })
    expect(line?.at(-1)?.x).toBe(936)
    expect(line?.at(-2)?.x).toBe(934)
  })

  it("breaks where the curve has no value", () => {
    const lines = curvePolylines(R2, (x) => (x > 0 ? Math.log(x) : Number.NaN))
    expect(lines).toHaveLength(1)
    expect(lines[0]?.[0]?.x).toBeGreaterThan(468)
  })
})

describe("segmentMeetsRect", () => {
  const box = { x: 10, y: 10, w: 10, h: 10 }

  it("finds segments that cross, enter or lie inside the box", () => {
    expect(segmentMeetsRect(0, 15, 30, 15, box)).toBe(true)
    expect(segmentMeetsRect(0, 0, 15, 15, box)).toBe(true)
    expect(segmentMeetsRect(12, 12, 14, 14, box)).toBe(true)
  })

  it("misses segments that pass by", () => {
    expect(segmentMeetsRect(0, 0, 30, 5, box)).toBe(false)
    expect(segmentMeetsRect(0, 30, 30, 21, box)).toBe(false)
    expect(segmentMeetsRect(25, 0, 25, 30, box)).toBe(false)
  })
})

describe("placeBeside (fvPlace)", () => {
  it("puts R2's P label up-right of P, 22 px out", () => {
    // P (2, 4) at (568, 196); "P (2, 4)" is 108 × 41.
    const box = placeBeside(568, 196, 108, 41, { gap: 22, curves: x2, obstacles: [], ...PLANE })
    expect(box.x).toBe(590)
    expect(box.y).toBeCloseTo(141.8, 9)
  })

  it("puts R2's Q label down-left: the curve takes the three quadrants before it", () => {
    // Q (−1.5, 2.25) at (393, 283.5); "Q (−1.5, 2.25)" is 172 × 41.
    const box = placeBeside(393, 283.5, 172, 41, { gap: 22, curves: x2, obstacles: [], ...PLANE })
    expect(box.x).toBe(199)
    expect(box.y).toBeCloseTo(296.7, 9)
  })

  it("keeps clear of obstacles and of the plane's edges", () => {
    const blocked = { x: 580, y: 100, w: 150, h: 60 }
    const box = placeBeside(568, 196, 108, 41, { gap: 22, curves: [], obstacles: [blocked], ...PLANE })
    // Right-up is taken: left-up is next.
    expect(box).toMatchObject({ x: 568 - 22 - 108 })
    const corner = placeBeside(20, 20, 108, 41, { gap: 22, curves: [], obstacles: [], ...PLANE })
    expect(corner.x).toBeGreaterThanOrEqual(12)
    expect(corner.y).toBeGreaterThanOrEqual(12)
  })

  it("falls back up-right, inside the plane, when nothing is clear", () => {
    const all = { x: 0, y: 0, w: 936, h: 792 }
    const box = placeBeside(900, 30, 108, 41, { gap: 22, curves: [], obstacles: [all], ...PLANE })
    expect(box).toEqual({ x: 936 - 12 - 108, y: 12, w: 108, h: 41 })
  })
})

describe("placeFixed (P's label: the user's ruling, 2026-10-07)", () => {
  const fixed = (cx: number, cy: number, w = 169, chrome: Rect[] = []) =>
    placeFixed(cx, cy, w, 41, { gap: 22, chrome, ...PLANE })
  const rounded = (box: Rect) => ({ ...box, y: Math.round(box.y * 10) / 10 })

  it("holds up-right of the point, 22 px out, where fvPlace goes looking for a clear spot", () => {
    // R6: P (0.5, 3) at (493, 246), the curve up-right of it: fvPlace goes left.
    const r6 = curvePolylines(R2, (x) => 2 * (x - 1.5) ** 2 + 1)
    expect(placeBeside(493, 246, 169, 41, { gap: 22, curves: r6, obstacles: [], ...PLANE }).x).toBe(302)
    expect(rounded(fixed(493, 246))).toEqual({ x: 515, y: 191.8, w: 169, h: 41 })
  })

  it("keeps its edges nearest the point as its text grows", () => {
    expect(fixed(568, 196, 230)).toEqual({ ...fixed(568, 196), w: 230 })
  })

  it("moves only as far as the plane's edges make it, 12 px inside them", () => {
    // Near the right edge it slides left, near the top down; up-right of the
    // point, it never meets the left or bottom edge.
    expect(rounded(fixed(850, 400))).toEqual({ x: 936 - 12 - 169, y: 345.8, w: 169, h: 41 })
    expect(fixed(300, 30)).toMatchObject({ x: 322, y: 12 })
    expect(fixed(900, 20)).toMatchObject({ x: 755, y: 12 })
    expect(rounded(fixed(2, 790))).toMatchObject({ x: 24, y: 735.8 })
  })

  it("moves off a chrome plate across its thin side, away from the plane's edge it sits on", () => {
    // The caption (28, 22, 146 × 35) and the tools (597, 734, 311 × 36), 8 px larger.
    const caption = { x: 20, y: 14, w: 162, h: 51 }
    const tools = { x: 589, y: 726, w: 327, h: 52 }
    // Under the caption: down to its bottom. Past its end: at rest again.
    expect(fixed(60, 100, 169, [caption, tools])).toMatchObject({ x: 82, y: 65 })
    expect(rounded(fixed(200, 100, 169, [caption, tools]))).toMatchObject({ x: 222, y: 45.8 })
    // Over the tools: up to their top.
    expect(fixed(700, 780, 169, [caption, tools])).toMatchObject({ x: 722, y: 726 - 41 })
    // A tall plate at the right edge: out to its left.
    const tall = { x: 860, y: 560, w: 56, h: 218 }
    expect(rounded(fixed(700, 700, 169, [tall]))).toMatchObject({ x: 860 - 169, y: 645.8 })
  })
})

describe("curvesMeet", () => {
  it("counts the curve within the margin", () => {
    // y = x² passes (550.5, 260), 2.5 px from this box's corner: within 6 px, not touching.
    const box = { x: 500, y: 240, w: 48, h: 20 }
    expect(curvesMeet(box, x2, 6)).toBe(true)
    expect(curvesMeet(box, x2, 0)).toBe(false)
  })
})

describe("edge markers", () => {
  it("point the way an off-view point lies furthest", () => {
    expect(edgeDirection(500, 300, 936, 792)).toBeNull()
    expect(edgeDirection(568, -204, 936, 792)).toBe("up")
    expect(edgeDirection(568, 900, 936, 792)).toBe("down")
    expect(edgeDirection(-50, 300, 936, 792)).toBe("left")
    expect(edgeDirection(1000, -10, 936, 792)).toBe("right")
    expect(edgeDirection(-50, -60, 936, 792)).toBe("up")
  })

  it("sit on their edge at the point's x, 24 px from the corners (FV 10 X1: ▲ P (2, 8))", () => {
    const size = { w: 108, h: 39 }
    expect(edgeMarkerBox("up", { x: 568, y: -204 }, size, PLANE, [])).toEqual({
      x: 514,
      y: 22,
      w: 108,
      h: 39,
    })
    expect(edgeMarkerBox("up", { x: 5, y: -204 }, size, PLANE, [])).toMatchObject({ x: 24 })
    expect(edgeMarkerBox("down", { x: 930, y: 900 }, size, PLANE, [])).toMatchObject({
      x: 936 - 24 - 108,
      y: 731,
    })
    expect(edgeMarkerBox("left", { x: -40, y: 100 }, size, PLANE, [])).toEqual({
      x: 22,
      y: 80.5,
      w: 108,
      h: 39,
    })
    expect(edgeMarkerBox("right", { x: 990, y: 790 }, size, PLANE, [])).toMatchObject({
      x: 806,
      y: 792 - 24 - 39,
    })
  })

  it("step inward past a chrome plate they would cover: above the tools (figma0: H − 84)", () => {
    const tools = { x: 597, y: 734, w: 311, h: 36 }
    const box = edgeMarkerBox("down", { x: 700, y: 900 }, { w: 108, h: 39 }, PLANE, [tools])
    expect(box.y + box.h).toBe(792 - 84)
  })
})

describe("axis tags", () => {
  const tag = { w: 57, h: 28 }

  it("sit on the axes, centred on the value (R2: Q's −1.5 and 2.25)", () => {
    expect(xTagBox(393, 396, tag, 792)).toEqual({ x: 364.5, y: 382, w: 57, h: 28 })
    expect(yTagBox(393, 283.5, 468, tag, 936)).toEqual({ x: 439.5, y: 269.5, w: 57, h: 28 })
  })

  it("step a y tag off the y-axis its point hugs (FV 10: tags flip sides)", () => {
    // A point 20 px right of the y-axis: its y tag goes left of the axis.
    expect(yTagBox(488, 200, 468, tag, 936).x).toBe(468 - 57 - 6)
    expect(yTagBox(448, 200, 468, tag, 936).x).toBe(468 + 6)
  })

  it("keep an x tag 8 px inside the plane, the axis near an edge or out of view", () => {
    expect(xTagBox(300, 5, tag, 792).y).toBe(8)
    expect(xTagBox(300, -40, tag, 792).y).toBe(8)
    expect(xTagBox(300, 790, tag, 792).y).toBe(792 - 8 - 28)
    expect(yTagBox(300, 100, 2000, tag, 936).x).toBe(936 - 8 - 57)
  })
})
