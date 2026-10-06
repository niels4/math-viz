import type { ThemeVars } from "#src/state/useAppTheme.ts"

import type { PlotFunc } from "./types"

const xToCtx = (width: number, zoom: number, panX: number, x: number): number => {
  return Math.floor(width / 2) + (x + panX) * zoom
}

const ctxTox = (width: number, zoom: number, panX: number, ctxX: number): number => {
  return (ctxX - Math.floor(width / 2)) / zoom - panX
}

const yToCtx = (height: number, zoom: number, panY: number, y: number): number => {
  return Math.floor(height / 2) - (y + panY) * zoom
}

const ctxToy = (height: number, zoom: number, panY: number, ctxY: number): number => {
  return (Math.floor(height / 2) - ctxY) / zoom - panY
}

const MIN_GRID_PX = 20

// Grid spacing in math units, snapped to 1/2/5 x 10^n so lines stay at
// least MIN_GRID_PX apart: zoomed far out we skip units, zoomed far in we
// subdivide them.
const gridStep = (zoom: number): number => {
  const raw = MIN_GRID_PX / zoom
  const mag = 10 ** Math.floor(Math.log10(raw))
  const m = raw / mag
  if (m <= 1) {
    return mag
  }
  if (m <= 2) {
    return 2 * mag
  }
  if (m <= 5) {
    return 5 * mag
  }
  return 10 * mag
}

// "1.5" instead of "1.5 units"-style float noise like 0.30000000000000004.
const formatStep = (step: number): string => {
  return String(Number(step.toPrecision(12)))
}

// Design system: Roboto Mono owns metrics/HUD numbers (see dev/font-demo:
// Work Sans is UI text, STIX Two Text is equations only). This stack mirrors
// src/style/fonts/roboto_mono/roboto_mono.module.css `.font`; the face
// itself loads globally via src/style/global.css.
export const SCALE_FONT = `14px "Roboto Mono", ui-monospace, SFMono-Regular, Menlo, monospace`

// Scale bar, one grid square wide: the bar matches the grid spacing on
// screen, the label says how many math units that square represents.
const drawScale = ({ ctx, width, height, themeVars, zoom }: DrawCartesianPlaneProps) => {
  const step = gridStep(zoom)
  const barPx = step * zoom
  const padY = 16
  const padX = 40
  const tick = 6
  const x2 = width - padX + barPx / 2
  const x1 = Math.max(padY, x2 - barPx)
  const yBar = height - padY
  const label = `${formatStep(step)} ${step === 1 ? "unit" : "units"}`
  const labelPad = 8

  ctx.save()
  ctx.strokeStyle = themeVars.foreground
  ctx.fillStyle = themeVars.foreground
  ctx.lineWidth = 2
  ctx.font = SCALE_FONT
  ctx.textAlign = "center"
  ctx.textBaseline = "bottom"
  ctx.beginPath()
  ctx.moveTo(x1, yBar)
  ctx.lineTo(x2, yBar)
  ctx.moveTo(x1, yBar)
  ctx.lineTo(x1, yBar - tick)
  ctx.moveTo(x2, yBar)
  ctx.lineTo(x2, yBar - tick)
  ctx.stroke()
  ctx.fillText(label, (x1 + x2) / 2, yBar - tick - labelPad)
  ctx.restore()
}

const drawGrid = ({ ctx, width, height, themeVars, zoom, panX, panY }: DrawCartesianPlaneProps) => {
  ctx.strokeStyle = themeVars.chartGrid
  ctx.lineWidth = 0.5

  // Visible math range from the screen edges: flooring the dimension
  // first undercounts the half-extent by up to a unit and drops the
  // outermost lines, so edge squares render as rectangles.
  const step = gridStep(zoom)
  const xMin = ctxTox(width, zoom, panX, 0)
  const xMax = ctxTox(width, zoom, panX, width)
  for (let n = Math.ceil(xMin / step); n * step <= xMax; n++) {
    const ctxX = xToCtx(width, zoom, panX, n * step)
    ctx.beginPath()
    ctx.moveTo(ctxX, 0)
    ctx.lineTo(ctxX, height)
    ctx.stroke()
  }

  const yBottom = ctxToy(height, zoom, panY, height)
  const yTop = ctxToy(height, zoom, panY, 0)
  for (let n = Math.ceil(yBottom / step); n * step <= yTop; n++) {
    const ctxY = yToCtx(height, zoom, panY, n * step)
    ctx.beginPath()
    ctx.moveTo(0, ctxY)
    ctx.lineTo(width, ctxY)
    ctx.stroke()
  }

  ctx.lineWidth = 2.5
  ctx.beginPath()
  const xOrigin = xToCtx(width, zoom, panX, 0)
  ctx.moveTo(xOrigin, 0)
  ctx.lineTo(xOrigin, height)
  ctx.stroke()

  ctx.lineWidth = 2.5
  ctx.beginPath()
  const yOrigin = yToCtx(height, zoom, panY, 0)
  ctx.moveTo(0, yOrigin)
  ctx.lineTo(width, yOrigin)
  ctx.stroke()
}

const drawPlotFunction = ({
  ctx,
  width,
  height,
  zoom,
  panX,
  panY,
  themeVars,
  plotFunc,
}: DrawCartesianPlaneProps) => {
  if (!plotFunc) {
    return
  }
  ctx.strokeStyle = themeVars.chartLine
  ctx.lineWidth = 3.5
  ctx.beginPath()

  const x = ctxTox(width, zoom, panX, 0)
  const ctxY = yToCtx(height, zoom, panY, plotFunc(x))
  ctx.moveTo(0, ctxY)

  for (let ctxX = 0; ctxX <= width; ctxX++) {
    const x = ctxTox(width, zoom, panX, ctxX)
    const ctxY = yToCtx(height, zoom, panY, plotFunc(x))
    ctx.lineTo(ctxX, ctxY)
  }

  ctx.stroke()
}

export const drawCircle = (
  { ctx, width, height, zoom, panX, panY }: DrawCartesianPlaneProps,
  cx: number,
  cy: number,
  radius: number,
  strokeColor: string,
  fillColor: string,
  strokeWidth: number,
) => {
  if (radius <= 0) {
    return
  }
  const x = xToCtx(width, zoom, panX, cx)
  const y = yToCtx(height, zoom, panY, cy)
  const r = radius * zoom

  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2)
  ctx.fillStyle = fillColor
  ctx.fill()
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = strokeWidth
  ctx.stroke()
  ctx.restore()
}

const drawPoint1 = (props: DrawCartesianPlaneProps) => {
  const { plotFunc, themeVars, zoom, point1X } = props
  if (point1X == null) {
    return
  }
  if (plotFunc == null || zoom <= 0) {
    return
  }
  const y = plotFunc(point1X)
  drawCircle(props, point1X, y, 8 / zoom, themeVars.foreground, themeVars.ordinal05, 2)
}

const drawPoint2 = (props: DrawCartesianPlaneProps) => {
  const { plotFunc, themeVars, zoom, point2X } = props
  if (point2X == null) {
    return
  }
  if (plotFunc == null || zoom <= 0) {
    return
  }
  const y = plotFunc(point2X)
  drawCircle(props, point2X, y, 8 / zoom, themeVars.foreground, themeVars.chartAccent, 2)
}

type DrawCartesianPlaneProps = {
  ctx: CanvasRenderingContext2D
  themeVars: ThemeVars
  width: number
  height: number
  dpr: number
  zoom: number
  panX: number
  panY: number
  // `| undefined`: callers pass through a destructured optional, which reads
  // as `PlotFunc | undefined` and is rejected under exactOptionalPropertyTypes.
  plotFunc?: PlotFunc | undefined
  point1X?: number | undefined
  point2X?: number | undefined
}

export const drawCartesianPlane = (props: DrawCartesianPlaneProps) => {
  const { ctx, width, height } = props

  if (!ctx || width === 0 || height === 0) {
    return
  }

  drawGrid(props)
  drawScale(props)
  drawPlotFunction(props)
  drawPoint1(props)
  drawPoint2(props)
}
