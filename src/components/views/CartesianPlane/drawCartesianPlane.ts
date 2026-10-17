import type { ThemeVars } from "#src/state/useAppTheme.ts"

import { unscaledUnitSize } from "./constants"
import { drawScaleLegend } from "./drawScaleLegend"
import { layoutGrid, type GridLine } from "./grid"

const labelXPadding = 6
const labelYPadding = 6

const drawAxis = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  xOrigin: number | null,
  yOrigin: number | null,
  xLabels: GridLine[],
  yLabels: GridLine[],
  theme: ThemeVars,
  font: string | null,
) => {
  ctx.strokeStyle = theme.chartAxis
  ctx.lineWidth = 2
  if (xOrigin != null) {
    ctx.beginPath()
    ctx.moveTo(xOrigin, 0)
    ctx.lineTo(xOrigin, height)
    ctx.stroke()
  }

  if (yOrigin != null) {
    ctx.beginPath()
    ctx.moveTo(0, yOrigin)
    ctx.lineTo(width, yOrigin)
    ctx.stroke()
  }

  // The labels wait for their font rather than show in a fallback face.
  if (font === null) {
    return
  }

  ctx.font = font
  ctx.fillStyle = theme.foregroundMuted
  ctx.textAlign = "right"
  ctx.textBaseline = "top"

  const xLabelTop = (yOrigin ?? 20) + labelYPadding
  for (const { unit, px } of xLabels) {
    ctx.fillText(String(unit), px - labelXPadding, xLabelTop)
  }
  // The grid lists no line at 0, where the axes are. The origin's 0 shows
  // once, in the x labels.
  if (xOrigin !== null) {
    ctx.fillText("0", xOrigin - labelXPadding, xLabelTop)
  }

  for (const { unit, px } of yLabels) {
    ctx.fillText(String(unit), (xOrigin ?? 0) - labelXPadding, px + labelYPadding)
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
  center: [number, number],
  scale: number,
  theme: ThemeVars,
  font: string | null,
) => {
  const grid = layoutGrid(width, height, center, scale, labelMargin)

  ctx.lineWidth = 1
  ctx.strokeStyle = theme.chartGrid
  strokeVertical(ctx, grid.minorX, height)
  strokeHorizontal(ctx, grid.minorY, width)
  ctx.strokeStyle = theme.chartGridMajor
  strokeVertical(ctx, grid.majorX, height)
  strokeHorizontal(ctx, grid.majorY, width)

  drawAxis(ctx, width, height, grid.xOrigin, grid.yOrigin, grid.majorX, grid.majorY, theme, font)
}

export const drawCartesianPlane = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  center: [number, number],
  scale: number,
  theme: ThemeVars,
  font: string | null,
) => {
  drawGrid(ctx, width, height, center, scale, theme, font)
  // The legend's plate is as wide as its text, so the whole legend waits for
  // the font with the labels.
  if (font !== null) {
    drawScaleLegend(ctx, width, height, unscaledUnitSize, scale, theme, font)
  }
}
