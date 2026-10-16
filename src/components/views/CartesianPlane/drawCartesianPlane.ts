import { drawOverlay } from "./drawOverlay"

const unscaledUnitSize = 25
const center = [-1.33, -1.17] as const
const zoom = 1.04

const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.strokeStyle = "#fff"
  ctx.lineWidth = 1
  const unitSize = unscaledUnitSize / zoom

  const ctxCenterX = Math.floor(width / 2)
  const numWidthUnits = Math.ceil(width / unitSize)
  const halfNumWidthUnits = Math.ceil(numWidthUnits / 2)
  const xOffset = center[0] * unitSize

  for (let i = 0; i < halfNumWidthUnits; i++) {
    const xDiff = i * unitSize

    ctx.beginPath()
    ctx.moveTo(ctxCenterX + xDiff - xOffset, 0)
    ctx.lineTo(ctxCenterX + xDiff - xOffset, height)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(ctxCenterX - xDiff - xOffset, 0)
    ctx.lineTo(ctxCenterX - xDiff - xOffset, height)
    ctx.stroke()
  }

  const ctxCenterY = Math.floor(height / 2)
  const numHeightUnits = Math.ceil(height / unitSize)
  const halfNumHeightUnits = Math.ceil(numHeightUnits / 2) + 1
  const yOffset = center[1] * unitSize

  for (let i = 0; i < halfNumHeightUnits; i++) {
    const yDiff = i * unitSize

    ctx.beginPath()
    ctx.moveTo(0, ctxCenterY + yDiff + yOffset)
    ctx.lineTo(width, ctxCenterY + yDiff + yOffset)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, ctxCenterY - yDiff + yOffset)
    ctx.lineTo(width, ctxCenterY - yDiff + yOffset)
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
