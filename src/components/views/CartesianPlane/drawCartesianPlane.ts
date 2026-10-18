import type { ThemeVars } from "#src/state/useAppTheme.ts"

import { planeFontSize, unscaledUnitSize } from "./constants"
import { drawScaleLegend } from "./drawScaleLegend"
import { layoutGrid, layoutLabels, type GridLayout, type GridLine } from "./grid"

/** A function the plane graphs as y = f(x). */
export type PlotFunction = (x: number) => number

/**
 * A function's curve as one frame shows it: its opacity, and how much of its
 * length inside the canvas is drawn, from the left (1 for all of it).
 */
export type PlotCurve = { fn: PlotFunction; alpha: number; drawTo: number }

// Ticks cross an axis at each major line, this far to each side.
const tickHalf = 5

const drawAxis = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  grid: GridLayout,
  theme: ThemeVars,
  font: string | null,
) => {
  const { xOrigin, yOrigin } = grid
  ctx.strokeStyle = theme.chartAxis
  ctx.lineWidth = 2
  ctx.beginPath()
  if (xOrigin !== null) {
    ctx.moveTo(xOrigin, 0)
    ctx.lineTo(xOrigin, height)
    for (const { px } of grid.majorY) {
      ctx.moveTo(xOrigin - tickHalf, px)
      ctx.lineTo(xOrigin + tickHalf, px)
    }
  }
  if (yOrigin !== null) {
    ctx.moveTo(0, yOrigin)
    ctx.lineTo(width, yOrigin)
    for (const { px } of grid.majorX) {
      ctx.moveTo(px, yOrigin - tickHalf)
      ctx.lineTo(px, yOrigin + tickHalf)
    }
  }
  ctx.stroke()

  // The labels wait for their font rather than show in a fallback face.
  if (font === null) {
    return
  }

  ctx.font = font
  ctx.fillStyle = theme.foregroundMuted
  ctx.textAlign = "right"
  ctx.textBaseline = "top"
  const labelWidth = (text: string) => ctx.measureText(text).width
  for (const { text, right, top } of layoutLabels(grid, width, height, planeFontSize, labelWidth)) {
    ctx.fillText(text, right, top)
  }
}

// Lines this far past an edge still get their labels, so a label slides in
// with its line instead of popping in: a label sits left of or below its
// line, and one like -1234 is under 64 px wide.
const labelMargin = 64

const strokeVertical = (ctx: CanvasRenderingContext2D, lines: GridLine[], height: number) => {
  ctx.beginPath()
  for (const { px } of lines) {
    ctx.moveTo(px, 0)
    ctx.lineTo(px, height)
  }
  ctx.stroke()
}

const strokeHorizontal = (ctx: CanvasRenderingContext2D, lines: GridLine[], width: number) => {
  ctx.beginPath()
  for (const { px } of lines) {
    ctx.moveTo(0, px)
    ctx.lineTo(width, px)
  }
  ctx.stroke()
}

const drawGrid = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  grid: GridLayout,
  theme: ThemeVars,
  font: string | null,
) => {
  ctx.lineWidth = 1
  ctx.strokeStyle = theme.chartGrid
  strokeVertical(ctx, grid.minorX, height)
  strokeHorizontal(ctx, grid.minorY, width)
  ctx.strokeStyle = theme.chartGridMajor
  strokeVertical(ctx, grid.majorX, height)
  strokeHorizontal(ctx, grid.majorY, width)

  drawAxis(ctx, width, height, grid, theme, font)
}

// The share of the segment from y0 to y1 that lies between the canvas's top
// and bottom edges.
const insideShare = (y0: number, y1: number, height: number) => {
  const lo = Math.min(y0, y1)
  const hi = Math.max(y0, y1)
  if (hi < 0 || lo > height) {
    return 0
  }
  if (hi === lo) {
    return 1
  }
  return (Math.min(hi, height) - Math.max(lo, 0)) / (hi - lo)
}

// y = f(x) across the canvas, one point per px column. A curve drawn partway
// stops once it has drawn its share of the length inside the canvas, so the
// pen spends no time above or below the canvas.
const drawCurve = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  grid: GridLayout,
  curve: PlotCurve,
  theme: ThemeVars,
) => {
  const [originX, originY] = grid.origin
  // Each point with the length inside the canvas from the left edge to it.
  const points: { x: number; y: number; at: number }[] = []
  let at = 0
  for (let px = 0; px <= width; px++) {
    const y = originY - curve.fn((px - originX) / grid.pxPerUnit) * grid.pxPerUnit
    const prev = points.at(-1)
    if (prev !== undefined) {
      at += Math.hypot(px - prev.x, y - prev.y) * insideShare(prev.y, y, height)
    }
    points.push({ x: px, y, at })
  }
  const stop = curve.drawTo * at

  ctx.globalAlpha = curve.alpha
  ctx.strokeStyle = theme.chartLine
  ctx.lineWidth = 3
  ctx.lineJoin = "round"
  ctx.beginPath()
  let prev: { x: number; y: number; at: number } | undefined
  for (const point of points) {
    // The pen stops partway along this segment.
    if (prev !== undefined && point.at > stop) {
      const t = (stop - prev.at) / (point.at - prev.at)
      ctx.lineTo(prev.x + (point.x - prev.x) * t, prev.y + (point.y - prev.y) * t)
      break
    }
    ctx.lineTo(point.x, point.y)
    prev = point
  }
  ctx.stroke()
  ctx.globalAlpha = 1
}

export const drawCartesianPlane = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  center: [number, number],
  scale: number,
  theme: ThemeVars,
  font: string | null,
  curves: readonly PlotCurve[],
) => {
  const grid = layoutGrid(width, height, center, scale, labelMargin)
  drawGrid(ctx, width, height, grid, theme, font)
  // In order, so each curve draws over the ones before it.
  for (const curve of curves) {
    drawCurve(ctx, width, height, grid, curve, theme)
  }
  // The legend's plate is as wide as its text, so the whole legend waits for
  // the font with the labels.
  if (font !== null) {
    drawScaleLegend(ctx, width, height, unscaledUnitSize, scale, theme, font)
  }
}
