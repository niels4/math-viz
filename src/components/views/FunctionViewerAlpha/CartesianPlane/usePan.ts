import type { Dispatch, RefObject, SetStateAction } from "react"

import { useCallback, useEffect, useRef, useState } from "react"

import type { DragState, PointerPoint, Velocity } from "./types.ts"

import {
  INERTIA_MIN_SPEED,
  clampLaunchSpeed,
  decayVelocity,
  pruneSamplesToWindow,
  velocityOfSamples,
} from "./util.ts"

// Pan owns the pan offset plus single-finger drag and release inertia.
// Anything here that scales by zoom takes it as an argument (a number for
// discrete gestures, a live ref for the inertia tick), so this hook stays
// independent of zoom state, which lives in useZoom.

export type PanApi = {
  panX: number
  panY: number
  setPanX: Dispatch<SetStateAction<number>>
  setPanY: Dispatch<SetStateAction<number>>
  stopInertia: () => void
  startInertia: (vx0: number, vy0: number, zoomRef: RefObject<number>) => void
  beginDrag: (x: number, y: number) => void
  trackDrag: (x: number, y: number, zoom: number) => void
  releaseDrag: (x: number, y: number, zoomRef: RefObject<number>) => void
  cancelDrag: () => void
  adoptRemainingDrag: (point: PointerPoint | undefined) => void
}

export function usePan(): PanApi {
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const dragRef = useRef<DragState | null>(null)
  const inertiaRef = useRef<number | null>(null)

  const stopInertia = useCallback(() => {
    if (inertiaRef.current !== null && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(inertiaRef.current)
    }
    inertiaRef.current = null
  }, [])

  // jsdom has no rAF (only with pretendToBeVisual), so inertia is a no-op there.
  const startInertia = useCallback(
    (vx0: number, vy0: number, zoomRef: RefObject<number>) => {
      if (typeof requestAnimationFrame !== "function" || typeof performance === "undefined") {
        return
      }
      stopInertia()
      const speed0 = Math.hypot(vx0, vy0)
      if (speed0 < INERTIA_MIN_SPEED) {
        return
      }
      const clamped: Velocity = clampLaunchSpeed({ vx: vx0, vy: vy0 })
      let vx = clamped.vx
      let vy = clamped.vy
      let last = performance.now()
      const tick = (now: number) => {
        const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
        last = now
        const decayed = decayVelocity(vx, vy, dt)
        vx = decayed.vx
        vy = decayed.vy
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

  const beginDrag = (x: number, y: number) => {
    dragRef.current = {
      lastX: x,
      lastY: y,
      samples: [{ x, y, t: performance.now() }],
    }
  }

  // Drag pans the plane: pixel deltas become math-unit shifts so the grabbed
  // point stays under the cursor (y negated: screen y grows downward).
  const trackDrag = (x: number, y: number, zoom: number) => {
    const drag = dragRef.current
    if (drag === null) {
      return
    }
    const dx = x - drag.lastX
    const dy = y - drag.lastY
    drag.lastX = x
    drag.lastY = y
    drag.samples.push({ x, y, t: performance.now() })
    pruneSamplesToWindow(drag.samples)
    setPanX((curr) => curr + dx / zoom)
    setPanY((curr) => curr - dy / zoom)
  }

  const releaseDrag = (x: number, y: number, zoomRef: RefObject<number>) => {
    const drag = dragRef.current
    dragRef.current = null
    // Momentum needs an observed motion segment (two samples): a bare
    // down/up or a pinch lift-off with no single-finger travel carries no
    // fling intent, and a few-ms window would inflate it into a huge
    // velocity either way.
    if (drag !== null && typeof performance !== "undefined" && drag.samples.length >= 2) {
      const now = performance.now()
      const samples = drag.samples
      samples.push({ x, y, t: now })
      const velocity = velocityOfSamples(samples)
      if (velocity !== null) {
        startInertia(velocity.vx, velocity.vy, zoomRef)
      }
    }
  }

  // Second finger down (or a lingering multi-touch lift): the pinch takes
  // over, so any in-progress drag observation is discarded.
  const cancelDrag = () => {
    dragRef.current = null
  }

  // Pinch back to one finger: restart drag tracking on the remaining
  // finger with no samples yet. Momentum observation starts only when
  // it actually moves, so a quick lift-off can never read fast pinch
  // motion as fling velocity.
  const adoptRemainingDrag = (point: PointerPoint | undefined) => {
    dragRef.current =
      point === undefined
        ? null
        : {
            lastX: point.x,
            lastY: point.y,
            samples: [],
          }
  }

  return {
    panX,
    panY,
    setPanX,
    setPanY,
    stopInertia,
    startInertia,
    beginDrag,
    trackDrag,
    releaseDrag,
    cancelDrag,
    adoptRemainingDrag,
  }
}
