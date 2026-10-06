import { describe, expect, it } from "vitest"

import { curveTrace, shareAtX, traceUpTo } from "./trace.ts"
import { makeViewport } from "./viewport.ts"

// A 100 × 100 plane at 10 px per unit: the origin at (50, 50), x and y from −5 to 5.
const SMALL = makeViewport({ width: 100, height: 100, dpr: 1 }, { zoom: 10, panX: 0, panY: 0 })
// R2's plane: 936 × 792 at 50 px per unit.
const R2 = makeViewport({ width: 936, height: 792, dpr: 1 }, { zoom: 50, panX: 0, panY: 0 })

describe("curveTrace", () => {
  it("measures only what draws inside the plane", () => {
    // y = x crosses the plane corner to corner: 100 px across, 100 down.
    const trace = curveTrace(SMALL, (x) => x)
    expect(trace.length).toBeCloseTo(100 * Math.SQRT2, 9)
    // Two samples past each edge, one per px, outside the plane's length.
    expect(trace.samples).toHaveLength(105)
    expect(trace.samples[0]).toMatchObject({ x: -2, y: 102, at: 0, start: true })
    expect(trace.samples.at(-1)?.at).toBeCloseTo(100 * Math.SQRT2, 9)
  })

  it("spends no length above the plane (x² leaves through the top)", () => {
    const trace = curveTrace(R2, (x) => x * x)
    // Symmetric about the y-axis: half the length is drawn at x = 0.
    expect(shareAtX(trace, 468)).toBeCloseTo(0.5, 3)
    // The arms above the top cost nothing: at px 300 (x = −3.36, y = 11.3,
    // above the plane) the pen has drawn no length yet.
    expect(shareAtX(trace, 300)).toBe(0)
  })

  it("lifts the pen where the function breaks", () => {
    const trace = curveTrace(SMALL, (x) => (x === 0 ? Number.NaN : 1 / x))
    const starts = trace.samples.filter((s) => s.start).map((s) => s.x)
    expect(starts).toEqual([-2, 51])
  })
})

describe("traceUpTo", () => {
  const line = curveTrace(SMALL, (x) => x)

  it("cuts the pen where the share of the length ends", () => {
    const half = traceUpTo(line, 0.5)
    const last = half.at(-1)
    expect(last?.x).toBeCloseTo(50, 6)
    expect(last?.y).toBeCloseTo(50, 6)
    expect(last?.at).toBeCloseTo(50 * Math.SQRT2, 6)
  })

  it("draws nothing at 0 and everything at 1", () => {
    expect(traceUpTo(line, 0)).toEqual([])
    expect(traceUpTo(line, 1)).toBe(line.samples)
  })

  it("never bridges a break", () => {
    // y = 1 left of 0 (screen y 40), −1 right of it (60), no value at 0: two runs of 51 px.
    const step = curveTrace(SMALL, (x) => (x < 0 ? 1 : x > 0 ? -1 : Number.NaN))
    expect(step.length).toBe(102)
    expect(traceUpTo(step, 0.25).every((s) => s.y === 40)).toBe(true)
    const across = traceUpTo(step, 0.75)
    const firstRight = across.findIndex((s) => s.y === 60)
    expect(across[firstRight]).toMatchObject({ x: 51, start: true })
    expect(across[firstRight - 1]?.x).toBe(49)
    expect(across.at(-1)).toMatchObject({ x: 76.5, y: 60, at: 76.5 })
  })
})

describe("shareAtX", () => {
  it("says how far the pen has drawn when it reaches an x", () => {
    const line = curveTrace(SMALL, (x) => x)
    expect(shareAtX(line, 25)).toBeCloseTo(0.25, 9)
    expect(shareAtX(line, -50)).toBe(0)
    expect(shareAtX(line, 500)).toBe(1)
  })

  it("lands everything at once when nothing shows", () => {
    const above = curveTrace(SMALL, () => 1000)
    expect(above.length).toBe(0)
    expect(shareAtX(above, 50)).toBe(1)
    expect(traceUpTo(above, 0.5)).toEqual([])
  })
})
