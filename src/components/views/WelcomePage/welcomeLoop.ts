import type { FunctionSlug } from "../FunctionViewer/queryParams"
import type { TransformParam } from "../FunctionViewer/state"
import type { Transform } from "../FunctionViewer/transformCurves"

import {
  SCALE_PER_PX,
  SHIFT_PER_PX,
  scrubbed,
} from "../FunctionViewer/SideBar/TransformSection/ScrubValue/scrub"

export type LoopState = { func: FunctionSlug } & Transform

type Step =
  | { kind: "hold"; frames: number }
  | { kind: "drag"; frames: number; param: TransformParam; to: number }
  | { kind: "switch"; frames: number; func: FunctionSlug }

const fps = 24

const start: LoopState = { func: "x2", a: 1, k: 0, b: 1, h: 0 }

const steps: readonly Step[] = [
  { kind: "hold", frames: 29 },
  { kind: "drag", frames: 29, param: "k", to: -1.5 },
  { kind: "hold", frames: 10 },
  { kind: "drag", frames: 24, param: "h", to: 1 },
  { kind: "hold", frames: 14 },
  { kind: "switch", frames: 26, func: "sinx" },
  { kind: "hold", frames: 14 },
  { kind: "drag", frames: 34, param: "a", to: 3 },
  { kind: "hold", frames: 10 },
  { kind: "drag", frames: 29, param: "k", to: 0 },
  { kind: "hold", frames: 10 },
  { kind: "drag", frames: 29, param: "b", to: 2 },
  { kind: "hold", frames: 14 },
  { kind: "switch", frames: 26, func: "x3" },
  { kind: "hold", frames: 14 },
  { kind: "drag", frames: 24, param: "h", to: 0 },
  { kind: "hold", frames: 14 },
  { kind: "switch", frames: 26, func: "x2" },
  { kind: "hold", frames: 10 },
  { kind: "drag", frames: 29, param: "a", to: 1 },
  { kind: "hold", frames: 7 },
  { kind: "drag", frames: 29, param: "b", to: 1 },
]

export const loopMs = (steps.reduce((sum, step) => sum + step.frames, 0) * 1000) / fps

export const welcomeStill: LoopState = { func: "sinx", a: 3, k: 0, b: 1.48, h: 1 }

const cubicBezier = (x1: number, y1: number, x2: number, y2: number) => {
  const at = (t: number, p1: number, p2: number) =>
    3 * p1 * t * (1 - t) ** 2 + 3 * p2 * t ** 2 * (1 - t) + t ** 3
  return (x: number) => {
    let lo = 0
    let hi = 1
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2
      if (at(mid, x1, x2) < x) {
        lo = mid
      } else {
        hi = mid
      }
    }
    return at((lo + hi) / 2, y1, y2)
  }
}

const easeDrag = cubicBezier(0.4, 0, 0.2, 1)

const dragged = (from: number, to: number, isScale: boolean, progress: number) => {
  if (progress >= 1) {
    return to
  }
  const travel = isScale ? Math.log(to / from) / Math.log(1 + SCALE_PER_PX) : (to - from) / SHIFT_PER_PX
  return scrubbed(from, easeDrag(progress) * travel, isScale, "coarse")
}

export const loopAt = (ms: number): LoopState => {
  let frame = ((ms % loopMs) * fps) / 1000
  let state = start
  for (const step of steps) {
    if (step.kind === "switch") {
      state = { ...state, func: step.func }
    }
    if (step.kind === "drag") {
      const { param, to } = step
      const progress = Math.min(1, frame / step.frames)
      state = { ...state, [param]: dragged(state[param], to, param === "a" || param === "b", progress) }
    }
    if (frame <= step.frames) {
      return state
    }
    frame -= step.frames
  }
  return state
}
