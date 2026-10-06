import type { ThemeVars } from "#src/state/useAppTheme.ts"

import type { MarksLayout } from "../marks.ts"

/** The pointer guide: 1 px dashed 4 6 in --foreground-muted, full height (FV 01 › Q probe). */
const GUIDE_WIDTH = 1
const GUIDE_DASH = [4, 6]
/** Drop lines: 1.5 px dashed 5 4 in the point's ink, from the point to the axes. */
const DROP_WIDTH = 1.5
const DROP_DASH = [5, 4]

/** Figma centres a dash pattern's first dash on the path's start: half a dash before it. */
export const dashPhase = (dash: readonly number[]): number => (dash[0] ?? 0) / 2

export const paintGuides = (
  ctx: CanvasRenderingContext2D,
  marks: MarksLayout,
  theme: ThemeVars,
  height: number,
) => {
  ctx.save()
  ctx.lineCap = "butt"
  if (marks.guides.length > 0) {
    ctx.strokeStyle = theme.foregroundMuted
    ctx.lineWidth = GUIDE_WIDTH
    ctx.setLineDash(GUIDE_DASH)
    ctx.lineDashOffset = dashPhase(GUIDE_DASH)
    ctx.beginPath()
    for (const x of marks.guides) {
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
    }
    ctx.stroke()
  }
  ctx.lineWidth = DROP_WIDTH
  ctx.setLineDash(DROP_DASH)
  ctx.lineDashOffset = dashPhase(DROP_DASH)
  for (const line of marks.dropLines) {
    if (line.x1 === line.x2 && line.y1 === line.y2) {
      continue
    }
    ctx.strokeStyle = theme[line.ink]
    ctx.beginPath()
    ctx.moveTo(line.x1, line.y1)
    ctx.lineTo(line.x2, line.y2)
    ctx.stroke()
  }
  ctx.restore()
}
