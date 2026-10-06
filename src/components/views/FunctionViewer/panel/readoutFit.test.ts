import { describe, expect, it } from "vitest"

import { numberParts } from "#src/util/format/number.ts"

import { compactReadoutWidth } from "./readoutFit.ts"

describe("compactReadoutWidth", () => {
  it("measures R9's readouts as the snapshot's boxes", () => {
    // P: f(0.5) = 5.5 is 147 wide; Q: f(−2) = 3 is 103.
    expect(compactReadoutWidth("0.5", numberParts(5.5))).toBe(147)
    expect(compactReadoutWidth("−2", numberParts(3))).toBe(103)
  })

  it("grows by the readout face's 14.4 px a character, rounded up per number", () => {
    expect(compactReadoutWidth("−10.25", numberParts(-105.06))).toBe(17 + 87 + 9 + 33 + 101)
  })

  it("prints dashes with no point", () => {
    expect(compactReadoutWidth("–", null)).toBe(17 + 15 + 9 + 33 + 15)
  })

  it("counts a scientific y's mantissa, ×10 and its smaller exponent", () => {
    // 123456 prints 1.23×10⁵: four characters, ×10, one exponent digit.
    expect(numberParts(123456)).toMatchObject({ kind: "sci", mantissa: "1.23", exponent: "5" })
    expect(compactReadoutWidth("3", numberParts(123456))).toBeCloseTo(17 + 15 + 9 + 33 + 7 * 14.4 + 9)
  })
})
