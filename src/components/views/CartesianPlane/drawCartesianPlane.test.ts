import { describe, expect, it } from "vitest"

import type { ThemeVars } from "#src/state/useAppTheme.ts"

import { labelMargin, planeFont } from "./constants"
import {
  drawCartesianPlane,
  type PlotCurve,
  type PlotHandle,
  type PlotLine,
  type PlotMarker,
} from "./drawCartesianPlane"
import { layoutGrid } from "./grid"

const draw = (
  curves: PlotCurve[],
  handles: PlotHandle[] = [],
  lines: PlotLine[] = [],
  markers: PlotMarker[] = [],
  font: string | null = null,
) => {
  const points: [number, number][] = []
  const arcs: { x: number; y: number; r: number; style: unknown }[] = []
  const rects: [number, number, number, number][] = []
  const texts: { text: string; x: number; y: number }[] = []
  const ctx = new Proxy<Record<string | symbol, unknown>>(
    {},
    {
      get: (target, key) => {
        if (key === "moveTo" || key === "lineTo") {
          return (x: number, y: number) => points.push([x, y])
        }
        if (key === "arc") {
          return (x: number, y: number, r: number) => arcs.push({ x, y, r, style: target["fillStyle"] })
        }
        if (key === "roundRect") {
          return (x: number, y: number, w: number, h: number) => rects.push([x, y, w, h])
        }
        if (key === "fillText") {
          return (text: string, x: number, y: number) => texts.push({ text, x, y })
        }
        if (key === "measureText") {
          return () => ({ width: 40 })
        }
        return key in target ? target[key] : () => {}
      },
    },
  )
  drawCartesianPlane(
    ctx as unknown as CanvasRenderingContext2D,
    layoutGrid(400, 300, [0, 0], 0.5, labelMargin),
    { chartLine: "teal", ordinal05: "green" } as ThemeVars,
    font,
    curves,
    handles,
    lines,
    markers,
  )
  return { points, arcs, rects, texts }
}

const drawnPoints = (curves: PlotCurve[], handles: PlotHandle[] = [], lines: PlotLine[] = []) =>
  draw(curves, handles, lines).points

describe("drawCartesianPlane", () => {
  it("graphs y = x² through (0.5, 0.25) and (1, 1)", () => {
    const points = drawnPoints([{ fn: (x) => x * x, alpha: 1, drawTo: 1 }])

    expect(points).toContainEqual([225, 137.5])
    expect(points).toContainEqual([250, 100])
  })

  it("y = (x / 0.001)³ draws within 10,000 px of the canvas, where WebKit still strokes it", () => {
    const points = drawnPoints([{ fn: (x) => (x / 0.001) ** 3, alpha: 1, drawTo: 1 }])

    const ys = points.map(([, y]) => y)
    expect(Math.min(...ys)).toBe(-10_000)
    expect(Math.max(...ys)).toBe(10_300)
  })

  it("a quarter of the way through drawing y = x³, the pen is on the canvas", () => {
    const points = drawnPoints([{ fn: (x) => x * x * x, alpha: 1, drawTo: 0.25 }])

    const [x, y] = points.at(-1) ?? [Number.NaN, Number.NaN]
    expect(x).toBeGreaterThan(128)
    expect(x).toBeLessThan(200)
    expect(y).toBeGreaterThan(150)
    expect(y).toBeLessThan(300)
  })

  it("a shift handle at (1, 1) is a diamond around (250, 100)", () => {
    const points = drawnPoints([], [{ point: { x: 1, y: 1 }, shape: "diamond" }])

    expect(points.slice(-4)).toEqual([
      [250, 90],
      [260, 100],
      [250, 110],
      [240, 100],
    ])
  })

  it("an arrow from (0, 0) to (1, 0) starts at a tick across the y-axis and points at (250, 150)", () => {
    const points = drawnPoints([], [], [{ from: { x: 0, y: 0 }, to: { x: 1, y: 0 }, look: "arrow" }])

    expect(points).toContainEqual([200, 141])
    expect(points).toContainEqual([200, 159])
    expect(points).toContainEqual([250, 150])
  })

  it("a measured line from (0, 0) to (0, 1) has a tick across each end", () => {
    const points = drawnPoints([], [], [{ from: { x: 0, y: 0 }, to: { x: 0, y: 1 }, look: "measured" }])

    expect(points.slice(-4)).toEqual([
      [193, 150],
      [207, 150],
      [193, 100],
      [207, 100],
    ])
  })

  it("P at (1, 1) is a bullseye around (250, 100) with a core in its ink", () => {
    const { arcs } = draw([], [], [], [{ point: { x: 1, y: 1 }, ink: "ordinal05" }])

    expect(arcs.map(({ x, y }) => [x, y])).toEqual([
      [250, 100],
      [250, 100],
      [250, 100],
    ])
    expect(arcs.at(-1)).toMatchObject({ r: 6, style: "green" })
  })

  it("P's label sits 22 px right of the point, its bottom 13.2 px above it", () => {
    const label = { name: "P", coords: "(1.00, 1.00)" }
    const { rects, texts } = draw([], [], [], [{ point: { x: 1, y: 1 }, ink: "ordinal05", label }], planeFont)

    const [x, y, w, h] = rects[0] ?? []
    expect(x).toBe(272)
    expect(y).toBeCloseTo(45.8)
    expect(w).toBe(114)
    expect(h).toBe(41)
    const labelTexts = texts.filter(({ text }) => text === label.name || text === label.coords)
    expect(labelTexts.map(({ text, x }) => [text, x])).toEqual([
      ["P", 286],
      ["(1.00, 1.00)", 332],
    ])
  })

  it("no label shows until the plane's fonts have loaded", () => {
    const label = { name: "P", coords: "(1.00, 1.00)" }
    const { rects, texts } = draw([], [], [], [{ point: { x: 1, y: 1 }, ink: "ordinal05", label }])

    expect(rects).toEqual([])
    expect(texts).toEqual([])
  })

  it("P's label stays 12 px inside the frame on each side, keeping its place along that side", () => {
    const labelAt = (x: number, y: number) => {
      const label = { name: "P", coords: "(0.00, 0.00)" }
      const { rects } = draw([], [], [], [{ point: { x, y }, ink: "ordinal05", label }], planeFont)
      const [left, top] = rects[0] ?? []
      return [left, top]
    }

    expect(labelAt(-1, 20)).toEqual([172, 12])
    expect(labelAt(-1, -20)).toEqual([172, 247])
    expect(labelAt(-20, 1)[0]).toBe(12)
    expect(labelAt(-20, 1)[1]).toBeCloseTo(45.8)
    expect(labelAt(20, 1)[0]).toBe(274)
    expect(labelAt(20, 1)[1]).toBeCloseTo(45.8)
  })
})
