import { describe, expect, it } from "vitest"

import { numberParts } from "#src/util/format/number.ts"

import { compactReadoutWidth, readoutSlots } from "./readoutFit.ts"

describe("readoutSlots", () => {
  it("keeps the widest value the visible range prints, minus sign included", () => {
    // R2's plane: 936 × 792 at 50 px per unit; R9's dock plane: 1256 × 408 at 40.
    expect(readoutSlots({ minX: -9.36, maxX: 9.36, minY: -7.92, maxY: 7.92 })).toEqual({ x: 5, y: 5 })
    expect(readoutSlots({ minX: -15.7, maxX: 15.7, minY: -5.1, maxY: 5.1 })).toEqual({ x: 6, y: 5 })
  })

  it("follows a panned view to either end", () => {
    expect(readoutSlots({ minX: 0.5, maxX: 19.2, minY: -120.5, maxY: -2 })).toEqual({ x: 5, y: 7 })
  })

  it("waits for the plane's first layout", () => {
    expect(readoutSlots(null)).toBeNull()
  })
})

describe("compactReadoutWidth", () => {
  it("measures R9's readouts as the snapshot's boxes", () => {
    // P: f(0.5) = 5.5 is 147 wide; Q: f(−2) = 3 is 103 (before fixed decimals).
    expect(compactReadoutWidth(3, numberParts(5.5), 3)).toBe(147)
    expect(compactReadoutWidth(2, numberParts(3), 1)).toBe(103)
  })

  it("grows by the readout face's 14.4 px a character, rounded up per number", () => {
    expect(compactReadoutWidth(6, numberParts(-105.06), 7)).toBe(17 + 87 + 9 + 33 + 101)
  })

  it("prints dashes with no point", () => {
    expect(compactReadoutWidth(1, null, 1)).toBe(17 + 15 + 9 + 33 + 15)
  })

  it("counts a scientific y's mantissa, ×10 and its smaller exponent", () => {
    // 123456 prints 1.23×10⁵: four characters, ×10, one exponent digit.
    expect(numberParts(123456)).toMatchObject({ kind: "sci", mantissa: "1.23", exponent: "5" })
    expect(compactReadoutWidth(4, numberParts(123456), 0)).toBeCloseTo(17 + 58 + 9 + 33 + 7 * 14.4 + 9)
  })
})
