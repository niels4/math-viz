import { describe, expect, it } from "vitest"

import { scrubDelta, wheelDxPx } from "./scrub"

describe("scrubDelta additive", () => {
  it("scales dx by the step", () => {
    expect(
      scrubDelta({
        value: 1,
        dxPx: 100,
        kind: "additive",
        step: 0.02,
        fineScale: 0.1,
        quantum: 0.002,
        fine: false,
        snap: false,
      }),
    ).toBeCloseTo(3, 10)
  })

  it("Shift scales the rate down", () => {
    expect(
      scrubDelta({
        value: 1,
        dxPx: 100,
        kind: "additive",
        step: 0.02,
        fineScale: 0.1,
        quantum: 0.002,
        fine: true,
        snap: false,
      }),
    ).toBeCloseTo(1.2, 10)
  })

  it("Ctrl snaps to integers and wins over fine", () => {
    expect(
      scrubDelta({
        value: 1,
        dxPx: 100,
        kind: "additive",
        step: 0.02,
        fineScale: 0.1,
        quantum: 0.002,
        fine: true,
        snap: true,
      }),
    ).toBe(3)
  })

  it("quantizes to the display quantum", () => {
    // 10px at 0.02 is exactly 0.2, but binary float says 0.20000000000000004
    // without quantization.
    expect(
      scrubDelta({
        value: 0,
        dxPx: 10,
        kind: "additive",
        step: 0.02,
        fineScale: 0.1,
        quantum: 0.002,
        fine: false,
        snap: false,
      }),
    ).toBe(0.2)
  })
})

describe("scrubDelta multiplicative", () => {
  it("compounds per px", () => {
    expect(
      scrubDelta({
        value: 1,
        dxPx: 100,
        kind: "multiplicative",
        step: 0.002,
        fineScale: 0.1,
        quantum: 0.002,
        fine: false,
        snap: false,
      }),
    ).toBeCloseTo(1.002 ** 100, 4)
  })

  it("preserves sign so negative scales never cross zero", () => {
    const next = scrubDelta({
      value: -2,
      dxPx: -10000,
      kind: "multiplicative",
      step: 0.002,
      fineScale: 0.1,
      quantum: 0.002,
      fine: false,
      snap: false,
    })
    expect(next).toBeLessThan(0)
  })

  it("pushes additively out of zero", () => {
    expect(
      scrubDelta({
        value: 0,
        dxPx: 100,
        kind: "multiplicative",
        step: 0.002,
        fineScale: 0.1,
        quantum: 0.002,
        fine: false,
        snap: false,
      }),
    ).toBeCloseTo(0.2, 10)
  })
})

describe("wheelDxPx", () => {
  it("scroll up is positive", () => {
    expect(wheelDxPx(-100, 0)).toBe(15)
  })

  it("normalizes line mode", () => {
    expect(wheelDxPx(-3, 1)).toBeCloseTo(7.2, 10)
  })
})
