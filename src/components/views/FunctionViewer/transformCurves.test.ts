import { describe, expect, it } from "vitest"

import type { PlotCurve } from "../CartesianPlane/drawCartesianPlane"
import type { TransformParam } from "./state"

import { baseFunctions, unitX } from "./baseFunctions"
import { transformLines, transformCurves, unitPoint } from "./transformCurves"

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

describe("unitPoint", () => {
  it("with no values set, y = x² has its scale handle at (1, 1)", () => {
    expect(unitPoint(baseFunctions.x2, unitX.x2, untouched)).toEqual({ x: 1, y: 1 })
  })

  it("y = 2(x − 1)² + 3 has its scale handle on the curve at (2, 5)", () => {
    expect(unitPoint(baseFunctions.x2, unitX.x2, { a: 2, b: 1, h: 1, k: 3 })).toEqual({ x: 2, y: 5 })
  })

  it("sin x's scale handle sits on its peak, which b = 2 moves to x = π", () => {
    expect(unitPoint(baseFunctions.sinx, unitX.sinx, untouched)).toEqual({ x: Math.PI / 2, y: 1 })
    expect(unitPoint(baseFunctions.sinx, unitX.sinx, { ...untouched, b: 2 })).toEqual({ x: Math.PI, y: 1 })
  })
})

describe("transformLines", () => {
  const vertexAt13 = { a: 2, b: 1, h: 1, k: 3 }
  const linesOnSquare = (lit: TransformParam | null) =>
    transformLines(lit, baseFunctions.x2, unitX.x2, vertexAt13)
  const box = [
    { from: { x: 1, y: 3 }, to: { x: 2, y: 3 }, look: "dashed" },
    { from: { x: 2, y: 3 }, to: { x: 2, y: 5 }, look: "dashed" },
    { from: { x: 2, y: 5 }, to: { x: 1, y: 5 }, look: "dashed" },
    { from: { x: 1, y: 5 }, to: { x: 1, y: 3 }, look: "dashed" },
  ]

  it("while k is lit on y = 2(x − 1)² + 3, an arrow rises from the x-axis to the shift handle at (1, 3)", () => {
    expect(linesOnSquare("k")).toEqual([{ from: { x: 1, y: 0 }, to: { x: 1, y: 3 }, look: "arrow" }])
  })

  it("while h is lit on y = 2(x − 1)² + 3, an arrow runs from the y-axis to the shift handle at (1, 3)", () => {
    expect(linesOnSquare("h")).toEqual([{ from: { x: 0, y: 3 }, to: { x: 1, y: 3 }, look: "arrow" }])
  })

  it("while a is lit on y = 2(x − 1)² + 3, a dashed box joins the handles and its right side measures a = 2", () => {
    expect(linesOnSquare("a")).toEqual([
      ...box,
      { from: { x: 2, y: 3 }, to: { x: 2, y: 5 }, look: "measured" },
    ])
  })

  it("while b is lit on y = 2(x − 1)² + 3, a dashed box joins the handles and its bottom side measures b = 1", () => {
    expect(linesOnSquare("b")).toEqual([
      ...box,
      { from: { x: 1, y: 3 }, to: { x: 2, y: 3 }, look: "measured" },
    ])
  })

  it("while nothing is lit, no line shows", () => {
    expect(linesOnSquare(null)).toEqual([])
  })
})
