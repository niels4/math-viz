import type { ThemeVars } from "#src/state/useAppTheme.ts"

import { unscaledUnitSize } from "./constants"
import { drawScaleLegend } from "./drawScaleLegend"

type AxisLabel = {
  unitVal: number
  ctxVal: number
}

const labelXPadding = 6
const labelYPadding = 6

const drawAxis = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  xOrigin: number | null,
  yOrigin: number | null,
  xLabels: AxisLabel[],
  yLabels: AxisLabel[],
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

  for (const { unitVal, ctxVal } of xLabels) {
    ctx.fillText(String(unitVal), ctxVal - labelXPadding, (yOrigin ?? 20) + labelYPadding)
  }

  for (const { unitVal, ctxVal } of yLabels) {
    if (unitVal === 0) {
      continue
    }
    ctx.fillText(String(unitVal), (xOrigin ?? 0) - labelXPadding, ctxVal + labelYPadding)
  }
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
  // One grid type for now: these lines carry the labels, so they use the
  // major token. Minor lines arrive with grid scaling later.
  ctx.strokeStyle = theme.chartGridMajor
  ctx.lineWidth = 1
  const unitSize = unscaledUnitSize / scale

  const ctxCenterX = Math.floor(width / 2)
  const ctxCenterY = Math.floor(height / 2)

  let xOrigin: number | null = null
  let yOrigin: number | null = null
  const xLabels: AxisLabel[] = []
  const yLabels: AxisLabel[] = []

  const numWidthUnits = Math.ceil(width / unitSize)
  const halfNumWidthUnits = Math.ceil(numWidthUnits / 2) + 1
  const xOffset = (center[0] % 1) * unitSize

  for (let i = 0; i < halfNumWidthUnits; i++) {
    const ctxDiff = i * unitSize
    const ctx1 = ctxCenterX + ctxDiff - xOffset
    const ctx2 = ctxCenterX - ctxDiff - xOffset
    const startX = center[0] >= 0 ? Math.floor(center[0]) : Math.ceil(center[0])
    const x1 = startX + i
    const x2 = startX - i

    if (x1 === 0) {
      xOrigin = ctx1
    } else if (x2 === 0) {
      xOrigin = ctx2
    }

    xLabels.push({ unitVal: x1, ctxVal: ctx1 })
    if (x1 !== x2) {
      xLabels.push({ unitVal: x2, ctxVal: ctx2 })
    }

    ctx.beginPath()
    ctx.moveTo(ctx1, 0)
    ctx.lineTo(ctx1, height)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(ctx2, 0)
    ctx.lineTo(ctx2, height)
    ctx.stroke()
  }

  const numHeightUnits = Math.ceil(height / unitSize)
  const halfNumHeightUnits = Math.ceil(numHeightUnits / 2) + 1
  const yOffset = (center[1] % 1) * unitSize

  for (let i = 0; i < halfNumHeightUnits; i++) {
    const ctxDiff = i * unitSize
    const ctx1 = ctxCenterY - ctxDiff + yOffset
    const ctx2 = ctxCenterY + ctxDiff + yOffset
    const startY = center[1] >= 0 ? Math.floor(center[1]) : Math.ceil(center[1])
    const y1 = startY + i
    const y2 = startY - i

    if (y1 === 0) {
      yOrigin = ctx1
    } else if (y2 === 0) {
      yOrigin = ctx2
    }

    yLabels.push({ unitVal: y1, ctxVal: ctx1 })
    if (y1 !== y2) {
      yLabels.push({ unitVal: y2, ctxVal: ctx2 })
    }

    ctx.beginPath()
    ctx.moveTo(0, ctx1)
    ctx.lineTo(width, ctx1)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, ctx2)
    ctx.lineTo(width, ctx2)
    ctx.stroke()
  }

  drawAxis(ctx, width, height, xOrigin, yOrigin, xLabels, yLabels, theme, font)
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
