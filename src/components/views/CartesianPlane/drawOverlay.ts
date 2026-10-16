import { formatFixed } from "#src/util/format.ts"

const scaleWindowRight = 10
const scaleWindowBottom = 10
const scaleWindowPadding = 10
const scaleLegendHeight = 5
const scaleWindowHeight = scaleLegendHeight + scaleWindowPadding * 2

export const drawOverlay = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  unscaledUnitSize: number,
  zoom: number,
) => {
  ctx.strokeStyle = "hsl(0, 0%, 30%)"
  ctx.lineWidth = 1

  ctx.font = `12px "Roboto Mono"`
  const scaleText = ` ${formatFixed(2, zoom)} u`
  const scaleWindowTextWidth = ctx.measureText(scaleText).width

  const scaleWindowWidth = unscaledUnitSize + scaleWindowTextWidth + scaleWindowPadding * 2

  ctx.fillStyle = "hsl(0 0%, 20%)"
  ctx.beginPath()
  ctx.moveTo(width - scaleWindowRight, height - scaleWindowBottom)
  ctx.roundRect(
    width - scaleWindowRight,
    height - scaleWindowBottom,
    -scaleWindowWidth,
    -scaleWindowHeight,
    4,
  )
  ctx.fill()
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
