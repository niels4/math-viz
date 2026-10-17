import type { ThemeVars } from "#src/state/useAppTheme.ts"

import { formatFixed } from "#src/util/format.ts"

// The window sits inside the bottom-right corner bracket (HtmlOverlay), clear
// of both its arms.
const scaleWindowRight = 28
const scaleWindowBottom = 22
const scaleWindowPaddingX = 14
const scaleWindowPaddingY = 8
const scaleWindowRadius = 4
// Space between the legend's unit bar and its label.
const scaleLabelGap = 8
// Line height of the label in planeFont, which sets the window's height.
const scaleLabelLineHeight = 18
const scaleLegendHeight = 5
const scaleWindowHeight = scaleLabelLineHeight + scaleWindowPaddingY * 2

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
  const scaleText = `${formatFixed(2, scale)} u`
  const scaleTextWidth = ctx.measureText(scaleText).width

  const scaleWindowWidth = scaleWindowPaddingX * 2 + unscaledUnitSize + scaleLabelGap + scaleTextWidth
  const windowLeft = width - scaleWindowRight - scaleWindowWidth
  const windowTop = height - scaleWindowBottom - scaleWindowHeight
  const middleY = windowTop + scaleWindowHeight / 2

  ctx.fillStyle = theme.background
  ctx.beginPath()
  ctx.roundRect(windowLeft, windowTop, scaleWindowWidth, scaleWindowHeight, scaleWindowRadius)
  ctx.fill()
  ctx.stroke()

  ctx.lineWidth = 2
  ctx.strokeStyle = theme.foreground
  let curX = windowLeft + scaleWindowPaddingX
  let curY = middleY - scaleLegendHeight / 2
  ctx.beginPath()
  ctx.moveTo(curX, curY)
  ctx.lineTo(curX, (curY += scaleLegendHeight))
  ctx.lineTo((curX += unscaledUnitSize), curY)
  ctx.lineTo(curX, (curY -= scaleLegendHeight))
  ctx.stroke()

  ctx.textAlign = "left"
  ctx.textBaseline = "middle"
  ctx.fillStyle = theme.foregroundMuted
  ctx.fillText(scaleText, curX + scaleLabelGap, middleY)
}
