import type { ThemeVars } from "#src/state/useAppTheme.ts"

export type PlaneView = {
  /** pixels per math unit */
  scale: number
  /** math-unit offset added to x before scaling */
  panX: number
  /** math-unit offset added to y before scaling */
  panY: number
}

export const DEFAULT_VIEW: PlaneView = {
  scale: 11,
  panX: -2,
  panY: -6,
}

export const MIN_SCALE = 4
export const MAX_SCALE = 200

const screenToMath = (
  width: number,
  height: number,
  sx: number,
  sy: number,
  view: PlaneView,
): [number, number] => {
  return [
    (sx - Math.floor(width / 2)) / view.scale - view.panX,
    -(sy - Math.floor(height / 2)) / view.scale - view.panY,
  ]
}

const cartesianToCtx = (
  width: number,
  height: number,
  x: number,
  y: number,
  view: PlaneView,
): [number, number] => {
  return [
    Math.floor(width / 2) + (x + view.panX) * view.scale,
    Math.floor(height / 2) - (y + view.panY) * view.scale,
  ]
}

const plotFunc = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  xStart: number,
  xEnd: number,
  f: (x: number) => number,
  color: string,
  view: PlaneView,
): void => {
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(...cartesianToCtx(width, height, xStart, f(xStart), view))
  const step = (xEnd - xStart) / Math.max(1, width)
  for (let x = xStart; x <= xEnd; x += step) {
    ctx.lineTo(...cartesianToCtx(width, height, x, f(x), view))
  }
  ctx.stroke()
}

const fx = (x: number) => x ** 2

export const drawCartesianPlane = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  themeVars: ThemeVars,
  view: PlaneView,
) => {
  if (!ctx || width === 0 || height === 0) {
    return
  }
  const [mathLeft, mathTop] = screenToMath(width, height, 0, 0, view)
  const [mathRight, mathBottom] = screenToMath(width, height, width, height, view)

  ctx.strokeStyle = themeVars.chartGrid
  ctx.lineWidth = 0.5

  for (let x = Math.ceil(mathLeft); x <= Math.floor(mathRight); x++) {
    const ctxX = Math.floor(width / 2) + (x + view.panX) * view.scale
    ctx.lineWidth = x === 0 ? 1.5 : 0.5
    ctx.beginPath()
    ctx.moveTo(ctxX, 0)
    ctx.lineTo(ctxX, height)
    ctx.stroke()
  }

  for (let y = Math.ceil(mathBottom); y <= Math.floor(mathTop); y++) {
    ctx.lineWidth = y === 0 ? 1.5 : 0.5
    const ctxY = Math.floor(height / 2) - (y + view.panY) * view.scale
    ctx.beginPath()
    ctx.moveTo(0, ctxY)
    ctx.lineTo(width, ctxY)
    ctx.stroke()
  }

  plotFunc(ctx, width, height, mathLeft, mathRight, fx, themeVars.chartLine, view)

  const point = cartesianToCtx(width, height, -5.5, -3.5, view)
  ctx.beginPath()
  ctx.arc(...point, view.scale / 2, 0, 2 * Math.PI)
  ctx.stroke()
  ctx.fillStyle = "green"
  ctx.fill()
}
