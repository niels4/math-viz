import { describe, expect, it } from "vitest"

import type { GridLayout, GridLine } from "./grid"

import { layoutGrid, layoutLabels, xLabelLines, type GridLabel } from "./grid"

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

// Roboto Mono at 14 px is 8.4 px a character: "-1600" is 42 px wide.
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
    // Sweep the whole zoom range, 0.01 to 100 in steps of 1%, with the origin off center.
    for (let scale = 0.01; scale <= 100; scale *= 1.01) {
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

  it("lists lines and axes up to the margin past each edge", () => {
    // At 50 px per unit with a 64 px margin, the 800 by 600 canvas lists x = -9
    // to 9 (-50 to 850 px) and y = -7 to 7 (650 to -50 px).
    const grid = layoutGrid(800, 600, [0, 0], 0.5, 64)
    expect(grid.majorX.at(0)).toEqual({ unit: -9, px: -50 })
    expect(grid.majorX.at(-1)).toEqual({ unit: 9, px: 850 })
    expect(grid.majorY.at(0)).toEqual({ unit: -7, px: 650 })
    expect(grid.majorY.at(-1)).toEqual({ unit: 7, px: -50 })

    // Panned so the y-axis is 50 px left of the canvas, it is still listed.
    const panned = layoutGrid(800, 600, [9, 0], 0.5, 64)
    expect(panned.xOrigin).toBe(-50)
    expect(layoutGrid(800, 600, [9, 0], 0.5).xOrigin).toBeNull()
  })

  it.each([
    { scale: 0.01, major: 0.02 },
    { scale: 0.1, major: 0.2 },
    { scale: 0.25, major: 0.5 },
  ])("labels read as short decimals, not float noise, with majors every $major u", ({ scale, major }) => {
    // Far from the origin, where n × 0.2 gives values like 12.600000000000001.
    const grid = layoutGrid(800, 600, [12.3, -45.6], scale)
    const labels = units([...grid.majorX, ...grid.majorY]).map(String)
    expect(labels.length).toBeGreaterThan(0)
    // No label has more decimals than the step: 12.14 with majors every 0.02.
    const decimals = (s: string) => s.split(".")[1]?.length ?? 0
    for (const label of labels) {
      expect(decimals(label)).toBeLessThanOrEqual(decimals(String(major)))
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

describe("xLabelLines", () => {
  it("shows every x label while they fit", () => {
    // The default view: labels like -8, 50 px apart.
    const grid = layoutGrid(800, 600, [0, 0], 0.5)
    expect(xLabelLines(grid, 800, labelWidth)).toEqual(grid.majorX)
  })

  it("shows every other x label where the minus sign makes negative labels crowd", () => {
    // At scale 100 the labels are 200 u, 50 px, apart. Panned right, the
    // widest is 4600: 34 px, which leaves 16 px before the next.
    const positive = layoutGrid(800, 600, [3000, 0], 100)
    expect(units(xLabelLines(positive, 800, labelWidth))).toEqual(units(positive.majorX))

    // Panned left, -4600 is 42 px and leaves only 8 px, so every other label
    // shows: the multiples of 400.
    const negative = layoutGrid(800, 600, [-3000, 0], 100)
    expect(units(negative.majorX)).toContain(-4200)
    expect(units(xLabelLines(negative, 800, labelWidth))).toEqual([
      -4400, -4000, -3600, -3200, -2800, -2400, -2000, -1600,
    ])
  })

  it("keeps every x label when only a label past the edge is too wide", () => {
    // At scale 6.2 the labels are 10 u, 40 px, apart, and the 800 px canvas
    // shows x = -99 to 99: labels up to -90, which fit. The 64 px margin
    // lists -110 and -100 too, which wouldn't, but they aren't on screen.
    const grid = layoutGrid(800, 600, [0, 0], 6.2, 64)
    expect(units(grid.majorX)).toContain(-110)
    expect(xLabelLines(grid, 800, labelWidth)).toEqual(grid.majorX)
  })

  it("keeps the same x labels as the plane pans", () => {
    // Pans of less than one label step and of an odd number of steps: the
    // labels that show are always the multiples of 400 in view.
    for (const x of [-3000, -2950, -2800, -2633, -2200]) {
      const grid = layoutGrid(800, 600, [x, 0], 100)
      const multiplesOf400 = units(grid.majorX).filter((u) => u % 400 === 0)
      expect(units(xLabelLines(grid, 800, labelWidth))).toEqual(multiplesOf400)
    }
  })
})

describe("layoutLabels", () => {
  // The default view's 800 by 600 canvas, 14 px labels, 64 px margin.
  const labelsAt = (center: [number, number]) =>
    layoutLabels(layoutGrid(800, 600, center, 0.5, 64), 800, 600, 14, labelWidth)
  const ofAxis = (labels: GridLabel[], axis: "x" | "y") => labels.filter((l) => l.axis === axis)

  it("puts x labels below the x-axis and y labels left of the y-axis", () => {
    // The origin is at (400, 300) and a unit is 50 px.
    const labels = labelsAt([0, 0])
    // x labels end 6 px left of their line, 6 px below the axis.
    expect(ofAxis(labels, "x")).toContainEqual({ axis: "x", text: "1", right: 444, top: 306 })
    // y labels end 6 px left of the axis, 6 px below their line.
    expect(ofAxis(labels, "y")).toContainEqual({ axis: "y", text: "1", right: 394, top: 256 })
    // The origin's 0 shows once, among the x labels.
    expect(labels.filter((l) => l.text === "0")).toEqual([{ axis: "x", text: "0", right: 394, top: 306 }])
  })

  it("keeps the x labels along the top edge while the x-axis is above the plane", () => {
    // y = 0 is 100 u, 5000 px, above the canvas center.
    for (const label of ofAxis(labelsAt([0, -100]), "x")) {
      expect(label.top).toBe(8)
    }
  })

  it("keeps the x labels along the bottom edge while the x-axis is below the plane", () => {
    // 14 px labels whose bottoms stay 8 px above the 600 px canvas's edge.
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
    // y = 0 is 10 px above the bottom edge: 590 px. Below it, 14 px labels
    // would run past the edge, so their tops sit 6 + 14 px above the axis.
    for (const label of ofAxis(labelsAt([0, 5.8]), "x")) {
      expect(label.top).toBeCloseTo(570)
    }
  })

  it("puts the y labels right of the y-axis when it is too near the left edge for them left of it", () => {
    // x = 0 is 15 px from the left edge, too near for -6, 16.8 px wide, so
    // the labels start 6 px right of the axis.
    const labels = ofAxis(labelsAt([7.7, 0]), "y")
    expect(labels.length).toBeGreaterThan(0)
    for (const label of labels) {
      expect(label.right - labelWidth(label.text)).toBeCloseTo(21)
    }
  })

  it("leaves out the y label that would overlap the x labels along the top edge", () => {
    // The x-axis is far above the canvas, so the x labels run along the top
    // edge, 8 px down. The canvas center shows y = -100, so y = -94 is at
    // 0 px and its label at 6 px would overlap them; y = -95 is 50 px lower.
    const labels = labelsAt([0, -100])
    expect(ofAxis(labels, "x")[0]?.top).toBe(8)
    const yTexts = ofAxis(labels, "y").map((l) => l.text)
    expect(yTexts).not.toContain("-94")
    expect(yTexts).toContain("-95")
  })
})
