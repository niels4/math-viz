import type { ThemeVars } from "#src/state/useAppTheme.ts"

import { labelLetterFont, labelNumberFont, planeFontSize } from "./constants"
import { drawScaleLegend } from "./drawScaleLegend"
import { clamp, layoutLabels, type GridLayout, type GridLine } from "./grid"

export type PlotFunction = (x: number) => number

export type PlotCurve = { fn: PlotFunction; alpha: number; drawTo: number; dashed?: boolean }

export type PlotPoint = { x: number; y: number }

type PlotHandleShape = "diamond" | "square"

export type PlotMouseHandlerAction = "onHover" | "onHoverEnd" | "onPointerDown" | "onDrag" | "onPointerUp"

type HandlerFunc = (e: PointerEvent, point: PlotPoint) => void

type PlotHandleMouseHandlers = Partial<Record<PlotMouseHandlerAction, HandlerFunc>>

export type PlotHandle = {
  point: PlotPoint
  shape: PlotHandleShape
  handlers?: PlotHandleMouseHandlers
}

export type PlotLine = { from: PlotPoint; to: PlotPoint; look: "arrow" | "dashed" | "measured" }

export type PlotLabel = { name: string; coords: string }

export type PlotMarker = { point: PlotPoint; ink: keyof ThemeVars; label?: PlotLabel }

type CurveLook = { ink: keyof ThemeVars; width: number; cap: CanvasLineCap; dash: number[]; alpha: number }

const solidLook: CurveLook = { ink: "chartLine", width: 3, cap: "butt", dash: [], alpha: 1 }
const dashedLook: CurveLook = { ink: "foregroundMuted", width: 2, cap: "round", dash: [6, 6], alpha: 0.75 }

const tickHalf = 5

const drawAxis = (ctx: CanvasRenderingContext2D, grid: GridLayout, theme: ThemeVars, font: string | null) => {
  const { width, height, xOrigin, yOrigin } = grid
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
  for (const { text, right, top } of layoutLabels(grid, planeFontSize, labelWidth)) {
    ctx.fillText(text, right, top)
  }
}

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

const drawGrid = (ctx: CanvasRenderingContext2D, grid: GridLayout, theme: ThemeVars, font: string | null) => {
  ctx.lineWidth = 1
  ctx.strokeStyle = theme.chartGrid
  strokeVertical(ctx, grid.minorX, grid.height)
  strokeHorizontal(ctx, grid.minorY, grid.width)
  ctx.strokeStyle = theme.chartGridMajor
  strokeVertical(ctx, grid.majorX, grid.height)
  strokeHorizontal(ctx, grid.majorY, grid.width)

  drawAxis(ctx, grid, theme, font)
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

const drawCurve = (ctx: CanvasRenderingContext2D, grid: GridLayout, curve: PlotCurve, theme: ThemeVars) => {
  const { width, height } = grid
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

const toPx = (grid: GridLayout, { x, y }: PlotPoint): [number, number] => {
  const [originX, originY] = grid.origin
  return [originX + x * grid.pxPerUnit, originY - y * grid.pxPerUnit]
}

export const fromPx = (grid: GridLayout, [px, py]: [number, number]): PlotPoint => {
  const [originX, originY] = grid.origin
  return { x: (px - originX) / grid.pxPerUnit, y: (originY - py) / grid.pxPerUnit }
}

type LineLook = {
  width: number
  dash: number[]
  alpha: number
  startTick: number
  endTick: number
  arrow: boolean
}

const lineLooks: Record<PlotLine["look"], LineLook> = {
  arrow: { width: 2.5, dash: [], alpha: 1, startTick: 9, endTick: 0, arrow: true },
  dashed: { width: 1.5, dash: [5, 4], alpha: 0.8, startTick: 0, endTick: 0, arrow: false },
  measured: { width: 3, dash: [], alpha: 1, startTick: 7, endTick: 7, arrow: false },
}

const tickWidth = 2
const arrowHeadLength = 9.8
const arrowHeadHalf = 4.9

const drawLine = (ctx: CanvasRenderingContext2D, grid: GridLayout, line: PlotLine, theme: ThemeVars) => {
  const look = lineLooks[line.look]
  const [x1, y1] = toPx(grid, line.from)
  const [x2, y2] = toPx(grid, line.to)
  const length = Math.hypot(x2 - x1, y2 - y1)
  if (length === 0) {
    return
  }
  const ux = (x2 - x1) / length
  const uy = (y2 - y1) / length
  const short = look.arrow ? Math.min(length, look.width) : 0
  const tick = (x: number, y: number, half: number) => {
    ctx.moveTo(x + uy * half, y - ux * half)
    ctx.lineTo(x - uy * half, y + ux * half)
  }
  ctx.save()
  ctx.globalAlpha = look.alpha
  ctx.strokeStyle = theme.primary
  ctx.fillStyle = theme.primary
  ctx.lineCap = "butt"
  ctx.lineWidth = look.width
  ctx.setLineDash(look.dash)
  ctx.lineDashOffset = (look.dash[0] ?? 0) / 2
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2 - ux * short, y2 - uy * short)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.lineWidth = tickWidth
  ctx.beginPath()
  tick(x1, y1, look.startTick)
  tick(x2, y2, look.endTick)
  ctx.stroke()
  if (look.arrow) {
    const baseX = x2 - ux * arrowHeadLength
    const baseY = y2 - uy * arrowHeadLength
    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(baseX - uy * arrowHeadHalf, baseY + ux * arrowHeadHalf)
    ctx.lineTo(baseX + uy * arrowHeadHalf, baseY - ux * arrowHeadHalf)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

const diamondRadius = 10
const squareSide = 16
const squareRadius = 3
const handleStroke = 2.5

const drawHandle = (
  ctx: CanvasRenderingContext2D,
  grid: GridLayout,
  handle: PlotHandle,
  theme: ThemeVars,
) => {
  const [x, y] = toPx(grid, handle.point)
  ctx.save()
  ctx.lineWidth = handleStroke
  ctx.lineJoin = "round"
  ctx.fillStyle = theme.background
  ctx.strokeStyle = theme.primary
  ctx.beginPath()
  if (handle.shape === "diamond") {
    ctx.moveTo(x, y - diamondRadius)
    ctx.lineTo(x + diamondRadius, y)
    ctx.lineTo(x, y + diamondRadius)
    ctx.lineTo(x - diamondRadius, y)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  } else {
    const half = squareSide / 2
    const inset = handleStroke / 2
    ctx.roundRect(x - half, y - half, squareSide, squareSide, squareRadius)
    ctx.fill()
    ctx.beginPath()
    ctx.roundRect(
      x - half + inset,
      y - half + inset,
      squareSide - handleStroke,
      squareSide - handleStroke,
      squareRadius - inset,
    )
    ctx.stroke()
  }
  ctx.restore()
}

const markerRadius = 12
const markerRing = 2.5
const markerCore = 6

const drawMarker = (
  ctx: CanvasRenderingContext2D,
  grid: GridLayout,
  marker: PlotMarker,
  theme: ThemeVars,
) => {
  const [x, y] = toPx(grid, marker.point)
  ctx.save()
  ctx.fillStyle = theme.background
  ctx.beginPath()
  ctx.arc(x, y, markerRadius, 0, Math.PI * 2)
  ctx.fill()
  ctx.lineWidth = markerRing
  ctx.strokeStyle = theme.foreground
  ctx.beginPath()
  ctx.arc(x, y, markerRadius - markerRing / 2, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = theme[marker.ink]
  ctx.beginPath()
  ctx.arc(x, y, markerCore, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// Each face's line box and baseline as Figma lays them out (ascent + descent + line gap).
const labelLetter = { font: labelLetterFont, height: 25, baseline: 17.74 }
const labelNumber = { font: labelNumberFont, height: 22, baseline: 17.81 }
const labelRow = Math.max(labelLetter.height, labelNumber.height)
const labelPadX = 12
const labelPadY = 6
const labelBorder = 2
const labelRunGap = 6
const labelGap = 22
const labelRise = 0.6
const labelEdgeMargin = 12

const drawLabel = (
  ctx: CanvasRenderingContext2D,
  grid: GridLayout,
  marker: PlotMarker,
  label: PlotLabel,
  theme: ThemeVars,
) => {
  const [px, py] = toPx(grid, marker.point)
  ctx.save()
  ctx.font = labelLetter.font
  const nameWidth = Math.ceil(ctx.measureText(label.name).width)
  ctx.font = labelNumber.font
  const coordsWidth = Math.ceil(ctx.measureText(label.coords).width)
  const inset = labelBorder + labelPadX
  const w = inset * 2 + nameWidth + labelRunGap + coordsWidth
  const h = (labelBorder + labelPadY) * 2 + labelRow
  const x = clamp(px + labelGap, labelEdgeMargin, grid.width - labelEdgeMargin - w)
  const y = clamp(py - labelGap * labelRise - h, labelEdgeMargin, grid.height - labelEdgeMargin - h)
  const rowTop = y + labelBorder + labelPadY
  const baseline = (face: typeof labelLetter) => rowTop + (labelRow - face.height) / 2 + face.baseline

  ctx.fillStyle = theme.card
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, h / 2)
  ctx.fill()
  const half = labelBorder / 2
  ctx.lineWidth = labelBorder
  ctx.strokeStyle = theme[marker.ink]
  ctx.beginPath()
  ctx.roundRect(x + half, y + half, w - labelBorder, h - labelBorder, h / 2 - half)
  ctx.stroke()

  ctx.fillStyle = theme.foreground
  ctx.textAlign = "left"
  ctx.textBaseline = "alphabetic"
  ctx.font = labelLetter.font
  ctx.fillText(label.name, x + inset, baseline(labelLetter))
  ctx.font = labelNumber.font
  ctx.fillText(label.coords, x + inset + nameWidth + labelRunGap, baseline(labelNumber))
  ctx.restore()
}

export const hitTest = (
  grid: GridLayout,
  handles: readonly PlotHandle[],
  [px, py]: [number, number],
  action: PlotMouseHandlerAction,
): number =>
  handles.findLastIndex((handle) => {
    if (handle.handlers?.[action] === undefined) {
      return false
    }
    const [x, y] = toPx(grid, handle.point)
    const dx = Math.abs(px - x)
    const dy = Math.abs(py - y)
    return handle.shape === "diamond" ? dx + dy <= diamondRadius : Math.max(dx, dy) <= squareSide / 2
  })

export const drawCartesianPlane = (
  ctx: CanvasRenderingContext2D,
  grid: GridLayout,
  theme: ThemeVars,
  font: string | null,
  curves: readonly PlotCurve[],
  handles: readonly PlotHandle[],
  lines: readonly PlotLine[],
  markers: readonly PlotMarker[],
) => {
  drawGrid(ctx, grid, theme, font)
  for (const curve of curves.filter(({ dashed }) => dashed === true)) {
    drawCurve(ctx, grid, curve, theme)
  }
  for (const line of lines) {
    drawLine(ctx, grid, line, theme)
  }
  for (const curve of curves.filter(({ dashed }) => dashed !== true)) {
    drawCurve(ctx, grid, curve, theme)
  }
  for (const handle of handles) {
    drawHandle(ctx, grid, handle, theme)
  }
  for (const marker of markers) {
    drawMarker(ctx, grid, marker, theme)
    if (font !== null && marker.label !== undefined) {
      drawLabel(ctx, grid, marker, marker.label, theme)
    }
  }
  if (font !== null) {
    drawScaleLegend(ctx, grid, theme, font)
  }
}
