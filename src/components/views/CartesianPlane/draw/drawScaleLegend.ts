import type { ThemeVars } from "#src/state/useAppTheme.ts"

import { formatFixed } from "#src/util/format.ts"

import type { GridLayout } from "./grid"

import { unscaledUnitSize } from "../constants"

const scaleWindowRight = 28
const scaleWindowBottom = 22
const scaleWindowPaddingX = 14
const scaleWindowPaddingY = 8
const scaleWindowRadius = 4
const scaleLabelGap = 8
const scaleLabelLineHeight = 18
const scaleLegendHeight = 5
const scaleWindowHeight = scaleLabelLineHeight + scaleWindowPaddingY * 2

export const drawScaleLegend = (
  ctx: CanvasRenderingContext2D,
  { width, height, scale }: GridLayout,
  theme: ThemeVars,
  font: string,
) => {
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
