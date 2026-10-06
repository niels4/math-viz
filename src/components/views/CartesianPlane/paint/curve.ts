import type { ThemeVars } from "#src/state/useAppTheme.ts"

import type { PlaneCurve } from "../scene.ts"
import type { Viewport } from "../viewport.ts"

import { toMathX, toScreenY } from "../viewport.ts"
import { dashPhase } from "./guides.ts"

/** Off-view samples clamp this far past the edges, inside canvas coordinate limits. */
const OVERSHOOT_PX = 10_000
/** Start and end past the edges, so the round caps stay out of view. */
const EDGE_SAMPLES = 2

/** One sample per CSS pixel; a non-finite value breaks the line. */
export const paintCurve = (
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  curve: PlaneCurve,
  theme: ThemeVars,
  dpr: number,
) => {
  ctx.save()
  ctx.strokeStyle = theme[curve.ink]
  ctx.lineWidth = curve.width
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  if (curve.dash !== undefined) {
    ctx.setLineDash([...curve.dash])
    ctx.lineDashOffset = dashPhase(curve.dash)
  }
  if (curve.alpha !== undefined) {
    ctx.globalAlpha = curve.alpha
  }
  if (curve.glow === true && theme.glowRadius > 0) {
    // A transparent --sig-curve-glow draws no shadow; shadowBlur ignores the
    // transform, so it is scaled to device pixels here.
    ctx.shadowColor = theme.curveGlow
    ctx.shadowBlur = theme.glowRadius * dpr
  }
  ctx.beginPath()
  let drawing = false
  for (let px = -EDGE_SAMPLES; px <= vp.width + EDGE_SAMPLES; px++) {
    const y = curve.fn(toMathX(vp, px))
    if (!Number.isFinite(y)) {
      drawing = false
      continue
    }
    const sy = Math.min(vp.height + OVERSHOOT_PX, Math.max(-OVERSHOOT_PX, toScreenY(vp, y)))
    if (drawing) {
      ctx.lineTo(px, sy)
    } else {
      ctx.moveTo(px, sy)
      drawing = true
    }
  }
  ctx.stroke()
  ctx.restore()
}
