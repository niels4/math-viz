import type { ThemeVars } from "#src/state/useAppTheme.ts"

import { planeFontSize, unscaledUnitSize } from "./constants"
import { drawScaleLegend } from "./drawScaleLegend"
import { layoutGrid, layoutLabels, type GridLayout, type GridLine } from "./grid"

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

  drawAxis(ctx, width, height, grid, theme, font)
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
