import { describe, expect, it } from "vitest"

import { formatChange, formatNumber, numberParts, parseNumber, readoutSlots } from "./format"

describe("formatNumber", () => {
  it("prints two decimals with a true minus, and never −0", () => {
    expect(formatNumber(2)).toBe("2.00")
    expect(formatNumber(-1.5)).toBe("−1.50")
    expect(formatNumber(-0.001)).toBe("0.00")
  })
})

describe("formatChange", () => {
  it("signs a change either way, and leaves one that rounds to 0 unsigned", () => {
    expect(formatChange(1.25)).toBe("+1.25")
    expect(formatChange(-0.5)).toBe("−0.50")
    expect(formatChange(0.001)).toBe("0.00")
  })
})

describe("parseNumber", () => {
  it("reads a number typed with either minus", () => {
    expect(parseNumber(" 1.5 ")).toBe(1.5)
    expect(parseNumber("−2")).toBe(-2)
    expect(parseNumber("-.25")).toBe(-0.25)
    expect(parseNumber("1e2")).toBe(100)
  })

  it("refuses anything else", () => {
    for (const text of ["", "abc", "1.0.4", "0x10", "Infinity", "1e400"]) {
      expect(parseNumber(text)).toBeNull()
    }
  })
})

describe("numberParts", () => {
  it("prints fixed digits below 100000", () => {
    expect(numberParts(99999.99)).toEqual({ kind: "fixed", text: "99999.99", exact: true })
    expect(numberParts(-12.345)).toEqual({ kind: "fixed", text: "−12.35", exact: false })
  })

  it("goes scientific from 100000, with two decimals in the mantissa", () => {
    expect(numberParts(123456)).toEqual({ kind: "sci", mantissa: "1.23", exponent: "5", exact: false })
    expect(numberParts(-1e6)).toEqual({ kind: "sci", mantissa: "−1.00", exponent: "6", exact: true })
  })

  it("carries a mantissa that rounds up to 10 into the exponent", () => {
    expect(numberParts(99999.996)).toEqual({ kind: "sci", mantissa: "1.00", exponent: "5", exact: false })
    expect(numberParts(9.999e7)).toEqual({ kind: "sci", mantissa: "1.00", exponent: "8", exact: false })
  })
})

describe("an exact readout", () => {
  it("is one that shows the value exactly, not a rounding of it", () => {
    const exact = (v: number) => numberParts(v).exact
    expect(exact(2.25)).toBe(true)
    expect(exact(0.1 + 0.2)).toBe(true)
    expect(exact(Math.sin(1))).toBe(false)
    expect(exact(2.5e6)).toBe(true)
    expect(exact(2.505e6)).toBe(false)
  })
})

describe("readoutSlots", () => {
  it("fits the widest number each axis of the visible range prints", () => {
    expect(readoutSlots({ minX: -12.5, maxX: 3, minY: -4, maxY: 150 })).toEqual({ x: 6, y: 6 })
    expect(readoutSlots(null)).toBeNull()
  })
})
