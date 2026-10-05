import { useCallback, useEffect, useRef, useState } from "react"

import { useDevicePixelRatio } from "#src/components/hooks/useDevicePixelRatio.ts"
import { useResizeObserver } from "#src/components/hooks/useResizeObserver.ts"
import { useAppTheme } from "#src/state/useAppTheme.ts"

import style from "./cartesian-plane.module.css"
import { drawCartesianPlane } from "./drawCartesianPlane"

const MIN_UNIT_SIZE = 0.25
const MAX_UNIT_SIZE = 100
const ZOOM_SPEED = 0.0015

// Pan inertia (Google Maps style fling): release velocity in screen px/s
// decays exponentially, so a fast flick glides ~v0/DECAY px then stops.
const INERTIA_DECAY = 4.5
const INERTIA_MIN_SPEED = 24
const INERTIA_MAX_SPEED = 8000
const VELOCITY_WINDOW_MS = 120

const clampZoom = (zoom: number): number => Math.min(MAX_UNIT_SIZE, Math.max(MIN_UNIT_SIZE, zoom))

export function CartesianPlane() {
  const { themeVars } = useAppTheme()
  const wrapperRef = useRef(null)
  const { width, height } = useResizeObserver(wrapperRef)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const dpr = useDevicePixelRatio()
  const dragRef = useRef<{
    lastX: number
    lastY: number
    samples: { x: number; y: number; t: number }[]
  } | null>(null)
  const inertiaRef = useRef<number | null>(null)
  const [zoom, setZoom] = useState(50)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const zoomRef = useRef(zoom)
  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

  const stopInertia = useCallback(() => {
    if (inertiaRef.current !== null && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(inertiaRef.current)
    }
    inertiaRef.current = null
  }, [])

  // jsdom has no rAF (only with pretendToBeVisual), so inertia is a no-op there.
  const startInertia = useCallback(
    (vx0: number, vy0: number) => {
      if (typeof requestAnimationFrame !== "function" || typeof performance === "undefined") {
        return
      }
      stopInertia()
      const speed0 = Math.hypot(vx0, vy0)
      if (speed0 < INERTIA_MIN_SPEED) {
        return
      }
      const scale = Math.min(1, INERTIA_MAX_SPEED / speed0)
      let vx = vx0 * scale
      let vy = vy0 * scale
      let last = performance.now()
      const tick = (now: number) => {
        const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
        last = now
        const decay = Math.exp(-INERTIA_DECAY * dt)
        vx *= decay
        vy *= decay
        if (Math.hypot(vx, vy) < INERTIA_MIN_SPEED) {
          inertiaRef.current = null
          return
        }
        const zoom = zoomRef.current
        if (zoom > 0 && dt > 0) {
          const stepX = (vx * dt) / zoom
          const stepY = (vy * dt) / zoom
          setPanX((curr) => curr + stepX)
          setPanY((curr) => curr - stepY)
        }
        inertiaRef.current = requestAnimationFrame(tick)
      }
      inertiaRef.current = requestAnimationFrame(tick)
    },
    [stopInertia],
  )

  useEffect(() => {
    return stopInertia
  }, [stopInertia])

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
    drawCartesianPlane({
      ctx,
      width,
      height,
      themeVars,
      dpr,
      zoom,
      panX,
      panY,
    })
    // HMR: drawCartesianPlane identity changes only on hot reload, intentional redraw
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keeps the HMR redraw
  }, [width, height, dpr, zoom, panX, panY, drawCartesianPlane])

  // Wheel zoom centered on the cursor. Native non-passive listener so we can
  // preventDefault and keep the page from scrolling while zooming the plane.
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) {
      return
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      stopInertia()
      const rect = canvas.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      const cx = Math.floor(rect.width / 2)
      const cy = Math.floor(rect.height / 2)
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
      // Multiplicative zoom: each tick scales by a fixed factor, so one notch
      // feels the same at zoom 100 and zoom 0.25. Pan shifts to hold the math
      // point under the cursor fixed (y sign flips: screen y grows downward).
      const nextZoom = clampZoom(zoom * Math.exp(-delta * ZOOM_SPEED))
      if (nextZoom === zoom) {
        return
      }
      const k = 1 / nextZoom - 1 / zoom
      setZoom(nextZoom)
      setPanX(panX + (sx - cx) * k)
      setPanY(panY + (cy - sy) * k)
    }
    canvas.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      canvas.removeEventListener("wheel", onWheel)
    }
  }, [zoom, panX, panY, stopInertia])

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    stopInertia()
    dragRef.current = {
      lastX: e.clientX,
      lastY: e.clientY,
      samples: [{ x: e.clientX, y: e.clientY, t: performance.now() }],
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  // Drag pans the plane: pixel deltas become math-unit shifts so the grabbed
  // point stays under the cursor (y negated: screen y grows downward).
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current
    if (drag === null) {
      return
    }
    const dx = e.clientX - drag.lastX
    const dy = e.clientY - drag.lastY
    drag.lastX = e.clientX
    drag.lastY = e.clientY
    drag.samples.push({ x: e.clientX, y: e.clientY, t: performance.now() })
    while (drag.samples.length > 2) {
      const first = drag.samples[0]
      const lastSample = drag.samples[drag.samples.length - 1]
      if (first === undefined || lastSample === undefined || lastSample.t - first.t <= VELOCITY_WINDOW_MS) {
        break
      }
      drag.samples.shift()
    }
    setPanX((curr) => curr + dx / zoom)
    setPanY((curr) => curr - dy / zoom)
  }

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current
    dragRef.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    if (drag !== null && typeof performance !== "undefined") {
      const now = performance.now()
      const samples = drag.samples
      samples.push({ x: e.clientX, y: e.clientY, t: now })
      let firstIndex = samples.findIndex((s) => now - s.t <= VELOCITY_WINDOW_MS)
      if (firstIndex === -1) {
        firstIndex = samples.length - 1
      }
      const first = samples[firstIndex]
      const lastSample = samples[samples.length - 1]
      if (first !== undefined && lastSample !== undefined && lastSample.t > first.t) {
        const dt = (lastSample.t - first.t) / 1000
        if (dt > 0) {
          const vx = (lastSample.x - first.x) / dt
          const vy = (lastSample.y - first.y) / dt
          if (Math.hypot(vx, vy) >= INERTIA_MIN_SPEED) {
            startInertia(vx, vy)
          }
        }
      }
    }
  }

  return (
    <div ref={wrapperRef} className={style.page}>
      <canvas
        ref={canvasRef}
        className={style.canvas}
        data-testid="cartesian-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
      <p className={style.readout}>
        {width} X {height}
      </p>
    </div>
  )
}
