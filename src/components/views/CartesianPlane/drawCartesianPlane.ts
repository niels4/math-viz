import { formatFixed } from "#src/util/format.ts"

const center = [0, 0]
const zoom = 10.34

const unscaledUnitSize = 25

const scaleWindowRight = 10
const scaleWindowBottom = 10
const scaleWindowPadding = 10
const scaleLegendHeight = 5
const scaleWindowHeight = scaleLegendHeight + scaleWindowPadding * 2

const drawOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.strokeStyle = "hsl(0, 0%, 30%)"
  ctx.lineWidth = 1

  ctx.font = `12px "Roboto Mono"`
  const scaleText = ` ${formatFixed(2, zoom)} u`
  const scaleWindowTextWidth = ctx.measureText(scaleText).width

  const scaleWindowWidth = unscaledUnitSize + scaleWindowTextWidth + scaleWindowPadding * 2

  ctx.beginPath()
  ctx.moveTo(width - scaleWindowRight, height - scaleWindowBottom)
  ctx.roundRect(
    width - scaleWindowRight,
    height - scaleWindowBottom,
    -scaleWindowWidth,
    -scaleWindowHeight,
    4,
  )
  ctx.stroke()

  ctx.lineWidth = 1.5
  ctx.strokeStyle = "hsl(0, 0%, 100%)"
  let curX = width - scaleWindowRight - scaleWindowPadding - scaleWindowTextWidth - unscaledUnitSize
  let curY = height - scaleWindowBottom - scaleWindowPadding - scaleLegendHeight
  ctx.beginPath()
  ctx.moveTo(curX, curY)
  ctx.lineTo(curX, (curY += scaleLegendHeight))
  ctx.lineTo((curX += unscaledUnitSize), curY)
  ctx.lineTo(curX, (curY -= scaleLegendHeight))
  ctx.stroke()

  ctx.textAlign = "left"
  ctx.textBaseline = "middle"
  ctx.fillStyle = "hsl(0, 0%, 100%)"
  curY += scaleLegendHeight / 2
  ctx.fillText(scaleText, curX, curY)
}

export const drawCartesianPlane = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.strokeStyle = "#fff"
  ctx.lineWidth = 1

  const x0 = Math.floor(width / 2) + 0.5
  const y0 = Math.floor(height / 2) + 0.5

  ctx.beginPath()
  ctx.moveTo(0, y0)
  ctx.lineTo(width, y0)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(x0, 0)
  ctx.lineTo(x0, height)
  ctx.stroke()

  ctx.strokeStyle = "#0ff"
  ctx.fillStyle = "#0ff"
  ctx.beginPath()
  ctx.arc(width / 2 - 120, height / 2 + 89, 50, 0, Math.PI * 2)
  ctx.fill()

  drawOverlay(ctx, width, height)
}
