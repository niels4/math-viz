import { drawOverlay } from "./drawOverlay"

const unscaledUnitSize = 25
const center = [0.53, 2.29] as const
const zoomIn = 4.67
const zoom = Math.min(Math.max(0.1, zoomIn), 5)

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
    const startX = center[0] >= 0 ? Math.floor(center[0]) : Math.ceil(center[0])
    const x1 = startX + i
    const x2 = startX - i

    ctx.strokeStyle = x1 === 0 ? "#0f0" : "#fff"
    ctx.beginPath()
    ctx.moveTo(ctx1, 0)
    ctx.lineTo(ctx1, height)
    ctx.stroke()

    ctx.strokeStyle = x2 === 0 ? "#0f0" : "#fff"
    ctx.beginPath()
    ctx.moveTo(ctx2, 0)
    ctx.lineTo(ctx2, height)
    ctx.stroke()

    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillStyle = "hsl(160, 70%, 40%)"
    ctx.fillText(String(x1), ctx1, ctxCenterY)
    ctx.fillText(String(x2), ctx2, ctxCenterY)
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

    ctx.strokeStyle = y1 === 0 ? "#0f0" : "#fff"
    ctx.beginPath()
    ctx.moveTo(0, ctx1)
    ctx.lineTo(width, ctx1)
    ctx.stroke()

    ctx.strokeStyle = y2 === 0 ? "#0f0" : "#fff"
    ctx.beginPath()
    ctx.moveTo(0, ctx2)
    ctx.lineTo(width, ctx2)
    ctx.stroke()

    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillStyle = "hsl(160, 70%, 40%)"
    ctx.fillText(String(y1), ctxCenterX, ctx1)
    ctx.fillText(String(y2), ctxCenterX, ctx2)
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
