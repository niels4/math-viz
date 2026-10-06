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

/** Scales multiply (a, b) and shifts add (h, k). */
export const isScale = (param: TransformParam): param is "a" | "b" => param === "a" || param === "b"

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
