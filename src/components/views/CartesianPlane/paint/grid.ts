import type { ThemeVars } from "#src/state/useAppTheme.ts"

import type { GridLayout } from "../grid.ts"

import { baselineBelowTop, ORIGIN_FACE, TICK_LABEL_FACE } from "../faces.ts"
import { TICK_HALF } from "../grid.ts"

/** Grid lines are 1 px; axes and their ticks 2 px (drawPlane). */
const GRID_WIDTH = 1
const AXIS_WIDTH = 2

const strokeLines = (
  ctx: CanvasRenderingContext2D,
  xs: readonly number[],
  ys: readonly number[],
  size: { width: number; height: number },
  color: string,
  lineWidth: number,
) => {
  if (xs.length === 0 && ys.length === 0) {
    return
  }
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.beginPath()
  for (const x of xs) {
    ctx.moveTo(x, 0)
    ctx.lineTo(x, size.height)
  }
  for (const y of ys) {
    ctx.moveTo(0, y)
    ctx.lineTo(size.width, y)
  }
  ctx.stroke()
}

/** Back to front: minor lines, major lines, axes, ticks, tick labels, the O. */
export const paintGrid = (
  ctx: CanvasRenderingContext2D,
  grid: GridLayout,
  theme: ThemeVars,
  size: { width: number; height: number },
) => {
  ctx.save()
  ctx.lineCap = "butt"
  strokeLines(ctx, grid.minorX, grid.minorY, size, theme.chartGrid, GRID_WIDTH)
  strokeLines(ctx, grid.majorX, grid.majorY, size, theme.chartGridMajor, GRID_WIDTH)
  const axesX = grid.axisY === null ? [] : [grid.axisY]
  const axesY = grid.axisX === null ? [] : [grid.axisX]
  strokeLines(ctx, axesX, axesY, size, theme.chartAxis, AXIS_WIDTH)

  ctx.beginPath()
  if (grid.axisX !== null) {
    for (const x of grid.ticksX) {
      ctx.moveTo(x, grid.axisX - TICK_HALF)
      ctx.lineTo(x, grid.axisX + TICK_HALF)
    }
  }
  if (grid.axisY !== null) {
    for (const y of grid.ticksY) {
      ctx.moveTo(grid.axisY - TICK_HALF, y)
      ctx.lineTo(grid.axisY + TICK_HALF, y)
    }
  }
  ctx.stroke()

  ctx.fillStyle = theme.foregroundMuted
  ctx.textAlign = "left"
  ctx.textBaseline = "alphabetic"
  ctx.font = TICK_LABEL_FACE.font
  const labelBaseline = baselineBelowTop(TICK_LABEL_FACE)
  for (const { text, box } of grid.labels) {
    ctx.fillText(text, box.x, box.y + labelBaseline)
  }
  if (grid.origin !== null) {
    ctx.font = ORIGIN_FACE.font
    ctx.fillText("O", grid.origin.x, grid.origin.y + baselineBelowTop(ORIGIN_FACE))
  }
  ctx.restore()
}
