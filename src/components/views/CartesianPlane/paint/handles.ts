import type { ThemeVars } from "#src/state/useAppTheme.ts"

import type { HandleMark } from "../marks.ts"

/** The grab halo: Ø44 of the handle's ink at 26 % (mix/primary-26). */
const HALO_R = 22
const HALO_ALPHA = 0.26
/** The anchor ◆: corners 10 px from its centre, a 2.5 px stroke on the path (fvDrawCanvas). */
const DIAMOND_R = 10
/** The stretch grip ■: 16 px, radius 3, a 2.5 px stroke inside it. */
const SQUARE = 16
const SQUARE_RADIUS = 3
const STROKE = 2.5

/** Halos first, under the drags' annotations, as fvDrawCanvas puts them at the bottom of its handles. */
export const paintHandleHalos = (
  ctx: CanvasRenderingContext2D,
  handles: readonly HandleMark[],
  theme: ThemeVars,
) => {
  ctx.save()
  const base = ctx.globalAlpha
  for (const handle of handles) {
    if (handle.halo) {
      ctx.globalAlpha = base * HALO_ALPHA * (handle.alpha ?? 1)
      ctx.beginPath()
      ctx.arc(handle.x, handle.y, HALO_R, 0, Math.PI * 2)
      ctx.fillStyle = theme[handle.ink]
      ctx.fill()
    }
  }
  ctx.restore()
}

/** The handles: outlined at rest, filled with their ink while held. */
export const paintHandles = (
  ctx: CanvasRenderingContext2D,
  handles: readonly HandleMark[],
  theme: ThemeVars,
) => {
  ctx.save()
  ctx.lineWidth = STROKE
  const base = ctx.globalAlpha
  for (const handle of handles) {
    const { x, y } = handle
    ctx.globalAlpha = base * (handle.alpha ?? 1)
    const ink = theme[handle.ink]
    ctx.fillStyle = handle.held ? ink : theme.background
    ctx.strokeStyle = ink
    ctx.beginPath()
    if (handle.shape === "diamond") {
      ctx.lineJoin = "round"
      ctx.moveTo(x, y - DIAMOND_R)
      ctx.lineTo(x + DIAMOND_R, y)
      ctx.lineTo(x, y + DIAMOND_R)
      ctx.lineTo(x - DIAMOND_R, y)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    } else {
      const half = SQUARE / 2
      ctx.roundRect(x - half, y - half, SQUARE, SQUARE, SQUARE_RADIUS)
      ctx.fill()
      const inset = STROKE / 2
      ctx.beginPath()
      ctx.roundRect(
        x - half + inset,
        y - half + inset,
        SQUARE - STROKE,
        SQUARE - STROKE,
        SQUARE_RADIUS - inset,
      )
      ctx.stroke()
    }
  }
  ctx.restore()
}
