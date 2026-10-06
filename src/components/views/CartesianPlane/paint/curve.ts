import type { ThemeVars } from "#src/state/useAppTheme.ts"

import type { PlaneCurve } from "../scene.ts"
import type { Viewport } from "../viewport.ts"

import { curveTrace, traceUpTo } from "../trace.ts"
import { dashPhase } from "./guides.ts"

/** One sample per CSS pixel (trace.ts); a non-finite value breaks the line; `drawTo` trims it from the left. */
export const paintCurve = (
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  curve: PlaneCurve,
  theme: ThemeVars,
  dpr: number,
) => {
  const samples = traceUpTo(curveTrace(vp, curve.fn), curve.drawTo ?? 1)
  if (samples.length < 2) {
    return
  }
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
    ctx.globalAlpha *= curve.alpha
  }
  if (curve.glow === true && theme.glowRadius > 0) {
    // A transparent --sig-curve-glow draws no shadow; shadowBlur ignores the
    // transform, so it is scaled to device pixels here.
    ctx.shadowColor = theme.curveGlow
    ctx.shadowBlur = theme.glowRadius * dpr
  }
  ctx.beginPath()
  for (const { x, y, start } of samples) {
    if (start) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.stroke()
  ctx.restore()
}
