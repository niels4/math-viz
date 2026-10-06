import { describe, expect, it } from "vitest"

import { render } from "#test"

import type { PlotFunc } from "../CartesianPlane/types.ts"

import { describeFormula } from "./describeFormula.ts"
import { FunctionFormula } from "./FunctionFormula.tsx"

const identity = (x: number): number => x

const plot = (overrides?: Partial<PlotFunc>): PlotFunc => ({
  xOffset: 0,
  xScale: 1,
  yOffset: 0,
  yScale: 1,
  func: identity,
  ...overrides,
})

describe("describeFormula", () => {
  it("hides default transforms", () => {
    expect(describeFormula("x", plot())).toBe("f(x) = x")
    expect(describeFormula("x2", plot())).toBe("f(x) = x²")
    expect(describeFormula("x3", plot())).toBe("f(x) = x³")
    expect(describeFormula("sin", plot())).toBe("f(x) = sin(x)")
  })

  it("shows only the off-default input side", () => {
    expect(describeFormula("x", plot({ xOffset: 2 }))).toBe("f(x) = x − 2")
    expect(describeFormula("x", plot({ xScale: 2 }))).toBe("f(x) = x/2")
    expect(describeFormula("x", plot({ xScale: 2, xOffset: 1 }))).toBe("f(x) = x/2 − 1")
  })

  it("flips the sign on negative offsets", () => {
    expect(describeFormula("x", plot({ xOffset: -2 }))).toBe("f(x) = x + 2")
    expect(describeFormula("x", plot({ yOffset: -1 }))).toBe("f(x) = x − 1")
  })

  it("prefixes the y-scale as a coefficient", () => {
    expect(describeFormula("x", plot({ yScale: 3 }))).toBe("f(x) = 3x")
    expect(describeFormula("x2", plot({ yScale: 3, yOffset: 1 }))).toBe("f(x) = 3x² + 1")
    expect(describeFormula("sin", plot({ yScale: 3 }))).toBe("f(x) = 3 sin(x)")
  })

  it("renders a full transform without code operators", () => {
    const full = plot({ xScale: 2, xOffset: 1, yScale: 3, yOffset: 1 })
    const text = describeFormula("x2", full)
    expect(text).toBe("f(x) = 3(x/2 − 1)² + 1")
    expect(text).not.toContain("*")
  })

  it("collapses a −1 scale to a leading minus", () => {
    expect(describeFormula("x2", plot({ yScale: -1 }))).toBe("f(x) = −x²")
    expect(describeFormula("x2", plot({ yScale: -2 }))).toBe("f(x) = −2x²")
  })
})

describe("FunctionFormula", () => {
  it("typesets powers as superscripts and scales as stacked fractions", async () => {
    await render(<FunctionFormula slug="x2" plotFunc={plot({ xScale: 2, xOffset: 1 })} />)
    const sup = document.body.querySelector("sup")
    expect(sup?.textContent).toBe("2")
    const den = document.body.querySelector("[class*='formula_den']")
    expect(den?.textContent).toBe("2")
    // No code-style operators leak into the visual formula.
    expect(document.body.textContent).not.toContain("*")
    expect(document.body.textContent).not.toContain("/")
  })
})
