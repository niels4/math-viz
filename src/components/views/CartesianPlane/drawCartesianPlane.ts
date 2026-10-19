import type { ThemeVars } from "#src/state/useAppTheme.ts"

import { planeFontSize, unscaledUnitSize } from "./constants"
import { drawScaleLegend } from "./drawScaleLegend"
import { layoutGrid, layoutLabels, type GridLayout, type GridLine } from "./grid"

export type PlotFunction = (x: number) => number

export type PlotCurve = { fn: PlotFunction; alpha: number; drawTo: number; dashed?: boolean }

type CurveLook = { ink: keyof ThemeVars; width: number; cap: CanvasLineCap; dash: number[]; alpha: number }

const solidLook: CurveLook = { ink: "chartLine", width: 3, cap: "butt", dash: [], alpha: 1 }
const dashedLook: CurveLook = { ink: "foregroundMuted", width: 2, cap: "round", dash: [6, 6], alpha: 0.75 }

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

const overshootPx = 10_000

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

const drawCurve = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  grid: GridLayout,
  curve: PlotCurve,
  theme: ThemeVars,
) => {
  const [originX, originY] = grid.origin
  const points: { x: number; y: number; at: number }[] = []
  let at = 0
  for (let px = 0; px <= width; px++) {
    const y = Math.min(
      height + overshootPx,
      Math.max(-overshootPx, originY - curve.fn((px - originX) / grid.pxPerUnit) * grid.pxPerUnit),
    )
    const prev = points.at(-1)
    if (prev !== undefined) {
      at += Math.hypot(px - prev.x, y - prev.y) * insideShare(prev.y, y, height)
    }
    points.push({ x: px, y, at })
  }
  const stop = curve.drawTo * at

  const look = curve.dashed === true ? dashedLook : solidLook
  ctx.save()
  ctx.globalAlpha = curve.alpha * look.alpha
  ctx.strokeStyle = theme[look.ink]
  ctx.lineWidth = look.width
  ctx.lineCap = look.cap
  ctx.lineJoin = "round"
  ctx.setLineDash(look.dash)
  ctx.lineDashOffset = (look.dash[0] ?? 0) / 2
  ctx.beginPath()
  let prev: { x: number; y: number; at: number } | undefined
  for (const point of points) {
    if (prev !== undefined && point.at > stop) {
      const t = (stop - prev.at) / (point.at - prev.at)
      ctx.lineTo(prev.x + (point.x - prev.x) * t, prev.y + (point.y - prev.y) * t)
      break
    }
    ctx.lineTo(point.x, point.y)
    prev = point
  }
  ctx.stroke()
  ctx.restore()
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
  for (const curve of curves) {
    drawCurve(ctx, width, height, grid, curve, theme)
  }
  if (font !== null) {
    drawScaleLegend(ctx, width, height, unscaledUnitSize, scale, theme, font)
  }
}
