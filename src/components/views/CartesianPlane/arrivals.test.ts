import { describe, expect, it } from "vitest"

import { easeEnter } from "#src/util/motion/motion.ts"

import type { EdgeArrival } from "./arrivals.ts"
import type { MarksLayout, PointLayer } from "./marks.ts"
import type { Plate } from "./plates.ts"

import { arriveEdges, edgeArrival } from "./arrivals.ts"
import { NO_MARKS } from "./marks.ts"

const plate: Plate = {
  box: { x: 400, y: 22, w: 118, h: 39 },
  radius: 19.5,
  fill: "card",
  border: { ink: "chartPoint1", width: 2 },
  runs: [],
}

const layer = (id: string, edge: Plate | null): PointLayer => ({
  id,
  was: null,
  marker: null,
  label: null,
  edge,
  edgeDir: edge === null ? null : "up",
})

const marksWith = (...points: PointLayer[]): MarksLayout => ({ ...NO_MARKS, points })

describe("edgeArrival (FV 05 › P leaves the view)", () => {
  it("slides 8 px in from the edge on the enter spring, 160 ms", () => {
    expect(edgeArrival("up", 0, false)).toEqual({ alpha: 0, dx: 0, dy: -8 })
    const mid = edgeArrival("down", 80, false)
    const e = easeEnter.ease(0.5)
    expect(mid?.alpha).toBeCloseTo(Math.min(1, e), 9)
    expect(mid?.dy).toBeCloseTo(8 * (1 - e), 9)
    expect(edgeArrival("left", 40, false)?.dx).toBeLessThan(0)
    expect(edgeArrival("right", 40, false)?.dx).toBeGreaterThan(0)
    expect(edgeArrival("up", 160, false)).toBeNull()
  })

  it("only fades, 120 ms, under reduced motion", () => {
    expect(edgeArrival("up", 60, true)).toEqual({ alpha: 0.5, dx: 0, dy: 0 })
    expect(edgeArrival("up", 120, true)).toBeNull()
  })
})

describe("arriveEdges", () => {
  it("times each marker from when it appears and forgets it once gone", () => {
    const arrivals = new Map<string, EdgeArrival>()
    const first = arriveEdges(marksWith(layer("p", plate), layer("q", null)), arrivals, 1000, false)
    expect(first.arriving).toBe(true)
    expect(first.marks.points[0]?.edge?.motion).toEqual({ alpha: 0, dx: 0, dy: -8 })
    expect(first.marks.points[0]?.edge?.box).toEqual(plate.box)
    expect(first.marks.points[1]?.edge).toBeNull()

    const later = arriveEdges(marksWith(layer("p", plate)), arrivals, 1100, false)
    expect(later.marks.points[0]?.edge?.motion?.alpha).toBeCloseTo(Math.min(1, easeEnter.ease(100 / 160)), 9)

    const rested = arriveEdges(marksWith(layer("p", plate)), arrivals, 1160, false)
    expect(rested.arriving).toBe(false)
    expect(rested.marks.points[0]?.edge).toBe(plate)

    arriveEdges(marksWith(layer("p", null)), arrivals, 1200, false)
    expect(arrivals.size).toBe(0)
    const again = arriveEdges(marksWith(layer("p", plate)), arrivals, 5000, false)
    expect(again.arriving).toBe(true)
  })

  it("fades on top of the point's own fade", () => {
    const arrivals = new Map<string, EdgeArrival>()
    const faded = { ...plate, motion: { alpha: 0.5, dx: 0, dy: 0 } }
    const out = arriveEdges(marksWith(layer("p", faded)), arrivals, 0, true)
    arriveEdges(marksWith(layer("p", faded)), arrivals, 0, true)
    const half = arriveEdges(marksWith(layer("p", faded)), arrivals, 60, true)
    expect(out.marks.points[0]?.edge?.motion?.alpha).toBe(0)
    expect(half.marks.points[0]?.edge?.motion?.alpha).toBeCloseTo(0.25, 9)
  })
})
