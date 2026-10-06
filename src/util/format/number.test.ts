import { describe, expect, it } from "vitest"

import {
  APPROX,
  formatNumber,
  formatShort,
  formatStored,
  MINUS,
  numberParts,
  quantize,
  relation,
  roundTo,
} from "./number.ts"

describe("formatNumber", () => {
  it("prints 2 dp with trailing zeros stripped", () => {
    expect(formatNumber(2)).toBe("2")
    expect(formatNumber(2.5)).toBe("2.5")
    expect(formatNumber(2.499)).toBe("2.5")
    expect(formatNumber(1234.5)).toBe("1234.5")
    expect(formatNumber(0.30000000000000004)).toBe("0.3")
  })

  it("prints 3 dp after a fine drag", () => {
    expect(formatNumber(1.03511, 3)).toBe("1.035")
  })

  // Today the field shows 1.03511 where the equation shows 1.035: one rule
  // gives every place the same string.
  it("prints one stored value as one string", () => {
    expect(formatNumber(1.03511)).toBe("1.04")
  })

  it("uses U+2212 for negatives and never prints −0", () => {
    expect(formatNumber(-1)).toBe(`${MINUS}1`)
    expect(formatNumber(-2.25)).toBe(`${MINUS}2.25`)
    expect(formatNumber(-0)).toBe("0")
    expect(formatNumber(-0.004)).toBe("0")
  })

  it("keeps whole numbers whole at 0 dp", () => {
    expect(formatNumber(10, 0)).toBe("10")
    expect(formatNumber(99.6, 0)).toBe("100")
  })

  it("rounds decimal halves away from zero", () => {
    expect(formatNumber(1.005)).toBe("1.01")
    expect(formatNumber(-1.005)).toBe(`${MINUS}1.01`)
    expect(formatNumber(0.125)).toBe("0.13")
    expect(formatNumber(-0.125)).toBe(`${MINUS}0.13`)
  })
})

describe("numberParts and relation", () => {
  it("reads the design's key-state readouts", () => {
    // R2 f(2) = 4, R3 f(0.5) = 5.5, R8 f(0.5) = −0.5
    expect(numberParts(4)).toEqual({ kind: "fixed", text: "4", exact: true })
    expect(numberParts(5.5)).toEqual({ kind: "fixed", text: "5.5", exact: true })
    expect(numberParts(-0.5)).toEqual({ kind: "fixed", text: `${MINUS}0.5`, exact: true })
    expect(relation(4)).toBe("=")
  })

  it("marks rounded readouts with ≈", () => {
    // FV 10: f(1.8) ≈ 5.83 on x³; Components: f(−3) ≈ 10.56
    expect(numberParts(1.8 ** 3)).toEqual({ kind: "fixed", text: "5.83", exact: false })
    expect(numberParts(10.5625)).toEqual({ kind: "fixed", text: "10.56", exact: false })
    expect(relation(1.8 ** 3)).toBe(APPROX)
  })

  it("keeps fixed digits up to 100000", () => {
    // FV 10: f(30) = 27000 on x³
    expect(numberParts(30 ** 3)).toEqual({ kind: "fixed", text: "27000", exact: true })
  })

  it("gives two significant figures below 0.01", () => {
    // FV 10: f(3.14) ≈ 0.0016 on sin x
    expect(numberParts(Math.sin(3.14))).toEqual({ kind: "fixed", text: "0.0016", exact: false })
    expect(numberParts(-0.0016)).toEqual({ kind: "fixed", text: `${MINUS}0.0016`, exact: true })
    expect(numberParts(0.0001)).toEqual({ kind: "fixed", text: "0.0001", exact: true })
    expect(relation(0.001)).toBe("=")
  })

  it("goes scientific outside 1e-4 … 1e5, mantissa at 2 dp", () => {
    expect(numberParts(1e5)).toEqual({ kind: "sci", mantissa: "1", exponent: "5", exact: false })
    expect(numberParts(125000)).toEqual({ kind: "sci", mantissa: "1.25", exponent: "5", exact: false })
    expect(numberParts(-2.5e-7)).toEqual({
      kind: "sci",
      mantissa: `${MINUS}2.5`,
      exponent: `${MINUS}7`,
      exact: false,
    })
    expect(relation(125000)).toBe(APPROX)
  })

  it("renormalises a mantissa that rounds up to 10", () => {
    expect(numberParts(9.999e-5)).toEqual({ kind: "sci", mantissa: "1", exponent: `${MINUS}4`, exact: false })
    expect(numberParts(9.9999e7)).toEqual({ kind: "sci", mantissa: "1", exponent: "8", exact: false })
  })

  it("prints zero exactly and a non-number as a dash", () => {
    expect(numberParts(0)).toEqual({ kind: "fixed", text: "0", exact: true })
    expect(numberParts(Number.NaN)).toEqual({ kind: "fixed", text: "–", exact: false })
  })
})

describe("formatShort (labels, tags, markers)", () => {
  it("follows the readout rule where it is fixed", () => {
    expect(formatShort(5.832)).toBe("5.83")
    expect(formatShort(0.0016)).toBe("0.0016")
  })

  it("prints huge values whole and tiny ones as ≈0", () => {
    expect(formatShort(250000)).toBe("250000")
    expect(formatShort(2e-6)).toBe(`${APPROX}0`)
    expect(formatShort(-3e-5)).toBe(`${APPROX}0`)
  })
})

describe("roundTo and quantize", () => {
  it("rounds in decimal", () => {
    expect(roundTo(1.005, 2)).toBe(1.01)
    expect(roundTo(-2.675, 2)).toBe(-2.68)
    expect(roundTo(1e-7, 2)).toBe(0)
  })

  it("snaps to the step without float noise", () => {
    expect(quantize(0.1 + 0.2, 0.01)).toBe(0.3)
    expect(quantize(1.2345, 0.01)).toBe(1.23)
    expect(quantize(1.0004, 0.001)).toBe(1)
    expect(quantize(0.4, 0.25)).toBe(0.5)
    expect(quantize(-0.126, 0.25)).toBe(-0.25)
  })

  it("snaps ties away from zero, so a value and its negative snap alike", () => {
    expect(quantize(0.375, 0.25)).toBe(0.5)
    expect(quantize(-0.375, 0.25)).toBe(-0.5)
    expect(quantize(-0.5, 1)).toBe(-1)
    expect(Object.is(quantize(-0.001, 0.01), 0)).toBe(true)
  })
})

describe("formatStored", () => {
  it("prints every digit a stored value has, and no more", () => {
    expect(formatStored(1.035)).toBe("1.035")
    expect(formatStored(1.04)).toBe("1.04")
    expect(formatStored(2)).toBe("2")
    expect(formatStored(-0.5)).toBe("−0.5")
  })
})
