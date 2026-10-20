import { describe, expect, it } from "vitest"

import type { GridLayout, GridLine } from "./grid"

import { layoutGrid, layoutLabels, xLabelLines, type GridLabel } from "./grid"

const units = (lines: GridLine[]) => lines.map((l) => l.unit)

const xPositions = (grid: GridLayout) =>
  [...grid.minorX, ...grid.majorX]
    .map((l) => l.px)
    .concat(grid.xOrigin ?? [])
    .toSorted((a, b) => a - b)

const yPositions = (grid: GridLayout) =>
  [...grid.minorY, ...grid.majorY]
    .map((l) => l.px)
    .concat(grid.yOrigin ?? [])
    .toSorted((a, b) => a - b)

const labelWidth = (text: string) => text.length * 8.4

const gaps = (px: number[]) => px.slice(1).map((p, i) => p - (px[i] ?? p))

describe("layoutGrid", () => {
  it.each([
    { scale: 0.01, pxPerUnit: 2500, minor: 0.01, major: 0.02, minorPx: 25 },
    { scale: 0.1, pxPerUnit: 250, minor: 0.1, major: 0.2, minorPx: 25 },
    { scale: 0.25, pxPerUnit: 100, minor: 0.2, major: 0.5, minorPx: 20 },
    { scale: 0.5, pxPerUnit: 50, minor: 0.5, major: 1, minorPx: 25 },
    { scale: 1, pxPerUnit: 25, minor: 1, major: 2, minorPx: 25 },
    { scale: 1.25, pxPerUnit: 20, minor: 1, major: 2, minorPx: 20 },
    { scale: 2, pxPerUnit: 12.5, minor: 2, major: 5, minorPx: 25 },
    { scale: 5, pxPerUnit: 5, minor: 5, major: 10, minorPx: 25 },
    { scale: 10, pxPerUnit: 2.5, minor: 10, major: 20, minorPx: 25 },
    { scale: 100, pxPerUnit: 0.25, minor: 100, major: 200, minorPx: 25 },
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
    const grid = layoutGrid(800, 600, [0, 0], 0.5)
    expect(grid.xOrigin).toBe(400)
    expect(grid.yOrigin).toBe(300)

    expect(grid.minorX).toContainEqual({ unit: 0.5, px: 425 })
    expect(grid.minorX).toContainEqual({ unit: -0.5, px: 375 })
    expect(grid.minorY).toContainEqual({ unit: 0.5, px: 275 })
    expect(grid.minorY).toContainEqual({ unit: -0.5, px: 325 })

    expect(units([...grid.minorX, ...grid.majorX, ...grid.minorY, ...grid.majorY])).not.toContain(0)
    expect([...grid.minorX, ...grid.majorX].map((l) => l.px)).not.toContain(400)
    expect([...grid.minorY, ...grid.majorY].map((l) => l.px)).not.toContain(300)
  })

  it("puts the grid where the camera says", () => {
    const grid = layoutGrid(800, 600, [1.3, -0.7], 0.5)

    expect(grid.majorX.find((l) => l.unit === 1)?.px).toBeCloseTo(385)
    expect(grid.majorY.find((l) => l.unit === -1)?.px).toBeCloseTo(315)
    expect(grid.xOrigin).toBeCloseTo(335)
    expect(grid.yOrigin).toBeCloseTo(265)
  })

  it("keeps minor lines between 20 and 50 px apart at every scale", () => {
    for (let scale = 0.01; scale <= 100; scale *= 1.01) {
      const grid = layoutGrid(800, 600, [0.37, -2.1], scale)
      for (const gap of [...gaps(xPositions(grid)), ...gaps(yPositions(grid))]) {
        expect(gap).toBeGreaterThanOrEqual(20 - 1e-6)
        expect(gap).toBeLessThan(50)
      }
    }
  })

  it("reports the axes off screen when the center is far away", () => {
    const grid = layoutGrid(800, 600, [100, 100], 0.5)
    expect(grid.xOrigin).toBeNull()
    expect(grid.yOrigin).toBeNull()
    expect(units(grid.majorX)).toEqual([
      92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108,
    ])
    expect(units(grid.majorY)).toEqual([94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106])
  })

  it("lists lines and axes up to the margin past each edge", () => {
    const grid = layoutGrid(800, 600, [0, 0], 0.5, 64)
    expect(grid.majorX.at(0)).toEqual({ unit: -9, px: -50 })
    expect(grid.majorX.at(-1)).toEqual({ unit: 9, px: 850 })
    expect(grid.majorY.at(0)).toEqual({ unit: -7, px: 650 })
    expect(grid.majorY.at(-1)).toEqual({ unit: 7, px: -50 })

    const panned = layoutGrid(800, 600, [9, 0], 0.5, 64)
    expect(panned.xOrigin).toBe(-50)
    expect(layoutGrid(800, 600, [9, 0], 0.5).xOrigin).toBeNull()
  })

  it.each([
    { scale: 0.01, major: 0.02 },
    { scale: 0.1, major: 0.2 },
    { scale: 0.25, major: 0.5 },
  ])("labels read as short decimals, not float noise, with majors every $major u", ({ scale, major }) => {
    const grid = layoutGrid(800, 600, [12.3, -45.6], scale)
    const labels = units([...grid.majorX, ...grid.majorY]).map(String)
    expect(labels.length).toBeGreaterThan(0)
    const decimals = (s: string) => s.split(".")[1]?.length ?? 0
    for (const label of labels) {
      expect(decimals(label)).toBeLessThanOrEqual(decimals(String(major)))
    }
  })

  it("draws no vertical lines, instead of freezing, when the URL pans x past 2^53", () => {
    const grid = layoutGrid(800, 600, [1e20, 0], 0.5)
    expect(grid.minorX).toEqual([])
    expect(grid.majorX).toEqual([])
    expect(grid.majorY.length).toBeGreaterThan(0)
    expect(grid.yOrigin).toBe(300)
  })
})

describe("xLabelLines", () => {
  it("shows every x label while they fit", () => {
    const grid = layoutGrid(800, 600, [0, 0], 0.5)
    expect(xLabelLines(grid, labelWidth)).toEqual(grid.majorX)
  })

  it("shows every other x label where the minus sign makes negative labels crowd", () => {
    const positive = layoutGrid(800, 600, [3000, 0], 100)
    expect(units(xLabelLines(positive, labelWidth))).toEqual(units(positive.majorX))

    const negative = layoutGrid(800, 600, [-3000, 0], 100)
    expect(units(negative.majorX)).toContain(-4200)
    expect(units(xLabelLines(negative, labelWidth))).toEqual([
      -4400, -4000, -3600, -3200, -2800, -2400, -2000, -1600,
    ])
  })

  it("keeps every x label when only a label past the edge is too wide", () => {
    const grid = layoutGrid(800, 600, [0, 0], 6.2, 64)
    expect(units(grid.majorX)).toContain(-110)
    expect(xLabelLines(grid, labelWidth)).toEqual(grid.majorX)
  })

  it("keeps the same x labels as the plane pans", () => {
    for (const x of [-3000, -2950, -2800, -2633, -2200]) {
      const grid = layoutGrid(800, 600, [x, 0], 100)
      const multiplesOf400 = units(grid.majorX).filter((u) => u % 400 === 0)
      expect(units(xLabelLines(grid, labelWidth))).toEqual(multiplesOf400)
    }
  })
})

describe("layoutLabels", () => {
  const labelsAt = (center: [number, number]) =>
    layoutLabels(layoutGrid(800, 600, center, 0.5, 64), 14, labelWidth)
  const ofAxis = (labels: GridLabel[], axis: "x" | "y") => labels.filter((l) => l.axis === axis)

  it("puts x labels below the x-axis and y labels left of the y-axis", () => {
    const labels = labelsAt([0, 0])
    expect(ofAxis(labels, "x")).toContainEqual({ axis: "x", text: "1", right: 444, top: 306 })
    expect(ofAxis(labels, "y")).toContainEqual({ axis: "y", text: "1", right: 394, top: 256 })
    expect(labels.filter((l) => l.text === "0")).toEqual([{ axis: "x", text: "0", right: 394, top: 306 }])
  })

  it("keeps the x labels along the top edge while the x-axis is above the plane", () => {
    for (const label of ofAxis(labelsAt([0, -100]), "x")) {
      expect(label.top).toBe(8)
    }
  })

  it("keeps the x labels along the bottom edge while the x-axis is below the plane", () => {
    for (const label of ofAxis(labelsAt([0, 100]), "x")) {
      expect(label.top).toBe(578)
    }
  })

  it("keeps the y labels along the left edge, left-aligned, while the y-axis is left of the plane", () => {
    const labels = ofAxis(labelsAt([100, 0]), "y")
    expect(labels.length).toBeGreaterThan(0)
    for (const label of labels) {
      expect(label.right - labelWidth(label.text)).toBeCloseTo(8)
    }
  })

  it("keeps the y labels along the right edge while the y-axis is right of the plane", () => {
    for (const label of ofAxis(labelsAt([-100, 0]), "y")) {
      expect(label.right).toBe(792)
    }
  })

  it("puts the x labels above the x-axis when it is too near the bottom edge for them below", () => {
    for (const label of ofAxis(labelsAt([0, 5.8]), "x")) {
      expect(label.top).toBeCloseTo(570)
    }
  })

  it("puts the y labels right of the y-axis when it is too near the left edge for them left of it", () => {
    const labels = ofAxis(labelsAt([7.7, 0]), "y")
    expect(labels.length).toBeGreaterThan(0)
    for (const label of labels) {
      expect(label.right - labelWidth(label.text)).toBeCloseTo(21)
    }
  })

  it("leaves out the y label that would overlap the x labels along the top edge", () => {
    const labels = labelsAt([0, -100])
    expect(ofAxis(labels, "x")[0]?.top).toBe(8)
    const yTexts = ofAxis(labels, "y").map((l) => l.text)
    expect(yTexts).not.toContain("-94")
    expect(yTexts).toContain("-95")
  })
})
