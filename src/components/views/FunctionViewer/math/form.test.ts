import { describe, expect, it } from "vitest"

import { BASE_FUNCTION_SLUGS, BASE_FUNCTIONS } from "./baseFunctions.ts"
import {
  acceptsValue,
  anchorPoint,
  DEFAULT_PARAMS,
  evaluate,
  innerInput,
  isAtDefault,
  isIdentity,
  unitPoint,
  xForInner,
  type TransformParams,
} from "./form.ts"

const params = (over: Partial<TransformParams>): TransformParams => ({ ...DEFAULT_PARAMS, ...over })
const square = BASE_FUNCTIONS.x2.g

// The key states (fv-rec-key-states.json): x², a = 2, h = −1, k = 1, P at 0.5.
const R3 = params({ a: 2, h: -1, k: 1 })
const R8 = params({ a: -2, h: -1, k: 4 })

describe("evaluate (D1: a · g((x − h) / b) + k)", () => {
  it("reads the key states' P readouts", () => {
    expect(evaluate(square, R3, 0.5)).toBe(5.5)
    expect(evaluate(square, R8, 0.5)).toBe(-0.5)
  })

  it("is g itself at the defaults", () => {
    for (const slug of BASE_FUNCTION_SLUGS) {
      const { g } = BASE_FUNCTIONS[slug]
      expect(evaluate(g, DEFAULT_PARAMS, 0.7)).toBe(g(0.7))
    }
  })

  it("draws the old form's curve with h = b · h_old (FV 01 Specs › Maths change)", () => {
    // 1.02(x/1.035 − 0.258)² + 0.482 ≡ 1.02((x − 0.267)/1.035)² + 0.482
    const old = (x: number) => 1.02 * (x / 1.035 - 0.258) ** 2 + 0.482
    const now = params({ a: 1.02, b: 1.035, h: 1.035 * 0.258, k: 0.482 })
    for (const x of [-3, -0.5, 0, 0.267, 1, 4.2]) {
      expect(evaluate(square, now, x)).toBeCloseTo(old(x), 12)
    }
    expect(anchorPoint(now).x).toBeCloseTo(0.267, 3)
  })
})

describe("anchor and unit point", () => {
  it("puts g's anchor (0, 0) on (h, k) for every base function", () => {
    const p = params({ a: 3, b: 0.5, h: 1.5, k: -2 })
    expect(anchorPoint(p)).toEqual({ x: 1.5, y: -2 })
    for (const slug of BASE_FUNCTION_SLUGS) {
      expect(evaluate(BASE_FUNCTIONS[slug].g, p, 1.5)).toBeCloseTo(-2, 12)
    }
  })

  it("puts the unit point at x = 1 for powers and π/2 for sin (D14)", () => {
    expect(unitPoint(BASE_FUNCTIONS.x2, R3)).toEqual({ x: 0, y: 3 })
    const p = params({ a: 2, b: 2, h: 1, k: 1 })
    const sinUnit = unitPoint(BASE_FUNCTIONS.sin, p)
    expect(sinUnit.x).toBeCloseTo(1 + Math.PI, 12)
    expect(sinUnit.y).toBeCloseTo(3, 12)
  })

  it("puts every unit point on its curve", () => {
    const p = params({ a: -1.5, b: 0.75, h: -2, k: 0.5 })
    for (const slug of BASE_FUNCTION_SLUGS) {
      const base = BASE_FUNCTIONS[slug]
      const unit = unitPoint(base, p)
      expect(evaluate(base.g, p, unit.x)).toBeCloseTo(unit.y, 12)
    }
  })

  it("inverts the inner input", () => {
    const p = params({ b: -0.5, h: 2 })
    expect(innerInput(p, 3)).toBe(-2)
    expect(xForInner(p, innerInput(p, 3))).toBe(3)
  })
})

describe("isAtDefault", () => {
  it("compares stored values exactly", () => {
    expect(isAtDefault(R3, "b")).toBe(true)
    expect(isAtDefault(R3, "a")).toBe(false)
    expect(isAtDefault(params({ k: -0 }), "k")).toBe(true)
  })
})

describe("isIdentity and acceptsValue", () => {
  it("is the identity only with every parameter at its default", () => {
    expect(isIdentity(DEFAULT_PARAMS)).toBe(true)
    expect(isIdentity({ ...DEFAULT_PARAMS, h: -1 })).toBe(false)
  })

  it("takes any finite number, but never a scale of 0", () => {
    expect(acceptsValue("h", 0)).toBe(true)
    expect(acceptsValue("k", -12)).toBe(true)
    expect(acceptsValue("a", -2)).toBe(true)
    expect(acceptsValue("a", 0)).toBe(false)
    expect(acceptsValue("b", 0)).toBe(false)
    expect(acceptsValue("k", Number.NaN)).toBe(false)
  })
})
