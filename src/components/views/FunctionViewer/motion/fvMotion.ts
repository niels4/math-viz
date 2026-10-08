import type { MotionLevel } from "#src/util/motion/motion.ts"

import {
  DURATION_MS,
  easeDraw,
  easeEnter,
  easeSweep,
  REDUCED_FADE_MS,
  SPRING_SWEEP,
} from "#src/util/motion/motion.ts"
import { springAt } from "#src/util/motion/spring.ts"

import type { PlaneCurve, PlaneHandle, PlanePoint, PlaneScene } from "../../CartesianPlane/scene.ts"
import type { PlaneView } from "../../CartesianPlane/viewport.ts"
import type { BaseFunctionSlug } from "../math/baseFunctions.ts"
import type { TransformParam, TransformParams } from "../math/form.ts"
import type { PlaneSceneInput } from "../planeScene.ts"

import { curveTrace, shareAtX } from "../../CartesianPlane/trace.ts"
import { toScreenX, viewportOf } from "../../CartesianPlane/viewport.ts"
import { BASE_FUNCTIONS } from "../math/baseFunctions.ts"
import { evaluate, TRANSFORM_PARAMS } from "../math/form.ts"
import { buildPlaneScene } from "../planeScene.ts"

// FV 05 (figma0 fv/70-motion.js, the motion sheet's timing table) as pure
// functions of time, in seconds: what each event moves, by how much, and
// when. The view's GSAP side (useFvMotion) keeps the layers below, one per
// event, and draws motionScene's frame on every tick; the panel and the
// stored values never animate (stored = shown).

const FAST_S = DURATION_MS.fast / 1000
const REDUCED_S = REDUCED_FADE_MS / 1000

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v))

/** Progress through [from, to], eased: 0 before, 1 after (an ease may overshoot between). */
const along = (t: number, from: number, to: number, ease: (p: number) => number): number =>
  t <= from ? 0 : t >= to ? 1 : ease((t - from) / (to - from))

/** The inverse of an ease rising monotonically over [0, upTo]: the progress at which it reaches v. */
const progressOf = (ease: (p: number) => number, v: number, upTo = 1): number => {
  let lo = 0
  let hi = upTo
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    if (ease(mid) < v) {
      lo = mid
    } else {
      hi = mid
    }
  }
  return (lo + hi) / 2
}

// ---------------------------------------------------------------- first paint

/**
 * FV 05 › Draw-on timeline: the plane's grid group (lines, axes, ticks,
 * labels, O) fades in, the curve draws, P then its label arrive (the label
 * rising 8 px), and each ruler nudges once, 60 ms after the one before.
 * The chrome shows from the start.
 */
export const FIRST_PAINT = {
  grid: { from: 0, to: 0.4 },
  trim: { from: 0.35, to: 1.25 },
  p: { from: 1.15, to: 1.31 },
  label: { from: 1.3, to: 1.62, rise: 8 },
  nudge: { from: 1.7, out: 0.25, back: 0.35, stagger: 0.06, px: -10 },
  end: 2.6,
} as const

export type FirstPaint = {
  grid: number
  trim: number
  /** P's arrival, and the handles' with it. */
  p: number
  label: number
  /** px below its place. */
  rise: number
}

export const firstPaintAt = (t: number): FirstPaint => {
  const { grid, trim, p, label } = FIRST_PAINT
  const labelIn = along(t, label.from, label.to, easeEnter.ease)
  return {
    grid: along(t, grid.from, grid.to, easeDraw),
    trim: along(t, trim.from, trim.to, easeDraw),
    p: Math.min(1, along(t, p.from, p.to, easeEnter.ease)),
    label: Math.min(1, labelIn),
    rise: label.rise * (1 - labelIn),
  }
}

/** Ruler i's nudge at t (in DOM order): its ticks, labels and home notch go 10 px left and come back. */
export const nudgeAt = (t: number, i: number): number => {
  const { from, out, back, stagger, px } = FIRST_PAINT.nudge
  const start = from + i * stagger
  if (t <= start || t >= start + out + back) {
    return 0
  }
  return t < start + out
    ? px * easeEnter.ease((t - start) / out)
    : px * (1 - easeEnter.ease((t - start - out) / back))
}

// ------------------------------------------------------------------ value jumps

/** FV 05 › Value jumps: a, b, h, k spring together (1 / 170 / 26) until within 0.1 % (0.702 s). */
export const JUMP_S = easeSweep.settle

export const jumpAt = (from: TransformParams, to: TransformParams, t: number): TransformParams => {
  if (t >= JUMP_S) {
    return to
  }
  const k = springAt(SPRING_SWEEP, t)
  const out: Record<TransformParam, number> = { ...to }
  for (const p of TRANSFORM_PARAMS) {
    out[p] = from[p] + (to[p] - from[p]) * k
  }
  return out
}

// ------------------------------------------------------------- function switch

/** FV 05 › Function switch: the old curve fades (160 ms), the new one draws (900 ms), each mark lands as the pen passes it. */
export const SWITCH = { fade: FAST_S, draw: DURATION_MS.draw / 1000, land: FAST_S } as const
export const SWITCH_END_S = SWITCH.draw + SWITCH.land

/** When the pen has drawn `share` of the new curve. */
export const drawTimeOf = (share: number): number =>
  share <= 0 ? 0 : share >= 1 ? SWITCH.draw : progressOf(easeDraw, share) * SWITCH.draw

/** A mark at `share` of the new curve, t into a switch: 0 until the pen gets there, then in on the enter spring. */
export const landingAt = (t: number, share: number): number => {
  const at = drawTimeOf(share)
  return Math.min(1, along(t, at, at + SWITCH.land, easeEnter.ease))
}

export const switchAt = (t: number): { old: number; trim: number } => ({
  old: 1 - clamp01(t / SWITCH.fade),
  trim: along(t, 0, SWITCH.draw, easeDraw),
})

// ------------------------------------------------------------------------ Q

/**
 * FV 05 › Pointer enters the plane: Q fades in (160 ms) and its drop lines
 * grow from Q to the axes (120 ms), on the enter spring. Leaving reverses
 * it, linearly, in 120 ms. Under reduced motion Q only fades, 120 ms each way.
 */
export const Q_MOTION = { enter: FAST_S, lines: 0.12, leave: DURATION_MS.leave / 1000 } as const

export type QLook = { alpha: number; reach: number }

const Q_REST: QLook = { alpha: 1, reach: 1 }

/** How far an enter has come, as the time it takes the enter spring to reach that opacity. */
export const qEnterTimeOf = (alpha: number): number =>
  alpha <= 0 ? 0 : alpha >= 1 ? Q_MOTION.enter : progressOf(easeEnter.ease, alpha, 0.41) * Q_MOTION.enter

export const qEnterAt = (t: number, level: MotionLevel): QLook => {
  if (level !== "full") {
    return { alpha: clamp01(t / REDUCED_S), reach: 1 }
  }
  return {
    alpha: Math.min(1, along(t, 0, Q_MOTION.enter, easeEnter.ease)),
    reach: Math.min(1, along(t, 0, Q_MOTION.lines, easeEnter.ease)),
  }
}

/** Leaving from opacity `from`, t later. */
export const qLeaveAt = (t: number, from: number, level: MotionLevel): QLook => {
  const k = Math.max(0, from - t / (level === "full" ? Q_MOTION.leave : REDUCED_S))
  return { alpha: k, reach: level === "full" ? k : 1 }
}

// -------------------------------------------------------------- the Original

/** FV 05 › Original toggle: the ghost's opacity 0 ↔ 75 %, 160 ms (120 under reduced motion), linear. */
export const ghostShareAt = (t: number, from: number, to: number, level: MotionLevel): number =>
  from + (to - from) * clamp01(t / (level === "full" ? FAST_S : REDUCED_S))

// ---------------------------------------------------------------- term flash

/**
 * FV 05 › Changed term flash (FV 04: a change flashes its term): the plate
 * (mix/primary-26) comes in over 80 ms on the enter spring, holds, and
 * goes linearly by 600 ms. Under reduced motion it goes over the last 120 ms.
 */
export const FLASH = { in: 0.08, out: 0.3, end: 0.6 } as const

export const flashAt = (t: number, level: MotionLevel): number => {
  if (t <= 0 || t >= FLASH.end) {
    return 0
  }
  if (t < FLASH.in) {
    return clamp01(level === "full" ? easeEnter.ease(t / FLASH.in) : t / FLASH.in)
  }
  const out = level === "full" ? FLASH.out : FLASH.end - REDUCED_S
  return t < out ? 1 : 1 - (t - out) / (FLASH.end - out)
}

// -------------------------------------------------------------------- frames

/** What is moving, each since when (seconds on one clock); null when at rest. */
export type FvMotionLayers = {
  /** The first paint (full motion only). */
  paint: number | null
  /** A value jump: a, b, h, k from `from` to `to`. */
  jump: { from: TransformParams; to: TransformParams; start: number } | null
  /** A function switch: the curve before it fades while the new one draws. */
  switch: { fn: BaseFunctionSlug; params: TransformParams; start: number } | null
  /** Q entering from opacity `from` (where the pointer is), or leaving from it (where it was, `x`). */
  q: { dir: "in" | "out"; x: number; from: number; start: number } | null
  /** The Original's share of its 75 %, from `from` to `to`. */
  ghost: { from: number; to: number; start: number } | null
}

export const AT_REST: FvMotionLayers = { paint: null, jump: null, switch: null, q: null, ghost: null }

const durationOf = {
  paint: () => FIRST_PAINT.end,
  jump: () => JUMP_S,
  switch: () => SWITCH_END_S,
  q: (q: NonNullable<FvMotionLayers["q"]>, level: MotionLevel) =>
    q.dir === "in"
      ? (level === "full" ? Q_MOTION.enter : REDUCED_S) -
        (level === "full" ? qEnterTimeOf(q.from) : q.from * REDUCED_S)
      : q.from * (level === "full" ? Q_MOTION.leave : REDUCED_S),
  ghost: (level: MotionLevel) => (level === "full" ? FAST_S : REDUCED_S),
}

/** The layers still moving at `now`: the others are done and rest. */
export const settle = (layers: FvMotionLayers, now: number, level: MotionLevel): FvMotionLayers => {
  const live = <T extends { start: number }>(layer: T | null, duration: (l: T) => number): T | null =>
    layer !== null && now - layer.start < duration(layer) ? layer : null
  return {
    paint: layers.paint !== null && now - layers.paint < durationOf.paint() ? layers.paint : null,
    jump: live(layers.jump, durationOf.jump),
    switch: live(layers.switch, durationOf.switch),
    q: live(layers.q, (q) => durationOf.q(q, level)),
    ghost: live(layers.ghost, () => durationOf.ghost(level)),
  }
}

export const isMoving = (layers: FvMotionLayers): boolean =>
  layers.paint !== null ||
  layers.jump !== null ||
  layers.switch !== null ||
  layers.q !== null ||
  layers.ghost !== null

/** The displayed a, b, h, k: on their way while a jump runs, else as stored. */
export const shownParams = (stored: TransformParams, layers: FvMotionLayers, now: number): TransformParams =>
  layers.jump === null ? stored : jumpAt(layers.jump.from, layers.jump.to, now - layers.jump.start)

/** Q's look at `now`: entering, leaving, or at rest. */
export const qLookAt = (layers: FvMotionLayers, now: number, level: MotionLevel): QLook => {
  const q = layers.q
  if (q === null) {
    return Q_REST
  }
  const t = now - q.start
  return q.dir === "in"
    ? qEnterAt(t + (level === "full" ? qEnterTimeOf(q.from) : q.from * REDUCED_S), level)
    : qLeaveAt(t, q.from, level)
}

const fadedCurve = (curve: PlaneCurve, alpha: number, drawTo: number): PlaneCurve => ({
  ...curve,
  ...(alpha < 1 && { alpha: (curve.alpha ?? 1) * alpha }),
  ...(drawTo < 1 && { drawTo }),
})

/**
 * The plane's frame at `now`: the view's scene built from the displayed
 * a, b, h, k, with what each moving layer does to it. The first paint fades
 * the grid in, draws the curve on, brings P, its label and the handles in;
 * a switch fades the old curve and lands each mark as the pen passes its x
 * (`view`: where the plane is, so the frame knows where its pen is); Q enters
 * or leaves; the Original fades.
 */
export const motionScene = (
  input: PlaneSceneInput,
  layers: FvMotionLayers,
  now: number,
  view: PlaneView | null,
  level: MotionLevel,
): PlaneScene => {
  const params = shownParams(input.params, layers, now)
  const first = layers.paint === null ? null : firstPaintAt(now - layers.paint)
  const sw = layers.switch === null ? null : { t: now - layers.switch.start, ...layers.switch }
  const swAt = sw === null ? null : switchAt(sw.t)
  const q = qLookAt(layers, now, level)
  const qX = input.qX ?? (layers.q?.dir === "out" ? layers.q.x : null)
  const ghost =
    layers.ghost === null
      ? input.ghostOn
        ? 1
        : 0
      : ghostShareAt(now - layers.ghost.start, layers.ghost.from, layers.ghost.to, level)
  const scene = buildPlaneScene({ ...input, params, qX, ghostOn: ghost > 0 })
  const trim = Math.min(first?.trim ?? 1, swAt?.trim ?? 1)

  // Where the pen is on the new curve: each mark lands as it passes.
  let land = (_x: number) => 1
  if (sw !== null && view !== null) {
    const vp = viewportOf(view)
    const g = BASE_FUNCTIONS[input.fn].g
    const trace = curveTrace(vp, (x) => evaluate(g, params, x))
    land = (x) => landingAt(sw.t, shareAtX(trace, toScreenX(vp, x)))
  }

  const old: PlaneCurve[] =
    sw === null || swAt === null || swAt.old <= 0
      ? []
      : buildPlaneScene({ ...input, fn: sw.fn, params: sw.params, qX: null }).curves.map((c) => ({
          ...fadedCurve(c, swAt.old, 1),
          id: `${c.id}-old`,
        }))
  const curves = [
    ...old,
    ...scene.curves
      .map((c) =>
        c.id === "original" ? fadedCurve(c, ghost, trim) : c.id === "f" ? fadedCurve(c, 1, trim) : c,
      )
      .filter((c) => c.alpha === undefined || c.alpha > 0),
  ]

  const pAlpha = first?.p ?? 1
  const points = scene.points.map((p): PlanePoint => {
    if (p.id === "p") {
      const alpha = pAlpha * land(p.x)
      return {
        ...p,
        ...(alpha < 1 && { alpha }),
        ...(first !== null && first.label < 1 && { labelAlpha: first.label }),
        ...(first !== null && first.rise !== 0 && { labelRise: first.rise }),
      }
    }
    if (p.id === "q") {
      const alpha = q.alpha * land(p.x)
      return {
        ...p,
        ...(alpha < 1 && { alpha }),
        ...(q.reach < 1 && { reach: q.reach }),
      }
    }
    return p
  })
  const handles = (scene.handles ?? []).map((h): PlaneHandle => {
    const alpha = pAlpha * land(h.x)
    return alpha < 1 ? { ...h, alpha } : h
  })
  const qAlpha = q.alpha * (qX === null ? 1 : land(qX))
  return {
    ...scene,
    ...(first !== null && first.grid < 1 && { gridAlpha: first.grid }),
    curves,
    points,
    handles,
    guides: scene.guides.map((g) => (qAlpha < 1 ? { ...g, alpha: qAlpha } : g)),
  }
}
