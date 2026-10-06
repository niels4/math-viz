import type { ThemeVars } from "#src/state/useAppTheme.ts"

import { trianglePath } from "#src/components/ui/glyphPaths.ts"

import type { Plate } from "../plates.ts"

import { PLATE_BORDER, TRIANGLE_INSET } from "../plates.ts"

/** A plate: card fill, the 2 px border inside its box (Figma's INSIDE stroke), then its runs. */
export const paintPlate = (ctx: CanvasRenderingContext2D, plate: Plate, theme: ThemeVars) => {
  const { x, y, w, h } = plate.box
  const half = PLATE_BORDER / 2
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, plate.radius)
  ctx.fillStyle = theme.card
  ctx.fill()
  ctx.beginPath()
  ctx.roundRect(x + half, y + half, w - PLATE_BORDER, h - PLATE_BORDER, Math.max(0, plate.radius - half))
  ctx.lineWidth = PLATE_BORDER
  ctx.strokeStyle = theme[plate.border]
  ctx.stroke()
  ctx.textAlign = "left"
  ctx.textBaseline = "alphabetic"
  for (const run of plate.runs) {
    ctx.fillStyle = theme[run.ink]
    if (run.kind === "text") {
      ctx.font = run.face.font
      ctx.fillText(run.text, x + run.x, y + run.y)
    } else {
      ctx.save()
      ctx.translate(x + run.x + TRIANGLE_INSET, y + run.y + TRIANGLE_INSET)
      ctx.fill(new Path2D(trianglePath(run.dir)))
      ctx.restore()
    }
  }
  ctx.restore()
}
