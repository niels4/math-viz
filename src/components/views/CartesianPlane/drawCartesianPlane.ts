import { drawOverlay } from "./drawOverlay"

const unscaledUnitSize = 25
const center = [0.2, -0.4] as const
const zoom = 1.04

const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.strokeStyle = "#fff"
  ctx.lineWidth = 1
  const unitSize = unscaledUnitSize / zoom

  const ctxCenterX = Math.floor(width / 2)
  const ctxCenterY = Math.floor(height / 2)

  const numWidthUnits = Math.ceil(width / unitSize)
  const halfNumWidthUnits = Math.ceil(numWidthUnits / 2) + 1
  const xOffset = (center[0] % 1) * unitSize

  for (let i = 0; i < halfNumWidthUnits; i++) {
    const ctxDiff = i * unitSize
    const ctx1 = ctxCenterX + ctxDiff - xOffset
    const ctx2 = ctxCenterX - ctxDiff - xOffset

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

    ctx.beginPath()
    ctx.moveTo(0, ctx1)
    ctx.lineTo(width, ctx1)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, ctx2)
    ctx.lineTo(width, ctx2)
    ctx.stroke()
  }
}

export const drawCartesianPlane = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  drawGrid(ctx, width, height)
  drawOverlay(ctx, width, height, unscaledUnitSize, zoom)

  ctx.fillStyle = "#0ff"
  ctx.beginPath()
  ctx.arc(width / 2 - 120, height / 2 + 89, 50, 0, Math.PI * 2)
  ctx.fill()
}
