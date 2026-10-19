import type { RefObject } from "react"

import { useEffect, useRef } from "react"

import { unscaledUnitSize } from "./constants"
import { maxScale, minScale } from "./queryParams"

type Center = [number, number]

const scaleSpeed = 0.001
const zoomRate = 0.012
const scaleEpsilon = 0.001
const minFlickSpeed = 0.15
const friction = 0.0045
const stopSpeed = 0.02
const flickWindow = 80
const maxFrameDt = 50
const firstFrameDt = 1000 / 60

const clampScale = (scale: number) => Math.min(maxScale, Math.max(minScale, scale))

const sameCenter = (a: Center, b: Center) => a[0] === b[0] && a[1] === b[1]

type Sample = { time: number; at: Center }

const trimSamples = (samples: Sample[], now: number) => {
  while ((samples[1]?.time ?? Infinity) <= now - flickWindow) {
    samples.shift()
  }
}

const releaseVelocity = (samples: Sample[], now: number): Center => {
  trimSamples(samples, now)
  const first = samples[0]
  const last = samples.at(-1)
  if (first === undefined || last === undefined || now <= first.time) {
    return [0, 0]
  }
  const dt = now - first.time
  return [(last.at[0] - first.at[0]) / dt, (last.at[1] - first.at[1]) / dt]
}

const offsetFromCenter = (canvas: HTMLCanvasElement, e: MouseEvent): Center => {
  const rect = canvas.getBoundingClientRect()
  const width = rect.width - canvas.clientLeft * 2
  const height = rect.height - canvas.clientTop * 2
  return [
    e.clientX - rect.left - canvas.clientLeft - Math.floor(width / 2),
    e.clientY - rect.top - canvas.clientTop - Math.floor(height / 2),
  ]
}

export const useCamera = (
  ref: RefObject<HTMLCanvasElement | null>,
  center: Center,
  scale: number,
  setCenter: (center: Center) => void,
  setScale: (scale: number) => void,
  onSettle: () => void,
) => {
  const props = useRef({ center, scale, setCenter, setScale, onSettle })
  useEffect(() => {
    props.current = { center, scale, setCenter, setScale, onSettle }
  })

  useEffect(() => {
    const canvas = ref.current
    if (canvas === null) {
      return
    }

    const cur = { center: props.current.center, scale: props.current.scale }
    const published = { ...cur }
    let targetScale = cur.scale
    let anchor: Center = [0, 0]
    let glide: Center | null = null
    let pointer: { id: number; last: Center; samples: Sample[] } | null = null
    let frame = 0
    let lastFrameTime: number | null = null

    const zooming = () => targetScale !== cur.scale
    const idle = () => pointer === null && glide === null && !zooming()

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
      if (Math.abs(targetScale - cur.scale) < scaleEpsilon * targetScale) {
        cur.scale = targetScale
      }
      const d = (prevScale - cur.scale) / unscaledUnitSize
      const [ox, oy] = anchor
      cur.center = [cur.center[0] + ox * d, cur.center[1] - oy * d]

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
      if (targetScale === cur.scale) {
        return
      }
      ensureLoop()
    }

    const onPointerDown = (e: PointerEvent) => {
      if (pointer !== null) {
        return
      }
      if (e.pointerType === "mouse" && e.button !== 0) {
        return
      }
      adoptIfIdle()
      glide = null
      const at: Center = [e.clientX, e.clientY]
      pointer = { id: e.pointerId, last: at, samples: [{ time: e.timeStamp, at }] }
      try {
        canvas.setPointerCapture(e.pointerId)
      } catch {}
    }

    const onPointerMove = (e: PointerEvent) => {
      if (pointer === null || e.pointerId !== pointer.id) {
        return
      }
      const at: Center = [e.clientX, e.clientY]
      const dx = at[0] - pointer.last[0]
      const dy = at[1] - pointer.last[1]
      pointer.last = at
      pointer.samples.push({ time: e.timeStamp, at })
      trimSamples(pointer.samples, e.timeStamp)
      panBy(dx, dy)
      ensureLoop()
    }

    const onPointerUp = (e: PointerEvent) => {
      if (pointer === null || e.pointerId !== pointer.id) {
        return
      }
      const velocity = releaseVelocity(pointer.samples, e.timeStamp)
      pointer = null
      if (Math.hypot(velocity[0], velocity[1]) >= minFlickSpeed) {
        glide = velocity
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
