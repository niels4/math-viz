import type { ThemeVars } from "#src/state/useAppTheme.ts"

import type { PlanePoint } from "../scene.ts"
import type { Viewport } from "../viewport.ts"

import { toScreenX, toScreenY } from "../viewport.ts"

/** The knock-out disc that keeps grid and curve out from under a marker (Ø24). */
const KNOCKOUT_R = 12

const disc = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) => {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
}

/** A ring drawn inside radius r, like Figma's INSIDE stroke. */
const ring = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  width: number,
  color: string,
) => {
  ctx.beginPath()
  ctx.arc(x, y, r - width / 2, 0, Math.PI * 2)
  ctx.lineWidth = width
  ctx.strokeStyle = color
  ctx.stroke()
}

/** point-marker-fv: P's bullseye (2.5 px foreground ring, Ø12 core) or Q's ring (3 px, Ø6 centre). */
export const paintPoint = (
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  point: PlanePoint,
  theme: ThemeVars,
) => {
  const x = toScreenX(vp, point.x)
  const y = toScreenY(vp, point.y)
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    x < -KNOCKOUT_R ||
    y < -KNOCKOUT_R ||
    x > vp.width + KNOCKOUT_R ||
    y > vp.height + KNOCKOUT_R
  ) {
    return
  }
  ctx.save()
  disc(ctx, x, y, KNOCKOUT_R, theme.background)
  if (point.style === "bullseye") {
    ring(ctx, x, y, KNOCKOUT_R, 2.5, theme.foreground)
    disc(ctx, x, y, 6, theme[point.ink])
  } else {
    ring(ctx, x, y, KNOCKOUT_R, 3, theme[point.ink])
    disc(ctx, x, y, 3, theme.foreground)
  }
  ctx.restore()
}
