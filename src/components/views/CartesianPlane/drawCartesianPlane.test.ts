import { describe, expect, it } from "vitest"

import type { ThemeVars } from "#src/state/useAppTheme.ts"

import { drawCartesianPlane, type PlotCurve } from "./drawCartesianPlane"

// Draws one curve on a 400 by 300 px canvas at scale 0.5: 50 px per unit, the
// origin at (200, 150). Returns each point a line is drawn to, the grid's
// first and the curve's last.
const drawnPoints = (curve: PlotCurve): [number, number][] => {
  const points: [number, number][] = []
  const ctx = new Proxy<Record<string | symbol, unknown>>(
    {},
    {
      get: (target, key) => {
        if (key === "lineTo") {
          return (x: number, y: number) => points.push([x, y])
        }
        return key in target ? target[key] : () => {}
      },
    },
  )
  drawCartesianPlane(
    ctx as unknown as CanvasRenderingContext2D,
    400,
    300,
    [0, 0],
    0.5,
    { chartLine: "teal" } as ThemeVars,
    null,
    [curve],
  )
  return points
}

describe("drawCartesianPlane", () => {
  it("graphs y = x² through (0.5, 0.25) and (1, 1)", () => {
    const points = drawnPoints({ fn: (x) => x * x, alpha: 1, drawTo: 1 })

    // (0.5, 0.25) is 25 px right of the origin and 12.5 px above it.
    expect(points).toContainEqual([225, 137.5])
    // (1, 1) is 50 px right and 50 px above.
    expect(points).toContainEqual([250, 100])
  })

  it("a quarter of the way through drawing y = x³, the pen is on the canvas", () => {
    // y = x³ comes up through the bottom edge near x = -1.44 (128 px) and
    // leaves through the top near x = 1.44 (272 px). A quarter of the way
    // across the canvas, at x = -2, it is 250 px below the bottom edge.
    const points = drawnPoints({ fn: (x) => x * x * x, alpha: 1, drawTo: 0.25 })

    // A quarter of what shows is on the part left of and below the origin.
    const [x, y] = points.at(-1) ?? [Number.NaN, Number.NaN]
    expect(x).toBeGreaterThan(128)
    expect(x).toBeLessThan(200)
    expect(y).toBeGreaterThan(150)
    expect(y).toBeLessThan(300)
  })
})
