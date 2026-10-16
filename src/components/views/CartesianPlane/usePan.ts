import type { Dispatch, RefObject, SetStateAction } from "react"

import { useEffect, useRef } from "react"

import { unscaledUnitSize } from "./constants"

// Release faster than this (px per ms) starts a glide; slower just stops.
const minFlickSpeed = 0.15
// Exponential decay per ms. Higher stops sooner.
const friction = 0.0045
// Glide ends below this speed (px per ms).
const stopSpeed = 0.02
// Clamp frame steps so a backgrounded tab does not jump on return.
const maxFrameDt = 50
// Weight of each mousemove sample in the velocity average.
const velocitySmoothing = 0.25

export const usePan = (
  ref: RefObject<HTMLCanvasElement | null>,
  setCenter: Dispatch<SetStateAction<[number, number]>>,
  scale: number,
  onPanEndFlush?: () => void,
) => {
  const prevMouse = useRef<[number, number]>([0, 0])
  const lastMoveTime = useRef(0)
  const velocity = useRef<[number, number]>([0, 0])
  const glideFrame = useRef(0)

  // Mirrored so the gesture listeners below stay attached for the whole
  // drag. Reading props through this ref keeps the effect deps to [ref],
  // so a rerender mid-gesture never tears down the window listeners.
  const live = useRef({ setCenter, scale, onPanEndFlush })
  useEffect(() => {
    live.current = { setCenter, scale, onPanEndFlush }
  })

  useEffect(() => {
    const canvas = ref.current
    if (canvas === null) {
      return
    }

    const cancelGlide = () => {
      cancelAnimationFrame(glideFrame.current)
      glideFrame.current = 0
    }

    // Release glide: keep moving along the release velocity while friction
    // decays it. Writes go through the same setCenter, so the debounced
    // URL flush and the settle flush behave like a normal pan.
    const startGlide = (vx0: number, vy0: number) => {
      let vx = vx0
      let vy = vy0
      let last = performance.now()
      const ctxUnit = unscaledUnitSize / live.current.scale

      const step = (now: number) => {
        const dt = Math.min(now - last, maxFrameDt)
        last = now
        const decay = Math.exp(-friction * dt)
        vx *= decay
        vy *= decay

        if (Math.hypot(vx, vy) < stopSpeed) {
          glideFrame.current = 0
          live.current.onPanEndFlush?.()
          return
        }

        const dx = vx * dt
        const dy = vy * dt
        live.current.setCenter(([x, y]) => [x - dx / ctxUnit, y + dy / ctxUnit])
        glideFrame.current = requestAnimationFrame(step)
      }

      glideFrame.current = requestAnimationFrame(step)
    }

    const onPanUpdate = (e: MouseEvent) => {
      const now = performance.now()
      const dt = now - lastMoveTime.current
      const dx = e.clientX - prevMouse.current[0]
      const dy = e.clientY - prevMouse.current[1]

      if (dt > 0) {
        const [pvx, pvy] = velocity.current
        velocity.current = [
          pvx * (1 - velocitySmoothing) + (dx / dt) * velocitySmoothing,
          pvy * (1 - velocitySmoothing) + (dy / dt) * velocitySmoothing,
        ]
      }

      prevMouse.current = [e.clientX, e.clientY]
      lastMoveTime.current = now

      const ctxUnit = unscaledUnitSize / live.current.scale
      live.current.setCenter(([x, y]) => [x - dx / ctxUnit, y + dy / ctxUnit])
    }

    const onPanEnd = () => {
      window.removeEventListener("mouseup", onPanEnd)
      window.removeEventListener("mousemove", onPanUpdate)
      const [vx, vy] = velocity.current
      velocity.current = [0, 0]

      if (Math.hypot(vx, vy) >= minFlickSpeed) {
        startGlide(vx, vy)
      } else {
        live.current.onPanEndFlush?.()
      }
    }

    const onPanStart = (e: MouseEvent) => {
      cancelGlide()
      prevMouse.current = [e.clientX, e.clientY]
      lastMoveTime.current = performance.now()
      velocity.current = [0, 0]
      window.addEventListener("mouseup", onPanEnd)
      window.addEventListener("mousemove", onPanUpdate)
    }

    canvas.addEventListener("mousedown", onPanStart)

    return () => {
      canvas.removeEventListener("mousedown", onPanStart)
      window.removeEventListener("mouseup", onPanEnd)
      window.removeEventListener("mousemove", onPanUpdate)
      cancelGlide()
    }
  }, [ref])
}
