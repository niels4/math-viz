import { describe, expect, it } from "vitest"

import { formatNumber, parseNumber, readoutSlots, relation } from "./format"

describe("formatNumber", () => {
  it("prints two decimals with a true minus, and never −0", () => {
    expect(formatNumber(2)).toBe("2.00")
    expect(formatNumber(-1.5)).toBe("−1.50")
    expect(formatNumber(-0.001)).toBe("0.00")
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

describe("relation", () => {
  it("is = when two decimals show the value exactly, ≈ when they round it", () => {
    expect(relation(2.25)).toBe("=")
    expect(relation(0.1 + 0.2)).toBe("=")
    expect(relation(Math.sin(1))).toBe("≈")
  })
})

describe("readoutSlots", () => {
  it("fits the widest number each axis of the visible range prints", () => {
    expect(readoutSlots({ minX: -12.5, maxX: 3, minY: -4, maxY: 150 })).toEqual({ x: 6, y: 6 })
    expect(readoutSlots(null)).toBeNull()
  })
})
