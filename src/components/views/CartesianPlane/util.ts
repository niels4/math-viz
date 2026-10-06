import type { DragSample, Velocity, ViewState } from "./types.ts"

export const MIN_UNIT_SIZE = 0.25
export const MAX_UNIT_SIZE = 100
export const ZOOM_SPEED = 0.0015

// Pan inertia (Google Maps style fling): release velocity in screen px/s
// decays exponentially, so a fast flick glides ~v0/DECAY px then stops.
export const INERTIA_DECAY = 4.5
export const INERTIA_MIN_SPEED = 24
export const INERTIA_MAX_SPEED = 8000
export const VELOCITY_WINDOW_MS = 120

export const clampZoom = (zoom: number): number => Math.min(MAX_UNIT_SIZE, Math.max(MIN_UNIT_SIZE, zoom))

export const normalizeWheelDelta = (deltaY: number, deltaMode: number): number =>
  deltaMode === 1 ? deltaY * 16 : deltaY

export type WheelAnchor = {
  zoom: number
  panX: number
  panY: number
  delta: number
  cursorX: number
  cursorY: number
  centerX: number
  centerY: number
}

// Multiplicative zoom: each tick scales by a fixed factor, so one notch
// feels the same at zoom 100 and zoom 0.25. Pan shifts to hold the math
// point under the cursor fixed (y sign flips: screen y grows downward).
// Returns null when the clamp leaves zoom unchanged, so the caller can bail.
export const wheelView = ({
  zoom,
  panX,
  panY,
  delta,
  cursorX,
  cursorY,
  centerX,
  centerY,
}: WheelAnchor): ViewState | null => {
  const nextZoom = clampZoom(zoom * Math.exp(-delta * ZOOM_SPEED))
  if (nextZoom === zoom) {
    return null
  }
  const k = 1 / nextZoom - 1 / zoom
  return {
    zoom: nextZoom,
    panX: panX + (cursorX - centerX) * k,
    panY: panY + (centerY - cursorY) * k,
  }
}

export type PinchStep = {
  view: ViewState
  dist: number
  lastDist: number
  midX: number
  midY: number
  lastMidX: number
  lastMidY: number
  rectWidth: number
  rectHeight: number
}

// Glued-finger similarity, telescoping exactly across the events of one
// dispatch: scale about the old midpoint, then shift old midpoint onto
// the new one. Both fingertips keep their content points (absent
// rotation, which Maps-style zoom ignores like Apple/Google Maps).
// Same hold-point math as wheel zoom (y flips: screen y grows down).
// Callers must re-baseline instead when dist or lastDist is 0.
export const pinchView = ({
  view,
  dist,
  lastDist,
  midX,
  midY,
  lastMidX,
  lastMidY,
  rectWidth,
  rectHeight,
}: PinchStep): ViewState => {
  const nextZoom = clampZoom(view.zoom * (dist / lastDist))
  const k = 1 / nextZoom - 1 / view.zoom
  const dx = midX - lastMidX
  const dy = midY - lastMidY
  return {
    zoom: nextZoom,
    panX: view.panX + dx / view.zoom + (midX - rectWidth / 2) * k,
    panY: view.panY - dy / view.zoom + (rectHeight / 2 - midY) * k,
  }
}

// Drop samples older than the velocity window, keeping at least two so a
// motion segment always spans a measurable dt.
export const pruneSamplesToWindow = (samples: DragSample[]): void => {
  while (samples.length > 2) {
    const first = samples[0]
    const last = samples[samples.length - 1]
    if (first === undefined || last === undefined || last.t - first.t <= VELOCITY_WINDOW_MS) {
      break
    }
    samples.shift()
  }
}

// Release velocity over the trailing window. Null means no fling intent:
// fewer than two samples, no elapsed time, or slower than the inertia
// floor (a few-ms window would otherwise inflate into a huge velocity).
export const velocityOfSamples = (samples: DragSample[]): Velocity | null => {
  const last = samples[samples.length - 1]
  if (samples.length < 2 || last === undefined) {
    return null
  }
  const now = last.t
  let firstIndex = samples.findIndex((s) => now - s.t <= VELOCITY_WINDOW_MS)
  if (firstIndex === -1) {
    firstIndex = samples.length - 1
  }
  const first = samples[firstIndex]
  if (first === undefined || last.t <= first.t) {
    return null
  }
  const dt = (last.t - first.t) / 1000
  if (dt <= 0) {
    return null
  }
  const vx = (last.x - first.x) / dt
  const vy = (last.y - first.y) / dt
  if (Math.hypot(vx, vy) < INERTIA_MIN_SPEED) {
    return null
  }
  return { vx, vy }
}

export const clampLaunchSpeed = ({ vx, vy }: Velocity): Velocity => {
  const speed = Math.hypot(vx, vy)
  const scale = Math.min(1, INERTIA_MAX_SPEED / speed)
  return { vx: vx * scale, vy: vy * scale }
}

export const decayVelocity = (vx: number, vy: number, dt: number): Velocity => {
  const decay = Math.exp(-INERTIA_DECAY * dt)
  return { vx: vx * decay, vy: vy * decay }
}
