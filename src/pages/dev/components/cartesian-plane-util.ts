import type { ThemeVars } from "#src/state/useAppTheme.ts"

const gridScale = 40

const cartesianToCtx = (width: number, height: number, x: number, y: number): [number, number] => {
  return [Math.floor(width / 2) + x * gridScale, Math.floor(height / 2) - y * gridScale]
}

const plotFunc = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  xStart: number,
  xEnd: number,
  f: (x: number) => number,
  color: string,
): void => {
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(...cartesianToCtx(width, height, xStart, f(xStart)))
  const step = (xEnd - xStart) / width
  for (let x = xStart; x <= xEnd; x += step) {
    ctx.lineTo(...cartesianToCtx(width, height, x, f(x)))
  }
  ctx.stroke()
}

const fx = (x: number) => x ** 2

export const drawCartesianPlane = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  themeVars: ThemeVars,
) => {
  if (!ctx || width === 0 || height === 0) {
    return
  }
  console.log("draw plane3")
  const yUnits = Math.floor(height / gridScale)
  const xUnits = Math.floor(width / gridScale)
  const xStart = -Math.floor(xUnits / 2)
  const xEnd = xStart + xUnits
  const yStart = -Math.floor(yUnits / 2)
  const yEnd = yStart + yUnits

  ctx.strokeStyle = themeVars.chartGrid
  ctx.lineWidth = 0.5

  for (let x = xStart; x <= xEnd; x++) {
    const ctxX = Math.floor(width / 2) + x * gridScale
    ctx.lineWidth = x === 0 ? 1.5 : 0.5
    ctx.beginPath()
    ctx.moveTo(ctxX, 0)
    ctx.lineTo(ctxX, height)
    ctx.stroke()
  }

  for (let y = yStart; y <= yEnd; y++) {
    ctx.lineWidth = y === 0 ? 1.5 : 0.5
    const ctxY = Math.floor(height / 2) - y * gridScale
    ctx.beginPath()
    ctx.moveTo(0, ctxY)
    ctx.lineTo(width, ctxY)
    ctx.stroke()
  }

  plotFunc(ctx, width, height, xStart, xEnd, fx, themeVars.chartLine)

  const point = cartesianToCtx(width, height, -5.5, -3.5)
  ctx.beginPath()
  ctx.arc(...point, gridScale / 2, 0, 2 * Math.PI)
  ctx.stroke()
  ctx.fillStyle = "green"
  ctx.fill()
}
