import { describe, expect, it } from "vitest"

import type { BaseFunctionSlug } from "./baseFunctions.ts"

import { describeEquation, equationTokens, type EquationToken, type EquationMode } from "./equation.ts"
import { DEFAULT_PARAMS, type TransformParams } from "./form.ts"

const params = (over: Partial<TransformParams> = {}): TransformParams => ({ ...DEFAULT_PARAMS, ...over })

const says = (fn: BaseFunctionSlug, over: Partial<TransformParams> = {}, mode: EquationMode = "live") =>
  describeEquation(equationTokens(fn, params(over), mode))

const terms = (tokens: readonly EquationToken[]): EquationToken[] =>
  tokens.flatMap((t) =>
    t.kind === "frac" ? [...terms(t.num), ...terms(t.den)] : t.kind === "param" ? [t] : [],
  )

describe("equationTokens, live line", () => {
  it("hides parameters at their default", () => {
    expect(says("x")).toBe("f(x) = x")
    expect(says("x2")).toBe("f(x) = x²")
    expect(says("x3")).toBe("f(x) = x³")
    expect(says("sin")).toBe("f(x) = sin(x)")
  })

  it("prints the key states R3 and R8", () => {
    expect(says("x2", { a: 2, h: -1, k: 1 })).toBe("f(x) = 2(x + 1)² + 1")
    expect(says("x2", { a: -2, h: -1, k: 4 })).toBe("f(x) = −2(x + 1)² + 4")
  })

  it("prints the inner input as D1 has it: x − h, x / b, (x − h) / b", () => {
    expect(says("x2", { h: 1 })).toBe("f(x) = (x − 1)²")
    expect(says("x2", { b: 2 })).toBe("f(x) = (x/2)²")
    expect(says("x2", { b: 2, h: 1 })).toBe("f(x) = ((x − 1)/2)²")
    const [, , frac] = equationTokens("x2", params({ b: 2, h: 1 }), "live")
    expect(frac?.kind).toBe("frac")
  })

  it("keeps the sign rule: h > 0 subtracts, h < 0 adds", () => {
    expect(says("x", { h: 0.5 })).toBe("f(x) = x − 0.5")
    expect(says("x", { h: -0.5 })).toBe("f(x) = x + 0.5")
    expect(says("x", { k: -3 })).toBe("f(x) = x − 3")
  })

  it("writes a as a leading coefficient, and −1 as a bare minus", () => {
    expect(says("x2", { a: -1 })).toBe("f(x) = −x²")
    expect(says("x", { a: 3 })).toBe("f(x) = 3x")
    expect(says("x", { a: 3, h: 1 })).toBe("f(x) = 3(x − 1)")
    expect(says("sin", { a: 3 })).toBe("f(x) = 3 sin(x)")
  })

  it("prints a stored value whole, the same string the field shows", () => {
    expect(says("x2", { a: 1.035, b: -1 })).toBe("f(x) = 1.035(x/(−1))²")
  })

  it("grows the parentheses only around a fraction", () => {
    const big = (tokens: EquationToken[]) => tokens.filter((t) => t.kind === "paren").map((t) => t.big)
    expect(big(equationTokens("x2", params({ h: 1 }), "live"))).toEqual([false, false])
    expect(big(equationTokens("sin", params({ b: 2 }), "live"))).toEqual([true, true])
  })

  it("puts each value in its own term, operator included", () => {
    const live = terms(equationTokens("x2", params({ a: 2, b: 0.5, h: -1, k: 1 }), "live"))
    expect(live.map((t) => (t.kind === "param" ? [t.param, t.text, t.ghost] : null))).toEqual([
      ["a", "2", false],
      ["h", "+ 1", false],
      ["b", "0.5", false],
      ["k", "+ 1", false],
    ])
  })
})

describe("equationTokens, form line", () => {
  it("prints every letter whatever the values", () => {
    expect(says("x2", {}, "form")).toBe("f(x) = a((x − h)/b)² + k")
    expect(says("sin", { a: 2 }, "form")).toBe("f(x) = a sin((x − h)/b) + k")
    expect(says("x", {}, "form")).toBe("f(x) = a((x − h)/b) + k")
  })

  it("marks letters at their default as ghost slots (D13)", () => {
    const form = terms(equationTokens("x2", params({ a: 2, h: -1, k: 1 }), "form"))
    const ghosts = form.flatMap((t) => (t.kind === "param" && t.ghost ? [t.param] : []))
    expect(ghosts).toEqual(["b"])
  })

  it("keeps a dragged term in the live line at its default, with the form's operator", () => {
    const live = (keep: readonly ("a" | "b" | "h" | "k")[]) =>
      describeEquation(equationTokens("x2", DEFAULT_PARAMS, "live", keep))
    expect(live([])).toBe("f(x) = x²")
    expect(live(["k"])).toBe("f(x) = x² + 0")
    expect(live(["h", "k"])).toBe("f(x) = (x − 0)² + 0")
    expect(live(["a", "b"])).toBe("f(x) = 1(x/1)²")
  })
})
