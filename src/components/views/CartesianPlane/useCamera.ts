import type { RefObject } from "react"

import { useEffect, useRef } from "react"

import { unscaledUnitSize } from "./constants"

type Center = [number, number]

// A wheel event multiplies the scale by exp(deltaY * scaleSpeed), so equal
// notches zoom by equal ratios at every scale.
const scaleSpeed = 0.001
const minScale = 0.1
const maxScale = 5
// The scale eases toward its target: each ms covers this fraction of the
// remaining distance, so the distance shrinks by e every 83 ms.
const zoomRate = 0.012
// The zoom snaps to its target once it is this close.
const scaleEpsilon = 0.0005
// Release faster than this (px per ms) starts a glide; slower just stops.
const minFlickSpeed = 0.15
// Exponential decay of the glide per ms. Higher stops sooner.
const friction = 0.0045
// The glide ends below this speed (px per ms).
const stopSpeed = 0.02
// Weight of each pointermove sample in the velocity average.
const velocitySmoothing = 0.25
// Clamp frame steps so a backgrounded tab does not jump on return.
const maxFrameDt = 50
// The first frame of an animation has no earlier frame to measure from,
// and its timestamp can be earlier than the event that requested it.
const firstFrameDt = 1000 / 60

const clampScale = (scale: number) => Math.min(maxScale, Math.max(minScale, scale))

const sameCenter = (a: Center, b: Center) => a[0] === b[0] && a[1] === b[1]

// Cursor position in CSS px from the point the draw code treats as the
// canvas center: half the content box, inside the border, rounded down.
const offsetFromCenter = (canvas: HTMLCanvasElement, e: MouseEvent): Center => {
  const rect = canvas.getBoundingClientRect()
  const width = rect.width - canvas.clientLeft * 2
  const height = rect.height - canvas.clientTop * 2
  return [
    e.clientX - rect.left - canvas.clientLeft - Math.floor(width / 2),
    e.clientY - rect.top - canvas.clientTop - Math.floor(height / 2),
  ]
}

// Pan, glide and wheel zoom for the Cartesian plane, on one animation
// loop. A drag pans, a fast release glides on, and the wheel eases the
// zoom about the cursor; all three can run at once. The center and scale
// props come from the URL params. While the camera is still they are the
// truth, and the first event of a gesture starts from them; while it moves,
// the hook's own values are the truth and every write to React happens
// once per frame in the loop. onSettle runs once when the camera comes to
// rest and no pointer holds the plane.
export const useCamera = (
  ref: RefObject<HTMLCanvasElement | null>,
  center: Center,
  scale: number,
  setCenter: (center: Center) => void,
  setScale: (scale: number) => void,
  onSettle: () => void,
) => {
  // Mirrored so the listeners below stay attached for the whole gesture.
  const props = useRef({ center, scale, setCenter, setScale, onSettle })
  useEffect(() => {
    props.current = { center, scale, setCenter, setScale, onSettle }
  })

  useEffect(() => {
    const canvas = ref.current
    if (canvas === null) {
      return
    }

    // What is drawn, and the only values ever written to React.
    const cur = { center: props.current.center, scale: props.current.scale }
    // What React was last given, so a frame writes only what changed.
    const published = { ...cur }
    // Where the zoom is heading. The center has no target: a zoom shifts
    // it by however much the scale changed this frame.
    let targetScale = cur.scale
    // Cursor of the latest wheel event, as offsetFromCenter measures it.
    let anchor: Center = [0, 0]
    // Release velocity in screen px per ms while the plane glides.
    let glide: Center | null = null
    // The pointer that drags the plane: its last position and time, and a
    // running average of its velocity in px per ms.
    let pointer: { id: number; last: Center; time: number; velocity: Center } | null = null
    let frame = 0
    let lastFrameTime: number | null = null

    const zooming = () => targetScale !== cur.scale
    const idle = () => pointer === null && glide === null && !zooming()

    // Moves the center so the plane follows the pointer or the glide by
    // (dx, dy) screen px at the scale drawn now.
    const panBy = (dx: number, dy: number) => {
      const unit = unscaledUnitSize / cur.scale
      cur.center = [cur.center[0] - dx / unit, cur.center[1] + dy / unit]
    }

    const adoptIfIdle = () => {
      if (!idle()) {
        return
      }
      cur.center = props.current.center
      cur.scale = props.current.scale
      published.center = cur.center
      published.scale = cur.scale
      targetScale = cur.scale
    }

    const publish = () => {
      if (!sameCenter(cur.center, published.center)) {
        published.center = cur.center
        props.current.setCenter(cur.center)
      }
      if (cur.scale !== published.scale) {
        published.scale = cur.scale
        props.current.setScale(cur.scale)
      }
    }

    const step = (now: number) => {
      const dt = lastFrameTime === null ? firstFrameDt : Math.min(now - lastFrameTime, maxFrameDt)
      lastFrameTime = now

      const prevScale = cur.scale
      cur.scale += (targetScale - cur.scale) * (1 - Math.exp(-zoomRate * dt))
      if (Math.abs(targetScale - cur.scale) < scaleEpsilon) {
        cur.scale = targetScale
      }
      // A plane unit is unscaledUnitSize / scale px wide, so this shift
      // keeps the plane point under the anchor at the same place on screen.
      // Screen y points down and plane y up.
      const d = (prevScale - cur.scale) / unscaledUnitSize
      const [ox, oy] = anchor
      cur.center = [cur.center[0] + ox * d, cur.center[1] - oy * d]

      // The glide moves the plane after the zoom, at the scale drawn this
      // frame, so the plane point under the cursor moves with the glide.
      if (glide !== null) {
        const decay = Math.exp(-friction * dt)
        glide = [glide[0] * decay, glide[1] * decay]
        if (Math.hypot(glide[0], glide[1]) < stopSpeed) {
          glide = null
        } else {
          panBy(glide[0] * dt, glide[1] * dt)
        }
      }

      publish()

      if (idle()) {
        frame = 0
        lastFrameTime = null
        props.current.onSettle()
        return
      }
      // A held pointer with nothing else moving: the next pointermove
      // starts the loop again.
      if (glide === null && !zooming()) {
        frame = 0
        lastFrameTime = null
        return
      }
      frame = requestAnimationFrame(step)
    }

    const ensureLoop = () => {
      if (frame === 0) {
        frame = requestAnimationFrame(step)
      }
    }

    const onWheel = (e: WheelEvent) => {
      adoptIfIdle()
      anchor = offsetFromCenter(canvas, e)
      targetScale = clampScale(targetScale * Math.exp(e.deltaY * scaleSpeed))
      // Already at a scale limit: nothing to animate.
      if (targetScale === cur.scale) {
        return
      }
      ensureLoop()
    }

    // Catching the plane ends a glide; a zoom in flight carries on.
    const onPointerDown = (e: PointerEvent) => {
      if (pointer !== null) {
        return
      }
      if (e.pointerType === "mouse" && e.button !== 0) {
        return
      }
      adoptIfIdle()
      glide = null
      pointer = { id: e.pointerId, last: [e.clientX, e.clientY], time: performance.now(), velocity: [0, 0] }
      try {
        canvas.setPointerCapture(e.pointerId)
      } catch {
        // Synthetic events in tests use arbitrary pointerIds that were
        // never captured, and some browsers throw for those. The drag
        // still works without capture in that case.
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      if (pointer === null || e.pointerId !== pointer.id) {
        return
      }
      const now = performance.now()
      const dt = now - pointer.time
      const dx = e.clientX - pointer.last[0]
      const dy = e.clientY - pointer.last[1]
      if (dt > 0) {
        const [vx, vy] = pointer.velocity
        pointer.velocity = [
          vx * (1 - velocitySmoothing) + (dx / dt) * velocitySmoothing,
          vy * (1 - velocitySmoothing) + (dy / dt) * velocitySmoothing,
        ]
      }
      pointer.last = [e.clientX, e.clientY]
      pointer.time = now
      panBy(dx, dy)
      ensureLoop()
    }

    // The next frame glides on, or settles and writes the URL.
    const onPointerUp = (e: PointerEvent) => {
      if (pointer === null || e.pointerId !== pointer.id) {
        return
      }
      const [vx, vy] = pointer.velocity
      pointer = null
      if (Math.hypot(vx, vy) >= minFlickSpeed) {
        glide = [vx, vy]
      }
      ensureLoop()
    }

    canvas.addEventListener("wheel", onWheel)
    canvas.addEventListener("pointerdown", onPointerDown)
    canvas.addEventListener("pointermove", onPointerMove)
    canvas.addEventListener("pointerup", onPointerUp)
    canvas.addEventListener("pointercancel", onPointerUp)

    return () => {
      canvas.removeEventListener("wheel", onWheel)
      canvas.removeEventListener("pointerdown", onPointerDown)
      canvas.removeEventListener("pointermove", onPointerMove)
      canvas.removeEventListener("pointerup", onPointerUp)
      canvas.removeEventListener("pointercancel", onPointerUp)
      cancelAnimationFrame(frame)
      frame = 0
      glide = null
      pointer = null
    }
  }, [ref])
}
