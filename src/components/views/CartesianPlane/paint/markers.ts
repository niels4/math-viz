import type { ThemeVars } from "#src/state/useAppTheme.ts"

import type { Marker, WasMark } from "../marks.ts"

import { paintLine } from "./annotations.ts"
import { dashPhase } from "./guides.ts"

/** The knock-out disc that keeps grid and curve out from under a marker (Ø24). */
const KNOCKOUT_R = 12
/** A lit marker's halo: Ø48 of --primary at 26 % (mix/primary-26). */
const HALO_R = 24
const HALO_ALPHA = 0.26

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

/**
 * point-marker-fv: P's bullseye (2.5 px foreground ring, Ø12 core) or Q's
 * ring (3 px, Ø6 centre), with the halo while lit.
 */
export const paintMarker = (ctx: CanvasRenderingContext2D, marker: Marker, theme: ThemeVars) => {
  const { x, y } = marker
  ctx.save()
  const alpha = ctx.globalAlpha * (marker.alpha ?? 1)
  if (marker.focus) {
    ctx.globalAlpha = alpha * HALO_ALPHA
    disc(ctx, x, y, HALO_R, theme.primary)
  }
  ctx.globalAlpha = alpha
  disc(ctx, x, y, KNOCKOUT_R, theme.background)
  if (marker.style === "bullseye") {
    ring(ctx, x, y, KNOCKOUT_R, 2.5, theme.foreground)
    disc(ctx, x, y, 6, theme[marker.ink])
  } else {
    ring(ctx, x, y, KNOCKOUT_R, 3, theme[marker.ink])
    disc(ctx, x, y, 3, theme.foreground)
  }
  ctx.restore()
}

/** Where a point was (fvDrawCanvas: P before): a Ø22 ring, 2 px dashed 3 3 inside its box, in the point's ink. */
const WAS_R = 11
const WAS_WIDTH = 2
const WAS_DASH = [3, 3]
/** The arrow from where it was: 2 px with a head (fvDrawCanvas: P moved). */
const WAS_ARROW_WIDTH = 2

export const paintWas = (ctx: CanvasRenderingContext2D, was: WasMark, theme: ThemeVars) => {
  ctx.save()
  ctx.beginPath()
  ctx.arc(was.x, was.y, WAS_R - WAS_WIDTH / 2, 0, Math.PI * 2)
  ctx.lineWidth = WAS_WIDTH
  ctx.setLineDash(WAS_DASH)
  ctx.lineDashOffset = dashPhase(WAS_DASH)
  ctx.strokeStyle = theme[was.ink]
  ctx.stroke()
  ctx.restore()
  if (was.arrow !== null) {
    paintLine(ctx, was.arrow, WAS_ARROW_WIDTH, theme[was.arrow.ink], { arrow: true })
  }
}
