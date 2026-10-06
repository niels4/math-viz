import { SCRUB_QUANTUM } from "#src/components/ui/scrub.ts"
import { quantize } from "#src/util/format/number.ts"

import type { BaseFunction } from "./baseFunctions.ts"

// Decision D1 lives here: y = a · g((x − h) / b) + k. Each parameter has one
// geometric meaning: g's anchor (0, 0) lands on (h, k), and the curve is b
// times wider and a times taller around it. Before v2 the code evaluated
// a · g(x/b − h) + k, which moves the curve by b·h, not h.

/** Outside f( ) first (vertical: a, k), then inside (horizontal: b, h). */
export const TRANSFORM_PARAMS = ["a", "k", "b", "h"] as const

export type TransformParam = (typeof TRANSFORM_PARAMS)[number]

export type TransformParams = Readonly<Record<TransformParam, number>>

export type MathPoint = { x: number; y: number }

/** The identity transform. */
export const DEFAULT_PARAMS: TransformParams = { a: 1, b: 1, h: 0, k: 0 }

/** Stored values are rounded (3 dp), so a parameter is at its default exactly or not at all. */
export const isAtDefault = (params: TransformParams, param: TransformParam): boolean =>
  params[param] === DEFAULT_PARAMS[param]

/** No parameter off its default. */
export const isIdentity = (params: TransformParams): boolean =>
  TRANSFORM_PARAMS.every((param) => isAtDefault(params, param))

/** Scales multiply (a, b) and shifts add (h, k). */
export const isScale = (param: TransformParam): param is "a" | "b" => param === "a" || param === "b"

/**
 * Whether a parameter may hold a value: any finite number, except a scale
 * of 0, which squashes the curve flat (FV 07's "values that teach"; D9
 * keeps drags and snaps off 0 too).
 */
export const acceptsValue = (param: TransformParam, value: number): boolean =>
  Number.isFinite(value) && !(isScale(param) && value === 0)

/** A value field's refusal code for a typed scale of 0 (FV 07: "A scale of 0 squashes the curve flat"). */
export const ZERO_SCALE = "zero-scale"

/**
 * The inner input g receives, as the steps applied to x in order: subtract
 * h, then divide by b. The order is D1: ["b", "h"] would be the old
 * x/b − h. `evaluate`, the anchor, the unit point and the equation's inner
 * input (equation.ts) all follow it.
 */
export const INNER_STEPS: readonly ("h" | "b")[] = ["h", "b"]

/** (x − h) / b */
export const innerInput = (params: TransformParams, x: number): number => {
  let u = x
  for (const step of INNER_STEPS) {
    u = step === "h" ? u - params.h : u / params.b
  }
  return u
}

/** The x whose inner input is u: h + b·u. */
export const xForInner = (params: TransformParams, u: number): number => {
  let x = u
  for (const step of INNER_STEPS.toReversed()) {
    x = step === "h" ? x + params.h : x * params.b
  }
  return x
}

/** a · g((x − h) / b) + k */
export const evaluate = (g: (u: number) => number, params: TransformParams, x: number): number =>
  params.a * g(innerInput(params, x)) + params.k

/** Where g's anchor (0, 0) lands: (h, k). */
export const anchorPoint = (params: TransformParams): MathPoint => ({ x: xForInner(params, 0), y: params.k })

/** Where g's unit point (u, g(u)) lands (D14): (h + b·u, k + a·g(u)). */
export const unitPoint = (base: BaseFunction, params: TransformParams): MathPoint => ({
  x: xForInner(params, base.unitX),
  y: params.a * base.g(base.unitX) + params.k,
})

// The handles' inverse maps (decisions D21, D22), through the same step
// order: each solves INNER_STEPS for its unknown, so switching D1 moves them
// too. A handle drag stores what a ruler's plain drag stores: 0.01.

/** The steps before `step` applied to x, and the steps after it undone from u. */
const around = (params: TransformParams, step: "h" | "b", x: number, u: number) => {
  const i = INNER_STEPS.indexOf(step)
  let before = x
  for (const s of INNER_STEPS.slice(0, i)) {
    before = s === "h" ? before - params.h : before / params.b
  }
  let after = u
  for (const s of INNER_STEPS.slice(i + 1).toReversed()) {
    after = s === "h" ? after + params.h : after * params.b
  }
  return { before, after }
}

/** The h that sends x to the inner input u: before − h = after. */
const hSending = (params: TransformParams, x: number, u: number): number => {
  const { before, after } = around(params, "h", x, u)
  return before - after
}

/** The b that sends x to the inner input u: before / b = after. */
const bSending = (params: TransformParams, x: number, u: number): number => {
  const { before, after } = around(params, "b", x, u)
  return before / after
}

/** A handle drag's lattice: a ruler's plain drag (ui/scrub.ts). */
export const HANDLE_QUANTUM = SCRUB_QUANTUM

/** On the lattice; a scale never on 0 (D9): one step out on the side it came from. */
const onLattice = (raw: number, scale: boolean, was: number): number => {
  const v = quantize(raw, HANDLE_QUANTUM) || 0
  return scale && v === 0 ? (Math.sign(raw) || Math.sign(was) || 1) * HANDLE_QUANTUM : v
}

/**
 * D21: the anchor ◆ is g's anchor (0, 0) on the curve, (h, k). Dragged to
 * `to`, it moves the curve there.
 */
export const dragAnchor = (params: TransformParams, to: MathPoint): TransformParams => {
  const h = onLattice(hSending(params, to.x, 0), false, params.h)
  return { ...params, h, k: onLattice(to.y, false, params.k) }
}

/**
 * The stretch grip ■ is g's unit point (D14): one step b across and a up
 * from the anchor. Dragged to `to`, it sets both: b sends to.x to the unit
 * input, a = (y − k) / g(u). Below the anchor's height a turns negative and
 * the curve flips (D22); left of the anchor b does and the curve mirrors.
 */
export const dragStretch = (base: BaseFunction, params: TransformParams, to: MathPoint): TransformParams => {
  const b = onLattice(bSending(params, to.x, base.unitX), true, params.b)
  const a = onLattice((to.y - params.k) / base.g(base.unitX), true, params.a)
  return Number.isFinite(a) && Number.isFinite(b) ? { ...params, a, b } : params
}
