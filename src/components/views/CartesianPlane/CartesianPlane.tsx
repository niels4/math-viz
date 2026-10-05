import { useCallback, useEffect, useRef, useState } from "react"

import { useDevicePixelRatio } from "#src/components/hooks/useDevicePixelRatio.ts"
import { useResizeObserver } from "#src/components/hooks/useResizeObserver.ts"
import { useAppTheme } from "#src/state/useAppTheme.ts"

import type { PlotFunc } from "./types"

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

export type CartesianPlaneProps = {
  plotFunc?: PlotFunc
}

export function CartesianPlane({ plotFunc }: CartesianPlaneProps) {
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
      plotFunc,
    })
    // HMR: drawCartesianPlane identity changes only on hot reload, intentional redraw.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, dpr, zoom, panX, panY, plotFunc, themeVars, drawCartesianPlane])

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

  // Multi-touch pinch (Maps-style): every active pointer is tracked, and two
  // or more means pinching. Zoom anchors on the pinch midpoint while the
  // midpoint's travel pans, so content stays glued to the fingers.
  // `touch-action: none` in CSS stops the browser stealing the gesture.
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const pinchRef = useRef<{ lastDist: number; lastMidX: number; lastMidY: number } | null>(null)
  // Gesture source of truth while pinching. Move events for both fingers can
  // land in one task sharing a stale render closure, so the pinch reads and
  // writes the view here synchronously and only mirrors it to state. Synced
  // from state when a pinch starts (pointerdowns flush discretely, so the
  // closure is fresh there).
  const viewRef = useRef<{ zoom: number; panX: number; panY: number } | null>(null)

  const pinchBaseline = (canvas: HTMLCanvasElement) => {
    const pts = [...pointersRef.current.values()]
    const p1 = pts[0]
    const p2 = pts[1]
    if (p1 === undefined || p2 === undefined) {
      pinchRef.current = null
      return
    }
    const rect = canvas.getBoundingClientRect()
    pinchRef.current = {
      lastDist: Math.hypot(p2.x - p1.x, p2.y - p1.y),
      lastMidX: (p1.x + p2.x) / 2 - rect.left,
      lastMidY: (p1.y + p2.y) / 2 - rect.top,
    }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    stopInertia()
    e.currentTarget.setPointerCapture(e.pointerId)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointersRef.current.size >= 2) {
      // Second finger down: swap drag for pinch, baselined on the live
      // finger positions so the switch causes no jump.
      viewRef.current = { zoom, panX, panY }
      pinchBaseline(e.currentTarget)
      dragRef.current = null
      return
    }
    dragRef.current = {
      lastX: e.clientX,
      lastY: e.clientY,
      samples: [{ x: e.clientX, y: e.clientY, t: performance.now() }],
    }
  }

  // Drag pans the plane: pixel deltas become math-unit shifts so the grabbed
  // point stays under the cursor (y negated: screen y grows downward).
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointersRef.current.has(e.pointerId)) {
      return
    }
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointersRef.current.size >= 2 && pinchRef.current !== null) {
      const pts = [...pointersRef.current.values()]
      const p1 = pts[0]
      const p2 = pts[1]
      if (p1 === undefined || p2 === undefined) {
        return
      }
      const rect = e.currentTarget.getBoundingClientRect()
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y)
      const midX = (p1.x + p2.x) / 2 - rect.left
      const midY = (p1.y + p2.y) / 2 - rect.top
      const pinch = pinchRef.current
      if (pinch.lastDist === 0 || dist === 0) {
        pinchRef.current = { lastDist: dist, lastMidX: midX, lastMidY: midY }
        return
      }
      // Glued-finger similarity, telescoping exactly across the events of one
      // dispatch: scale about the old midpoint, then shift old midpoint onto
      // the new one. Both fingertips keep their content points (absent
      // rotation, which Maps-style zoom ignores like Apple/Google Maps).
      // Same hold-point math as wheel zoom (y flips: screen y grows down).
      const v = viewRef.current ?? { zoom, panX, panY }
      const nextZoom = clampZoom(v.zoom * (dist / pinch.lastDist))
      const k = 1 / nextZoom - 1 / v.zoom
      const dx = midX - pinch.lastMidX
      const dy = midY - pinch.lastMidY
      const next = {
        zoom: nextZoom,
        panX: v.panX + dx / v.zoom + (midX - rect.width / 2) * k,
        panY: v.panY - dy / v.zoom + (rect.height / 2 - midY) * k,
      }
      viewRef.current = next
      setZoom(next.zoom)
      setPanX(next.panX)
      setPanY(next.panY)
      pinchRef.current = { lastDist: dist, lastMidX: midX, lastMidY: midY }
      return
    }
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
    pointersRef.current.delete(e.pointerId)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    if (pointersRef.current.size >= 2) {
      // Still pinching after a lift (third finger): re-baseline, no jump.
      pinchBaseline(e.currentTarget)
      dragRef.current = null
      return
    }
    pinchRef.current = null
    if (pointersRef.current.size === 1) {
      // Pinch back to one finger: restart drag tracking on the remaining
      // finger with no samples yet. Momentum observation starts only when
      // it actually moves, so a quick lift-off can never read fast pinch
      // motion as fling velocity.
      const remaining = [...pointersRef.current.values()][0]
      dragRef.current =
        remaining === undefined
          ? null
          : {
              lastX: remaining.x,
              lastY: remaining.y,
              samples: [],
            }
      return
    }
    const drag = dragRef.current
    dragRef.current = null
    // Momentum needs an observed motion segment (two samples): a bare
    // down/up or a pinch lift-off with no single-finger travel carries no
    // fling intent, and a few-ms window would inflate it into a huge
    // velocity either way.
    if (drag !== null && typeof performance !== "undefined" && drag.samples.length >= 2) {
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
    </div>
  )
}
