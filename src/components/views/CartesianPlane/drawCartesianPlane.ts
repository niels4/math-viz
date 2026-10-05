import type { ThemeVars } from "#src/state/useAppTheme.ts"

const xToCtx = (width: number, zoom: number, panX: number, x: number): number => {
  return Math.floor(width / 2) + (x + panX) * zoom
}

const yToCtx = (height: number, zoom: number, panY: number, y: number): number => {
  return Math.floor(height / 2) - (y + panY) * zoom
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
  ctx.font = "14px system-ui, sans-serif"
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
  const widthUnits = Math.floor(width / zoom)
  const halfWidthUnits = Math.floor(widthUnits / 2)
  const xStart = Math.floor(-halfWidthUnits - panX)
  const xEnd = Math.ceil(halfWidthUnits - panX)

  ctx.strokeStyle = themeVars.chartGrid
  ctx.lineWidth = 0.5

  const stepX = gridStep(zoom)
  for (let n = Math.ceil(xStart / stepX); n <= Math.floor(xEnd / stepX); n++) {
    const ctxX = xToCtx(width, zoom, panX, n * stepX)
    ctx.beginPath()
    ctx.moveTo(ctxX, 0)
    ctx.lineTo(ctxX, height)
    ctx.stroke()
  }

  const heightUnits = Math.floor(height / zoom)
  const halfHeightUnits = Math.floor(heightUnits / 2)
  const yStart = Math.floor(-halfHeightUnits - panY)
  const yEnd = Math.ceil(halfHeightUnits - panY)
  const stepY = gridStep(zoom)
  for (let n = Math.ceil(yStart / stepY); n <= Math.floor(yEnd / stepY); n++) {
    const ctxY = yToCtx(height, zoom, panY, n * stepY)
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

type DrawCartesianPlaneProps = {
  ctx: CanvasRenderingContext2D
  themeVars: ThemeVars
  width: number
  height: number
  dpr: number
  zoom: number
  panX: number
  panY: number
}

export const drawCartesianPlane = (props: DrawCartesianPlaneProps) => {
  const { ctx, width, height, zoom, panX, panY } = props

  if (!ctx || width === 0 || height === 0) {
    return
  }

  drawGrid(props)
  drawScale(props)

  ctx.beginPath()
  ctx.arc(xToCtx(width, zoom, panX, -5), yToCtx(height, zoom, panY, 2), zoom / 2, 0, 2 * Math.PI)
  ctx.stroke()
  ctx.fillStyle = "green"
  ctx.fill()

  ctx.beginPath()
  ctx.arc(xToCtx(width, zoom, panX, 0), yToCtx(height, zoom, panY, 0), 10, 0, 2 * Math.PI)
  ctx.stroke()
  ctx.fillStyle = "blue"
  ctx.fill()
}
