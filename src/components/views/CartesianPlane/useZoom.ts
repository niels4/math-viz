import type { RefObject } from "react"

import { useEffect, useRef, useState } from "react"

import type { PinchState, PointerPoint, ViewState } from "./types.ts"
import type { PanApi } from "./usePan.ts"

import { normalizeWheelDelta, pinchView, wheelView } from "./util.ts"

// Zoom owns the zoom level plus the wheel and pinch gestures. Pinch pans as
// well (the midpoint's travel drags content), so it writes pan through the
// PanApi; single-finger drag segments delegate back to it. The component
// just spreads the returned handlers onto the canvas.

export function useZoom({ canvasRef, pan }: { canvasRef: RefObject<HTMLCanvasElement | null>; pan: PanApi }) {
  const {
    panX,
    panY,
    setPanX,
    setPanY,
    stopInertia,
    beginDrag,
    trackDrag,
    releaseDrag,
    cancelDrag,
    adoptRemainingDrag,
  } = pan
  const [zoom, setZoom] = useState(50)
  const zoomRef = useRef(zoom)
  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

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
      const delta = normalizeWheelDelta(e.deltaY, e.deltaMode)
      const next = wheelView({
        zoom,
        panX,
        panY,
        delta,
        cursorX: sx,
        cursorY: sy,
        centerX: cx,
        centerY: cy,
      })
      if (next === null) {
        return
      }
      setZoom(next.zoom)
      setPanX(next.panX)
      setPanY(next.panY)
    }
    canvas.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      canvas.removeEventListener("wheel", onWheel)
    }
  }, [canvasRef, zoom, panX, panY, setPanX, setPanY, stopInertia])

  // Multi-touch pinch (Maps-style): every active pointer is tracked, and two
  // or more means pinching. Zoom anchors on the pinch midpoint while the
  // midpoint's travel pans, so content stays glued to the fingers.
  // `touch-action: none` in CSS stops the browser stealing the gesture.
  const pointersRef = useRef(new Map<number, PointerPoint>())
  const pinchRef = useRef<PinchState | null>(null)
  // Gesture source of truth while pinching. Move events for both fingers can
  // land in one task sharing a stale render closure, so the pinch reads and
  // writes the view here synchronously and only mirrors it to state. Synced
  // from state when a pinch starts (pointerdowns flush discretely, so the
  // closure is fresh there).
  const viewRef = useRef<ViewState | null>(null)

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
      cancelDrag()
      return
    }
    beginDrag(e.clientX, e.clientY)
  }

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
      const v = viewRef.current ?? { zoom, panX, panY }
      const next = pinchView({
        view: v,
        dist,
        lastDist: pinch.lastDist,
        midX,
        midY,
        lastMidX: pinch.lastMidX,
        lastMidY: pinch.lastMidY,
        rectWidth: rect.width,
        rectHeight: rect.height,
      })
      viewRef.current = next
      setZoom(next.zoom)
      setPanX(next.panX)
      setPanY(next.panY)
      pinchRef.current = { lastDist: dist, lastMidX: midX, lastMidY: midY }
      return
    }
    trackDrag(e.clientX, e.clientY, zoom)
  }

  // Shared by pointerup and pointercancel.
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointersRef.current.delete(e.pointerId)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    if (pointersRef.current.size >= 2) {
      // Still pinching after a lift (third finger): re-baseline, no jump.
      pinchBaseline(e.currentTarget)
      cancelDrag()
      return
    }
    pinchRef.current = null
    if (pointersRef.current.size === 1) {
      adoptRemainingDrag([...pointersRef.current.values()][0])
      return
    }
    releaseDrag(e.clientX, e.clientY, zoomRef)
  }

  return { zoom, setZoom, onPointerDown, onPointerMove, onPointerUp }
}
