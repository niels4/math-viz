import { describe, expect, it } from "vitest"

import type { ThemeVars } from "#src/state/useAppTheme.ts"

import { drawCartesianPlane } from "./drawCartesianPlane"

describe("drawCartesianPlane", () => {
  it("graphs y = x² through (0.5, 0.25) and (1, 1)", () => {
    // A context that records each point a line is drawn to.
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

    // A 400 by 300 px canvas at scale 0.5: 50 px per unit, the origin at (200, 150).
    drawCartesianPlane(
      ctx as unknown as CanvasRenderingContext2D,
      400,
      300,
      [0, 0],
      0.5,
      { chartLine: "teal" } as ThemeVars,
      null,
      (x) => x * x,
    )

    // (0.5, 0.25) is 25 px right of the origin and 12.5 px above it.
    expect(points).toContainEqual([225, 137.5])
    // (1, 1) is 50 px right and 50 px above.
    expect(points).toContainEqual([250, 100])
  })
})
