import { useEffect, useRef } from "react"

import { useDevicePixelRatio } from "#src/components/hooks/useDevicePixelRatio.ts"
import { useResizeObserver } from "#src/components/hooks/useResizeObserver.ts"
import { useAppTheme } from "#src/state/useAppTheme.ts"

import type { CartesianPlaneProps } from "./types.ts"

import style from "./cartesian-plane.module.css"
import { drawCartesianPlane } from "./drawCartesianPlane"
import { usePan } from "./usePan.ts"
import { useZoom } from "./useZoom.ts"

export function CartesianPlane({ plotFunc }: CartesianPlaneProps) {
  const { themeVars } = useAppTheme()
  const wrapperRef = useRef(null)
  const { width, height } = useResizeObserver(wrapperRef)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const dpr = useDevicePixelRatio()

  const pan = usePan()
  const { panX, panY } = pan
  const { zoom, onPointerDown, onPointerMove, onPointerUp } = useZoom({ canvasRef, pan })

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) {
      return
    }
    canvas.width = Math.max(1, Math.round(width * dpr))
    canvas.height = Math.max(1, Math.round(height * dpr))

    if (ctxRef.current == null) {
      ctxRef.current = canvas.getContext("2d", { colorSpace: "display-p3" }) ?? canvas.getContext("2d")
      if (ctxRef.current === null) {
        console.error("Could not create canvas 2d context.")
        return
      }
    }
    const ctx = ctxRef.current

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    drawCartesianPlane({
      ctx,
      width,
      height,
      themeVars,
      dpr,
      zoom,
      panX,
      panY,
      plotFunc,
    })
    // HMR: drawCartesianPlane identity changes only on hot reload, intentional redraw.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, dpr, zoom, panX, panY, plotFunc, themeVars, drawCartesianPlane])

  return (
    <div ref={wrapperRef} className={style.page}>
      <canvas
        ref={canvasRef}
        className={style.canvas}
        data-testid="cartesian-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
    </div>
  )
}
