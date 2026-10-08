import type { ThemeVars } from "#src/state/useAppTheme.ts"

import { trianglePath } from "#src/components/ui/glyphPaths.ts"

import type { Plate } from "../plates.ts"

import { TRIANGLE_INSET } from "../plates.ts"

/** A plate: its fill, its border inside the box (Figma's INSIDE stroke), then its runs; mid-motion, faded and moved. */
export const paintPlate = (ctx: CanvasRenderingContext2D, plate: Plate, theme: ThemeVars) => {
  const { w, h } = plate.box
  const x = plate.box.x + (plate.motion?.dx ?? 0)
  const y = plate.box.y + (plate.motion?.dy ?? 0)
  ctx.save()
  if (plate.motion !== undefined) {
    ctx.globalAlpha *= plate.motion.alpha
  }
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, plate.radius)
  ctx.fillStyle = theme[plate.fill]
  ctx.fill()
  const { ink, width } = plate.border
  const half = width / 2
  ctx.beginPath()
  ctx.roundRect(x + half, y + half, w - width, h - width, Math.max(0, plate.radius - half))
  ctx.lineWidth = width
  ctx.strokeStyle = theme[ink]
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
