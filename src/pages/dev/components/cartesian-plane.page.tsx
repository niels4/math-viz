import { useEffect, useRef, useState } from "react"

import { useResizeObserver } from "#src/components/hooks/useResizeObserver.ts"
import { useAppTheme } from "#src/state/useAppTheme.ts"

import {
  DEFAULT_VIEW,
  MAX_SCALE,
  MIN_SCALE,
  drawCartesianPlane,
  type PlaneView,
} from "./cartesian-plane-util"
import style from "./cartesian-plane.module.css"

const useDevicePixelRatio = () => {
  const [dpr, setDpr] = useState(() => window.devicePixelRatio ?? 1)

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return
    }
    const query = window.matchMedia(`(resolution: ${dpr}dppx)`)
    const update = () => {
      setDpr(window.devicePixelRatio ?? 1)
    }
    query.addEventListener("change", update)
    return () => {
      query.removeEventListener("change", update)
    }
  }, [dpr])

  return dpr
}

const clampScale = (scale: number): number => Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))

export default function CartesianPlanePage() {
  const { themeVars } = useAppTheme()
  const { ref, width, height } = useResizeObserver()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const dpr = useDevicePixelRatio()
  const [view, setView] = useState<PlaneView>(DEFAULT_VIEW)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{ lastX: number; lastY: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) {
      return
    }
    canvas.width = Math.max(1, Math.round(width * dpr))
    canvas.height = Math.max(1, Math.round(height * dpr))
    if (ctxRef.current == null) {
      ctxRef.current = canvas.getContext("2d", { colorSpace: "display-p3" }) ?? canvas.getContext("2d")
    }
    const ctx = ctxRef.current
    if (ctx === null) {
      return
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    drawCartesianPlane(ctx, width, height, themeVars, view)
    // HMR: drawCartesianPlane identity changes only on hot reload, intentional redraw
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keeps the HMR redraw
  }, [width, height, dpr, view, drawCartesianPlane])

  // Wheel zoom centered on the cursor. Native non-passive listener so we can
  // preventDefault and keep the page from scrolling while zooming the plane.
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) {
      return
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
      setView((v) => {
        const nextScale = clampScale(v.scale * Math.exp(-delta * 0.0015))
        if (nextScale === v.scale) {
          return v
        }
        // Keep the math point under the cursor fixed while the scale changes.
        const cx = Math.floor(rect.width / 2)
        const cy = Math.floor(rect.height / 2)
        const mathX = (sx - cx) / v.scale - v.panX
        const mathY = -(sy - cy) / v.scale - v.panY
        return {
          scale: nextScale,
          panX: (sx - cx) / nextScale - mathX,
          panY: -(sy - cy) / nextScale - mathY,
        }
      })
    }
    canvas.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      canvas.removeEventListener("wheel", onWheel)
    }
  }, [])

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = { lastX: e.clientX, lastY: e.clientY }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current
    if (drag === null) {
      return
    }
    const dx = e.clientX - drag.lastX
    const dy = e.clientY - drag.lastY
    drag.lastX = e.clientX
    drag.lastY = e.clientY
    setView((v) => ({
      scale: v.scale,
      panX: v.panX + dx / v.scale,
      panY: v.panY - dy / v.scale,
    }))
  }

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = null
    setDragging(false)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  return (
    <div ref={ref} className={style.page}>
      <canvas
        ref={canvasRef}
        className={style.canvas}
        style={{ width, height, cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
        data-testid="cartesian-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
      <p className={style.readout}>
        {width} X {height} · zoom {view.scale.toFixed(1)} · pan ({view.panX.toFixed(1)},{" "}
        {view.panY.toFixed(1)})
      </p>
    </div>
  )
}
