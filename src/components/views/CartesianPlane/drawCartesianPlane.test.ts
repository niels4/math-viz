import { describe, expect, it } from "vitest"

import type { ThemeVars } from "#src/state/useAppTheme.ts"

import { drawCartesianPlane, type PlotCurve } from "./drawCartesianPlane"

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

    expect(points).toContainEqual([225, 137.5])
    expect(points).toContainEqual([250, 100])
  })

  it("y = (x / 0.001)³ draws within 10,000 px of the canvas, where WebKit still strokes it", () => {
    const points = drawnPoints({ fn: (x) => (x / 0.001) ** 3, alpha: 1, drawTo: 1 })

    const ys = points.map(([, y]) => y)
    expect(Math.min(...ys)).toBe(-10_000)
    expect(Math.max(...ys)).toBe(10_300)
  })

  it("a quarter of the way through drawing y = x³, the pen is on the canvas", () => {
    const points = drawnPoints({ fn: (x) => x * x * x, alpha: 1, drawTo: 0.25 })

    const [x, y] = points.at(-1) ?? [Number.NaN, Number.NaN]
    expect(x).toBeGreaterThan(128)
    expect(x).toBeLessThan(200)
    expect(y).toBeGreaterThan(150)
    expect(y).toBeLessThan(300)
  })
})
