import { describe, expect, it } from "vitest"

import type { GridLayout, GridLine } from "./grid"

import { layoutGrid } from "./grid"

const units = (lines: GridLine[]) => lines.map((l) => l.unit)

/** Screen px of every vertical line and the y-axis, left to right. */
const xPositions = (grid: GridLayout) =>
  [...grid.minorX, ...grid.majorX]
    .map((l) => l.px)
    .concat(grid.xOrigin ?? [])
    .toSorted((a, b) => a - b)

/** Screen px of every horizontal line and the x-axis, top to bottom. */
const yPositions = (grid: GridLayout) =>
  [...grid.minorY, ...grid.majorY]
    .map((l) => l.px)
    .concat(grid.yOrigin ?? [])
    .toSorted((a, b) => a - b)

const gaps = (px: number[]) => px.slice(1).map((p, i) => p - (px[i] ?? p))

describe("layoutGrid", () => {
  it.each([
    { scale: 0.1, pxPerUnit: 250, minor: 0.1, major: 0.2, minorPx: 25 },
    { scale: 0.25, pxPerUnit: 100, minor: 0.2, major: 0.5, minorPx: 20 },
    { scale: 0.5, pxPerUnit: 50, minor: 0.5, major: 1, minorPx: 25 },
    { scale: 1, pxPerUnit: 25, minor: 1, major: 2, minorPx: 25 },
    { scale: 1.25, pxPerUnit: 20, minor: 1, major: 2, minorPx: 20 },
    { scale: 2, pxPerUnit: 12.5, minor: 2, major: 5, minorPx: 25 },
    { scale: 5, pxPerUnit: 5, minor: 5, major: 10, minorPx: 25 },
  ])(
    "at scale $scale spaces minor lines $minor u ($minorPx px) apart and majors $major u apart",
    ({ scale, pxPerUnit, minor, major, minorPx }) => {
      const grid = layoutGrid(800, 600, [0, 0], scale)
      expect(grid.pxPerUnit).toBe(pxPerUnit)
      expect(grid.steps).toEqual({ minor, major })
      expect(grid.steps.minor * grid.pxPerUnit).toBeCloseTo(minorPx)
    },
  )

  it("draws no grid line on either axis", () => {
    // The default view: the origin at the canvas center, minors every 0.5, majors every 1.
    const grid = layoutGrid(800, 600, [0, 0], 0.5)
    expect(grid.xOrigin).toBe(400)
    expect(grid.yOrigin).toBe(300)

    // The lines nearest the axes sit half a unit (25 px) to each side of them.
    expect(grid.minorX).toContainEqual({ unit: 0.5, px: 425 })
    expect(grid.minorX).toContainEqual({ unit: -0.5, px: 375 })
    expect(grid.minorY).toContainEqual({ unit: 0.5, px: 275 })
    expect(grid.minorY).toContainEqual({ unit: -0.5, px: 325 })

    // Nothing is listed at 0, where the axes are drawn.
    expect(units([...grid.minorX, ...grid.majorX, ...grid.minorY, ...grid.majorY])).not.toContain(0)
    expect([...grid.minorX, ...grid.majorX].map((l) => l.px)).not.toContain(400)
    expect([...grid.minorY, ...grid.majorY].map((l) => l.px)).not.toContain(300)
  })

  it("puts the grid where the camera says", () => {
    // The canvas center shows (1.3, -0.7) at 50 px per unit.
    const grid = layoutGrid(800, 600, [1.3, -0.7], 0.5)

    // x = 1 is 0.3 u left of the center: 400 - 15 px.
    expect(grid.majorX.find((l) => l.unit === 1)?.px).toBeCloseTo(385)
    // y = -1 is 0.3 u below the center, and screen y grows downward: 300 + 15 px.
    expect(grid.majorY.find((l) => l.unit === -1)?.px).toBeCloseTo(315)
    // The axes are 1.3 u left of and 0.7 u above the center.
    expect(grid.xOrigin).toBeCloseTo(335)
    expect(grid.yOrigin).toBeCloseTo(265)
  })

  it("keeps minor lines between 20 and 50 px apart at every scale", () => {
    // Sweep the whole zoom range, 0.1 to 5, with the origin off center.
    for (let scale = 0.1; scale <= 5; scale += 0.01) {
      const grid = layoutGrid(800, 600, [0.37, -2.1], scale)
      // With the axis in the place of the line at 0, every line is one minor step from the next.
      for (const gap of [...gaps(xPositions(grid)), ...gaps(yPositions(grid))]) {
        expect(gap).toBeGreaterThanOrEqual(20 - 1e-6)
        expect(gap).toBeLessThan(50)
      }
    }
  })

  it("reports the axes off screen when the center is far away", () => {
    // At 50 px per unit the 800 px canvas spans x = 92 to 108.
    const grid = layoutGrid(800, 600, [100, 100], 0.5)
    expect(grid.xOrigin).toBeNull()
    expect(grid.yOrigin).toBeNull()
    expect(units(grid.majorX)).toEqual([
      92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108,
    ])
    expect(units(grid.majorY)).toEqual([94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106])
  })

  it.each([
    { scale: 0.1, major: 0.2 },
    { scale: 0.25, major: 0.5 },
  ])("labels read as short decimals, not float noise, with majors every $major u", ({ scale }) => {
    // Far from the origin, where n × 0.2 gives values like 12.600000000000001.
    const grid = layoutGrid(800, 600, [12.3, -45.6], scale)
    const labels = units([...grid.majorX, ...grid.majorY]).map(String)
    expect(labels.length).toBeGreaterThan(0)
    for (const label of labels) {
      expect(label).toMatch(/^-?\d+(\.\d)?$/)
    }
  })

  it("draws no vertical lines, instead of freezing, when the URL pans x past 2^53", () => {
    // Past 2^53, x and the next minor step are the same number.
    const grid = layoutGrid(800, 600, [1e20, 0], 0.5)
    expect(grid.minorX).toEqual([])
    expect(grid.majorX).toEqual([])
    // y is still near 0, so the horizontal lines and the x-axis are drawn as usual.
    expect(grid.majorY.length).toBeGreaterThan(0)
    expect(grid.yOrigin).toBe(300)
  })
})
