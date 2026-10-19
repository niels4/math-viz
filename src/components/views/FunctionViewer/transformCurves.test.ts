import { describe, expect, it } from "vitest"

import type { PlotCurve } from "../CartesianPlane/drawCartesianPlane"

import { baseFunctions } from "./baseFunctions"
import { transformCurves } from "./transformCurves"

const square: PlotCurve = { fn: baseFunctions.x2, alpha: 1, drawTo: 1 }
const untouched = { a: 1, b: 1, h: 0, k: 0 }

describe("transformCurves", () => {
  it("with no values set, the plane shows y = x² alone", () => {
    const curves = transformCurves([square], untouched)

    expect(curves).toHaveLength(1)
    expect(curves[0]?.dashed).toBeUndefined()
    expect(curves[0]?.fn(2)).toBe(4)
  })

  it("y = 2(x − 1)² + 3 has its vertex at (1, 3), with y = x² dashed behind it", () => {
    const [original, curve] = transformCurves([square], { a: 2, b: 1, h: 1, k: 3 })

    expect(original?.dashed).toBe(true)
    expect(original?.fn(1)).toBe(1)
    expect(curve?.dashed).toBeUndefined()
    expect(curve?.fn(1)).toBe(3)
    expect(curve?.fn(2)).toBe(5)
  })

  it("b = 2 makes y = x² twice as wide, so it passes through (2, 1)", () => {
    const [, curve] = transformCurves([square], { ...untouched, b: 2 })

    expect(curve?.fn(2)).toBe(1)
  })

  it("while x² replaces y = x, each fades or draws on with its dashed original", () => {
    const line: PlotCurve = { fn: baseFunctions.x1, alpha: 0.5, drawTo: 1 }
    const drawing: PlotCurve = { ...square, drawTo: 0.25 }

    const curves = transformCurves([line, drawing], { ...untouched, k: 1 })

    expect(curves.map(({ alpha, drawTo, dashed }) => ({ alpha, drawTo, dashed }))).toEqual([
      { alpha: 0.5, drawTo: 1, dashed: true },
      { alpha: 0.5, drawTo: 1, dashed: undefined },
      { alpha: 1, drawTo: 0.25, dashed: true },
      { alpha: 1, drawTo: 0.25, dashed: undefined },
    ])
    expect(curves[1]?.fn(2)).toBe(3)
    expect(curves[3]?.fn(2)).toBe(5)
  })
})
