import type { ThemeVars } from "#src/state/useAppTheme.ts"

import type { AnnotationMarks, AnnotationStroke, Segment } from "../marks.ts"

import { dashPhase } from "./guides.ts"

/** Ticks across a line's ends: 2 px (fvDrawCanvas: "From y = 0", the unit box's "Ends"). */
const TICK_WIDTH = 2
/** fvArrowHead: 9.8 px from tip to base, 9.8 px across. */
const ARROW_LENGTH = 9.8
const ARROW_HALF = 4.9

const unit = (s: Segment): { ux: number; uy: number; length: number } => {
  const length = Math.hypot(s.x2 - s.x1, s.y2 - s.y1)
  return length === 0
    ? { ux: 0, uy: 0, length }
    : { ux: (s.x2 - s.x1) / length, uy: (s.y2 - s.y1) / length, length }
}

/** An arrowhead whose tip sits on the segment's end, pointing along it. */
export const paintArrowhead = (ctx: CanvasRenderingContext2D, s: Segment, color: string) => {
  const { ux, uy, length } = unit(s)
  if (length === 0) {
    return
  }
  const bx = s.x2 - ux * ARROW_LENGTH
  const by = s.y2 - uy * ARROW_LENGTH
  ctx.beginPath()
  ctx.moveTo(s.x2, s.y2)
  ctx.lineTo(bx - uy * ARROW_HALF, by + ux * ARROW_HALF)
  ctx.lineTo(bx + uy * ARROW_HALF, by - ux * ARROW_HALF)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

/**
 * A straight line, butt-ended. With an arrowhead it stops short of the tip
 * by its own width, where the head is as wide as the line, so no corner
 * pokes out of the head.
 */
export const paintLine = (
  ctx: CanvasRenderingContext2D,
  s: Segment,
  width: number,
  color: string,
  options: { dash?: readonly number[]; arrow?: boolean } = {},
) => {
  const { ux, uy, length } = unit(s)
  const short = options.arrow === true ? Math.min(length, Math.max(2, width)) : 0
  ctx.save()
  ctx.lineCap = "butt"
  ctx.lineWidth = width
  ctx.strokeStyle = color
  if (options.dash !== undefined) {
    ctx.setLineDash([...options.dash])
    ctx.lineDashOffset = dashPhase(options.dash)
  }
  if (length - short > 0) {
    ctx.beginPath()
    ctx.moveTo(s.x1, s.y1)
    ctx.lineTo(s.x2 - ux * short, s.y2 - uy * short)
    ctx.stroke()
  }
  ctx.restore()
  if (options.arrow === true) {
    paintArrowhead(ctx, s, color)
  }
}

/** A tick across the point (x, y), perpendicular to the direction (ux, uy). */
const tick = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: { ux: number; uy: number },
  half: number,
) => {
  // A zero-length line has no direction: its tick stands across a horizontal one.
  const nx = dir.ux === 0 && dir.uy === 0 ? 0 : -dir.uy
  const ny = dir.ux === 0 && dir.uy === 0 ? 1 : dir.ux
  ctx.moveTo(x - nx * half, y - ny * half)
  ctx.lineTo(x + nx * half, y + ny * half)
}

const paintStroke = (ctx: CanvasRenderingContext2D, stroke: AnnotationStroke, color: string) => {
  ctx.save()
  if (stroke.alpha !== undefined) {
    ctx.globalAlpha = stroke.alpha
  }
  paintLine(ctx, stroke, stroke.width, color, {
    ...(stroke.dash === undefined ? {} : { dash: stroke.dash }),
    ...(stroke.arrow === undefined ? {} : { arrow: stroke.arrow }),
  })
  const dir = unit(stroke)
  ctx.lineCap = "butt"
  ctx.lineWidth = TICK_WIDTH
  ctx.strokeStyle = color
  ctx.beginPath()
  if (stroke.startTick !== undefined) {
    tick(ctx, stroke.x1, stroke.y1, dir, stroke.startTick)
  }
  if (stroke.endTicks !== undefined) {
    tick(ctx, stroke.x1, stroke.y1, dir, stroke.endTicks)
    tick(ctx, stroke.x2, stroke.y2, dir, stroke.endTicks)
  }
  ctx.stroke()
  ctx.restore()
}

/** An annotation: its lines with their ticks and arrowheads. */
export const paintAnnotation = (ctx: CanvasRenderingContext2D, marks: AnnotationMarks, theme: ThemeVars) => {
  const color = theme[marks.ink]
  for (const stroke of marks.strokes) {
    paintStroke(ctx, stroke, color)
  }
}
