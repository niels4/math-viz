import { useEffect, useRef, type ReactNode } from "react"

import { useDevicePixelRatio } from "#src/components/hooks/useDevicePixelRatio.ts"
import { useAppTheme, type ThemeVars } from "#src/state/useAppTheme.ts"

import type { GridSteps } from "./grid.ts"
import type { Ink, MathPoint, PlaneCurve } from "./scene.ts"
import type { Viewport } from "./viewport.ts"

import { gridLines } from "./grid.ts"
import style from "./MiniPlane.module.css"
import { paintLine } from "./paint/annotations.ts"
import { paintCurve } from "./paint/curve.ts"
import { paintGridLines } from "./paint/grid.ts"
import { toScreenX, toScreenY } from "./viewport.ts"

/** An arrow carrying a point from where it was to where it goes, its head's tip on `to`. */
export type MiniArrow = { from: MathPoint; to: MathPoint; ink: Ink; width: number }

/** A dot of `diameter` px filled with `fill`, ringed inside its edge when `ring` is set. */
export type MiniDot = { at: MathPoint; diameter: number; fill: Ink; ring?: { ink: Ink; width: number } }

/** What a mini plot draws. Owners keep one per picture, so it repaints only when it changes. */
export type MiniPlot = {
  /** px per unit */
  zoom: number
  /** Where the math origin sits, px from the top-left. */
  origin: { x: number; y: number }
  /** The grid's minor and major steps in units. */
  steps: GridSteps
  /** The axes' width in px. */
  axisWidth: number
  curves: readonly PlaneCurve[]
  arrows?: readonly MiniArrow[]
  /** Painted last, over the arrows. */
  dots?: readonly MiniDot[]
}

const paint = (
  ctx: CanvasRenderingContext2D,
  plot: MiniPlot,
  vp: Viewport,
  theme: ThemeVars,
  dpr: number,
) => {
  paintGridLines(ctx, gridLines(vp, plot.steps), theme, vp, plot.axisWidth)
  for (const curve of plot.curves) {
    paintCurve(ctx, vp, curve, theme, dpr)
  }
  for (const arrow of plot.arrows ?? []) {
    const segment = {
      x1: toScreenX(vp, arrow.from.x),
      y1: toScreenY(vp, arrow.from.y),
      x2: toScreenX(vp, arrow.to.x),
      y2: toScreenY(vp, arrow.to.y),
    }
    paintLine(ctx, segment, arrow.width, theme[arrow.ink], { arrow: true })
  }
  for (const dot of plot.dots ?? []) {
    const x = toScreenX(vp, dot.at.x)
    const y = toScreenY(vp, dot.at.y)
    const r = dot.diameter / 2
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = theme[dot.fill]
    ctx.fill()
    if (dot.ring !== undefined) {
      ctx.beginPath()
      ctx.arc(x, y, r - dot.ring.width / 2, 0, Math.PI * 2)
      ctx.lineWidth = dot.ring.width
      ctx.strokeStyle = theme[dot.ring.ink]
      ctx.stroke()
    }
  }
}

// A small, still plot drawn by the plane's own painters (figma0's drawPlane
// at a fixed zoom): grid lines on fixed steps, the axes, curves, arrows that
// carry a point, and dots, in a frame with the signature radius and a 1 px
// border inside its box. No pan, no zoom, no labels: an illustration, e.g.
// an explainer's before and after (FV 02).
export function MiniPlane({
  width,
  height,
  plot,
  label,
  children,
  className,
  testId,
}: {
  width: number
  height: number
  plot: MiniPlot
  /** What the picture shows, read aloud; without it the plot is decorative. */
  label?: string
  /** DOM over the plot, e.g. a value's plate. */
  children?: ReactNode
  className?: string
  testId?: string
}) {
  const { themeVars } = useAppTheme()
  const dpr = useDevicePixelRatio()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d", { colorSpace: "display-p3" }) ?? canvas?.getContext("2d") ?? null
    if (canvas === null || ctx === null) {
      return
    }
    canvas.width = Math.max(1, Math.round(width * dpr))
    canvas.height = Math.max(1, Math.round(height * dpr))
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    const vp = { width, height, zoom: plot.zoom, originX: plot.origin.x, originY: plot.origin.y }
    paint(ctx, plot, vp, themeVars, dpr)
  }, [width, height, dpr, themeVars, plot])

  return (
    <div
      className={className === undefined ? style.frame : `${style.frame} ${className}`}
      style={{ width, height }}
      data-testid={testId}
    >
      <canvas
        ref={canvasRef}
        className={style.canvas}
        style={{ width, height }}
        {...(label === undefined ? { "aria-hidden": true } : { role: "img", "aria-label": label })}
      />
      {children}
    </div>
  )
}
