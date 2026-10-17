import type { ThemeVars } from "#src/state/useAppTheme.ts"

import { formatFixed } from "#src/util/format.ts"

const scaleWindowRight = 24
const scaleWindowBottom = 24
const scaleWindowPadding = 10
const scaleLegendHeight = 5
const scaleWindowHeight = scaleLegendHeight + scaleWindowPadding * 2

export const drawScaleLegend = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  unscaledUnitSize: number,
  scale: number,
  theme: ThemeVars,
  font: string,
) => {
  // chartGrid carries the --border value in every theme, so it rims the
  // plate the way the reference's var(--border) does.
  ctx.strokeStyle = theme.chartGrid
  ctx.lineWidth = 1

  ctx.font = font
  const scaleText = ` ${formatFixed(2, scale)} u`
  const scaleWindowTextWidth = ctx.measureText(scaleText).width

  const scaleWindowWidth = unscaledUnitSize + scaleWindowTextWidth + scaleWindowPadding * 2

  ctx.fillStyle = theme.background
  ctx.beginPath()
  ctx.roundRect(
    width - scaleWindowRight,
    height - scaleWindowBottom,
    -scaleWindowWidth,
    -scaleWindowHeight,
    4,
  )
  ctx.fill()
  ctx.stroke()

  ctx.lineWidth = 2
  ctx.strokeStyle = theme.foreground
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
  ctx.fillStyle = theme.foregroundMuted
  curY += scaleLegendHeight / 2
  ctx.fillText(scaleText, curX, curY)
}
