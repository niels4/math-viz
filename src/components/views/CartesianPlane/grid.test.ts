import { describe, expect, it } from "vitest"

import type { GridLayout } from "./grid.ts"

import { gridLines, gridSteps, layoutGrid } from "./grid.ts"
import { makeViewport } from "./viewport.ts"

// Roboto Mono advances 0.6 em: 8.4 px per character at 14 px.
const labelWidth = (text: string) => text.length * 8.4
const originWidth = 11

const layout = (
  width: number,
  height: number,
  zoom: number,
  pan: { panX?: number; panY?: number } = {},
  keepOut: { x: number; y: number; w: number; h: number }[] = [],
): GridLayout =>
  layoutGrid(makeViewport({ width, height, dpr: 1 }, { zoom, panX: pan.panX ?? 0, panY: pan.panY ?? 0 }), {
    labelWidth,
    originWidth,
    keepOut,
  })

const texts = (grid: GridLayout, axis: "x" | "y") =>
  grid.labels.filter((l) => l.axis === axis).map((l) => l.text)
const label = (grid: GridLayout, axis: "x" | "y", text: string) =>
  grid.labels.find((l) => l.axis === axis && l.text === text)

describe("gridSteps", () => {
  it("puts minor lines on the 1-2-5 step ≥ 20 px and majors on the next step", () => {
    expect(gridSteps(50)).toEqual({ minor: 0.5, major: 1 })
    expect(gridSteps(40)).toEqual({ minor: 0.5, major: 1 })
    expect(gridSteps(100)).toEqual({ minor: 0.2, major: 0.5 })
    expect(gridSteps(20)).toEqual({ minor: 1, major: 2 })
    // FV 10 X2, zoomed out to 2 px per unit: lines every 10, labels every 20.
    expect(gridSteps(2)).toEqual({ minor: 10, major: 20 })
    expect(gridSteps(0.25)).toEqual({ minor: 100, major: 200 })
  })
})

describe("layoutGrid", () => {
  it("lays out R2's plane: 936 × 792 at 50 px per unit", () => {
    const grid = layout(936, 792, 50)
    expect([grid.axisX, grid.axisY]).toEqual([396, 468])
    expect(texts(grid, "x")).toEqual(
      [-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => String(n).replace("-", "−")),
    )
    expect(texts(grid, "y")).toEqual(
      [-7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7].map((n) => String(n).replace("-", "−")),
    )
    // Minor lines every 25 px between the majors, none on the axes.
    expect(grid.majorX).toContain(518)
    expect(grid.minorX).toContain(493)
    expect(grid.minorX).not.toContain(468)
    expect(grid.ticksX).toHaveLength(18)
    expect(grid.ticksY).toHaveLength(14)
  })

  it("places labels and the O as the design's boxes", () => {
    const grid = layout(936, 792, 50)
    const x1 = label(grid, "x", "1")
    // x labels: centred on the tick, top 9 px below the axis (snapshot: x −9 at 9.5, 405).
    expect(x1?.box.x).toBeCloseTo(518 - 4.2)
    expect(x1?.box.y).toBe(405)
    const ym7 = label(grid, "y", "−7")
    // y labels: right edge 10 px left of the axis, centred on the line.
    expect((ym7?.box.x ?? 0) + (ym7?.box.w ?? 0)).toBe(458)
    expect((ym7?.box.y ?? 0) + (ym7?.box.h ?? 0) / 2).toBeCloseTo(746)
    // O: right edge 8 px left of the y-axis, top 5 px below the x-axis.
    expect(grid.origin).toMatchObject({ x: 449, y: 401, w: 11 })
  })

  it("lays out R9's dock plane: 1256 × 408 at 40 px per unit", () => {
    const grid = layout(1256, 408, 40)
    expect(texts(grid, "x")).toHaveLength(30)
    expect(texts(grid, "x")[0]).toBe("−15")
    expect(texts(grid, "y")).toEqual(["−4", "−3", "−2", "−1", "1", "2", "3", "4"])
  })

  it("skips labels under a keep-out box", () => {
    // A tag over x = −2 … −1 (R2's Q tag on x at −1.5).
    const grid = layout(936, 792, 50, {}, [{ x: 364.5, y: 382, w: 57, h: 28 }])
    expect(texts(grid, "x")).not.toContain("−2")
    expect(texts(grid, "x")).not.toContain("−1")
    expect(texts(grid, "x")).toContain("−3")
  })

  it("keeps labels on the edge nearest an axis out of view", () => {
    // The x-axis above the top edge: labels along the top, no ticks, no O.
    const above = layout(936, 792, 50, { panY: 10 })
    expect(above.axisX).toBeNull()
    expect(above.ticksX).toEqual([])
    expect(above.origin).toBeNull()
    expect(label(above, "x", "1")?.box.y).toBe(8)
    // The y-axis left of the plane: labels left-aligned 8 px from the left edge.
    const left = layout(936, 792, 50, { panX: -12 })
    expect(left.axisY).toBeNull()
    expect(label(left, "y", "3")?.box.x).toBe(8)
  })

  it("moves x labels above the axis when it runs along the bottom edge", () => {
    // Origin 10 px above the bottom: no room for a label row below the axis.
    const grid = layout(936, 792, 50, { panY: -7.72 })
    expect(grid.axisX).toBe(782)
    const x1 = label(grid, "x", "1")
    expect((x1?.box.y ?? 0) + (x1?.box.h ?? 0)).toBeCloseTo(782 - 9)
  })
})

describe("gridLines", () => {
  it("draws a mini plot's grid on fixed steps: FV 02's 268 × 124 at 22 px per unit, minor 1, major 5", () => {
    const vp = { width: 268, height: 124, zoom: 22, originX: 134, originY: 112 }
    const lines = gridLines(vp, { minor: 1, major: 5 })
    expect(lines.majorX).toEqual([24, 244])
    expect(lines.minorX).toEqual([2, 46, 68, 90, 112, 156, 178, 200, 222, 266])
    // y = 1 … 4 minor, y = 5 major; nothing on the axes.
    expect(lines.minorY).toEqual([90, 68, 46, 24])
    expect(lines.majorY).toEqual([2])
    expect([lines.axisX, lines.axisY]).toEqual([112, 134])
  })
})
