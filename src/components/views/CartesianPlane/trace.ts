import type { Viewport } from "./viewport.ts"

import { toMathX, toScreenY } from "./viewport.ts"

// A curve as the plane draws it: one sample per CSS pixel across the plane
// and two past each edge, so the round caps stay out of view, broken where
// the function is not finite. Each sample carries the length drawn inside
// the plane up to it, so a draw-on trims by what can be seen (FV 05: the
// pen draws left to right and spends no time above or below the plane),
// and an owner can ask when the pen passes an x.

/** Off-view samples clamp this far past the edges, inside canvas coordinate limits. */
const OVERSHOOT_PX = 10_000
/** Samples start and end this far past the edges. */
const EDGE_SAMPLES = 2

export type TraceSample = {
  x: number
  y: number
  /** The pen lifts before this sample: the curve broke (a non-finite value). */
  start: boolean
  /** The length drawn inside the plane up to this sample, px. */
  at: number
}

export type Trace = {
  samples: readonly TraceSample[]
  /** The length the curve draws inside the plane, px. */
  length: number
}

/** The part of the segment between y0 and y1 that lies within [0, height]: its share, 0–1. */
const insideShare = (y0: number, y1: number, height: number): number => {
  const lo = Math.min(y0, y1)
  const hi = Math.max(y0, y1)
  if (hi < 0 || lo > height) {
    return 0
  }
  if (hi === lo) {
    return 1
  }
  return (Math.min(hi, height) - Math.max(lo, 0)) / (hi - lo)
}

export const curveTrace = (vp: Viewport, fn: (x: number) => number): Trace => {
  const samples: TraceSample[] = []
  let at = 0
  let prev: TraceSample | null = null
  for (let px = -EDGE_SAMPLES; px <= vp.width + EDGE_SAMPLES; px++) {
    const value = fn(toMathX(vp, px))
    if (!Number.isFinite(value)) {
      prev = null
      continue
    }
    const y = Math.min(vp.height + OVERSHOOT_PX, Math.max(-OVERSHOOT_PX, toScreenY(vp, value)))
    if (prev !== null) {
      at += Math.hypot(px - prev.x, y - prev.y) * insideShare(prev.y, y, vp.height)
    }
    const sample: TraceSample = { x: px, y, start: prev === null, at }
    samples.push(sample)
    prev = sample
  }
  return { samples, length: at }
}

/**
 * The samples a pen has drawn by `share` of the visible length, the last
 * one cut where the pen stops. All of them at 1 or more; none at 0 or less.
 */
export const traceUpTo = (trace: Trace, share: number): readonly TraceSample[] => {
  if (share >= 1) {
    return trace.samples
  }
  if (share <= 0 || trace.length === 0) {
    return []
  }
  const stop = share * trace.length
  const drawn: TraceSample[] = []
  for (const sample of trace.samples) {
    if (sample.at <= stop) {
      drawn.push(sample)
      continue
    }
    const last = drawn.at(-1)
    if (last !== undefined && !sample.start) {
      const t = (stop - last.at) / (sample.at - last.at)
      drawn.push({
        x: last.x + (sample.x - last.x) * t,
        y: last.y + (sample.y - last.y) * t,
        start: false,
        at: stop,
      })
    }
    break
  }
  return drawn
}

/**
 * The share of the visible length the pen has drawn when it reaches screen
 * x: 0 before the curve starts, 1 past its end or when nothing shows.
 */
export const shareAtX = (trace: Trace, x: number): number => {
  if (trace.length === 0) {
    return 1
  }
  const sample = trace.samples.find((s) => s.x >= x)
  return sample === undefined ? 1 : sample.at / trace.length
}
