import { describe, expect, it } from "vitest"

import {
  APPROX,
  formatMark,
  formatNumber,
  formatStored,
  formatTick,
  MINUS,
  numberParts,
  parseNumber,
  quantize,
  relation,
  roundTo,
} from "./number.ts"

describe("formatNumber", () => {
  // The user's ruling (2026-10-06): fixed decimals, so the decimal point
  // holds still while a value slides (1 → 1.01 → 1.1 no longer changes length).
  it("prints exactly 2 decimals", () => {
    expect(formatNumber(2)).toBe("2.00")
    expect(formatNumber(2.5)).toBe("2.50")
    expect(formatNumber(2.499)).toBe("2.50")
    expect(formatNumber(1234.5)).toBe("1234.50")
    expect(formatNumber(0.30000000000000004)).toBe("0.30")
    expect([1, 1.01, 1.1, 1.11].map((v) => formatNumber(v).length)).toEqual([4, 4, 4, 4])
  })

  it("prints the decimals asked for", () => {
    expect(formatNumber(1.03511, 3)).toBe("1.035")
    expect(formatNumber(1, 3)).toBe("1.000")
    expect(formatNumber(99.6, 0)).toBe("100")
  })

  // Before v2 the field showed 1.03511 where the equation showed 1.035: one
  // rule gives every place the same string.
  it("prints one stored value as one string", () => {
    expect(formatNumber(1.03511)).toBe("1.04")
  })

  it("uses U+2212 for negatives and never prints −0", () => {
    expect(formatNumber(-1)).toBe(`${MINUS}1.00`)
    expect(formatNumber(-2.25)).toBe(`${MINUS}2.25`)
    expect(formatNumber(-0)).toBe("0.00")
    expect(formatNumber(-0.004)).toBe("0.00")
  })

  it("rounds decimal halves away from zero", () => {
    expect(formatNumber(1.005)).toBe("1.01")
    expect(formatNumber(-1.005)).toBe(`${MINUS}1.01`)
    expect(formatNumber(0.125)).toBe("0.13")
    expect(formatNumber(-0.125)).toBe(`${MINUS}0.13`)
  })
})

describe("formatStored", () => {
  it("prints a stored value at 2 decimals, or 3 when it has a third", () => {
    expect(formatStored(2)).toBe("2.00")
    expect(formatStored(1.04)).toBe("1.04")
    expect(formatStored(1.035)).toBe("1.035")
    expect(formatStored(-0.5)).toBe(`${MINUS}0.50`)
    expect(formatStored(1.04 + 1e-12)).toBe("1.04")
  })

  it("holds 3 decimals while a fine drag does, whatever the value", () => {
    expect(formatStored(2, true)).toBe("2.000")
    expect(formatStored(1.04, true)).toBe("1.040")
    expect(formatStored(1.035, true)).toBe("1.035")
  })
})

describe("numberParts and relation", () => {
  it("reads the design's key-state readouts at 2 decimals", () => {
    // R2 f(2) = 4, R3 f(0.5) = 5.5, R8 f(0.5) = −0.5
    expect(numberParts(4)).toEqual({ kind: "fixed", text: "4.00", exact: true })
    expect(numberParts(5.5)).toEqual({ kind: "fixed", text: "5.50", exact: true })
    expect(numberParts(-0.5)).toEqual({ kind: "fixed", text: `${MINUS}0.50`, exact: true })
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
    expect(numberParts(30 ** 3)).toEqual({ kind: "fixed", text: "27000.00", exact: true })
    expect(numberParts(99999.99)).toEqual({ kind: "fixed", text: "99999.99", exact: true })
  })

  it("prints a value too small for 2 decimals as 0.00, rounded", () => {
    // FV 10's f(3.14) ≈ 0.0016 on sin x keeps the ruling's 2 decimals.
    expect(numberParts(Math.sin(3.14))).toEqual({ kind: "fixed", text: "0.00", exact: false })
    expect(numberParts(-0.0016)).toEqual({ kind: "fixed", text: "0.00", exact: false })
    expect(numberParts(-2.5e-7)).toEqual({ kind: "fixed", text: "0.00", exact: false })
    expect(relation(0.001)).toBe(APPROX)
  })

  it("goes scientific from 100000, mantissa at 2 decimals", () => {
    expect(numberParts(1e5)).toEqual({ kind: "sci", mantissa: "1.00", exponent: "5", exact: false })
    expect(numberParts(125000)).toEqual({ kind: "sci", mantissa: "1.25", exponent: "5", exact: false })
    expect(numberParts(-2.5e7)).toEqual({
      kind: "sci",
      mantissa: `${MINUS}2.50`,
      exponent: "7",
      exact: false,
    })
    expect(relation(125000)).toBe(APPROX)
  })

  it("renormalises a mantissa that rounds up to 10", () => {
    expect(numberParts(99999.996)).toEqual({ kind: "sci", mantissa: "1.00", exponent: "5", exact: false })
    expect(numberParts(9.9999e7)).toEqual({ kind: "sci", mantissa: "1.00", exponent: "8", exact: false })
  })

  it("prints zero exactly and a non-number as a dash", () => {
    expect(numberParts(0)).toEqual({ kind: "fixed", text: "0.00", exact: true })
    expect(numberParts(Number.NaN)).toEqual({ kind: "fixed", text: "–", exact: false })
  })
})

describe("formatMark (scale marks keep the short form)", () => {
  it("strips trailing zeros", () => {
    expect(formatMark(2)).toBe("2")
    expect(formatMark(0.9)).toBe("0.9")
    expect(formatMark(1.25)).toBe("1.25")
    expect(formatMark(-0.5)).toBe(`${MINUS}0.5`)
    expect(formatMark(-0.004)).toBe("0")
  })

  it("prints the decimals asked for, at most", () => {
    expect(formatMark(80, 0)).toBe("80")
    expect(formatMark(6.3, 1)).toBe("6.3")
    expect(formatMark(5, 1)).toBe("5")
  })
})

describe("formatTick (axis and scrubber labels)", () => {
  it("follows the short form from 0.01 up", () => {
    expect(formatTick(2)).toBe("2")
    expect(formatTick(-1.5)).toBe(`${MINUS}1.5`)
    expect(formatTick(250000)).toBe("250000")
    expect(formatTick(0)).toBe("0")
  })

  it("keeps a deep zoom's ticks apart and tiny ones as ≈0", () => {
    expect(formatTick(0.0016)).toBe("0.0016")
    expect(formatTick(-0.0005)).toBe(`${MINUS}0.0005`)
    expect(formatTick(2e-6)).toBe(`${APPROX}0`)
    expect(formatTick(-3e-5)).toBe(`${APPROX}0`)
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

describe("parseNumber", () => {
  it("reads what a field prints, either minus", () => {
    expect(parseNumber("1.04")).toBe(1.04)
    expect(parseNumber(`${MINUS}2.00`)).toBe(-2)
    expect(parseNumber(" -0.5 ")).toBe(-0.5)
    expect(parseNumber(".5")).toBe(0.5)
    expect(parseNumber("2.")).toBe(2)
    expect(parseNumber("1e3")).toBe(1000)
  })

  it("refuses anything that is not one finite number", () => {
    for (const text of ["", " ", "-", "1.0.4", "abc", "0x10", "Infinity", "1e999", "1,5"]) {
      expect(parseNumber(text)).toBeNull()
    }
  })
})
