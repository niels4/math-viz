import { describe, expect, it } from "vitest"

import { SCRUB_QUANTUM, scrubDelta, wheelDxPx, type ScrubDelta } from "./scrub"

const offset = (over: Partial<ScrubDelta>): number =>
  scrubDelta({
    value: 1,
    dxPx: 0,
    kind: "additive",
    step: 0.02,
    fineScale: 0.1,
    quantum: SCRUB_QUANTUM,
    fine: false,
    snap: false,
    ...over,
  })

const scale = (over: Partial<ScrubDelta>): number => offset({ kind: "multiplicative", step: 0.002, ...over })

describe("scrubDelta additive", () => {
  it("scales dx by the step: 50 px per unit", () => {
    expect(offset({ dxPx: 100 })).toBe(3)
    expect(offset({ dxPx: 50 })).toBe(2)
  })

  it("Shift scales the rate down", () => {
    expect(offset({ dxPx: 100, fine: true })).toBe(1.2)
  })

  it("lands on 0.01, and on 0.001 when fine", () => {
    // 10px at 0.02 is exactly 0.2, but binary float says 0.20000000000000004
    // without quantization.
    expect(offset({ value: 0, dxPx: 10 })).toBe(0.2)
    expect(offset({ value: 0, dxPx: 0.6 })).toBe(0.01)
    expect(offset({ value: 0, dxPx: 0.6, fine: true })).toBe(0.001)
  })

  it("Ctrl snaps shifts to whole numbers and wins over fine", () => {
    expect(offset({ dxPx: 100, fine: true, snap: true })).toBe(3)
    expect(offset({ value: 0.4, dxPx: 0, snap: true })).toBe(0)
    expect(offset({ value: -1.6, dxPx: 0, snap: true })).toBe(-2)
  })
})

describe("scrubDelta multiplicative", () => {
  it("compounds per px (1.002^px) and lands on 0.01", () => {
    expect(scale({ dxPx: 100 })).toBe(1.22)
    expect(scale({ dxPx: -100 })).toBe(0.82)
  })

  it("lands on 0.001 when fine", () => {
    expect(scale({ dxPx: 100, fine: true })).toBe(1.02)
    expect(scale({ value: 1.035, dxPx: 1, fine: true })).toBe(1.035)
  })

  it("Ctrl snaps scales to quarters (D9)", () => {
    expect(scale({ value: 0.4, snap: true })).toBe(0.5)
    expect(scale({ value: 1.3, snap: true })).toBe(1.25)
    expect(scale({ value: -0.9, snap: true })).toBe(-1)
  })

  it("never snaps a scale to 0 (D9)", () => {
    expect(scale({ value: 0.1, snap: true })).toBe(0.25)
    expect(scale({ value: -0.1, snap: true })).toBe(-0.25)
  })

  it("never rounds a scale to 0 and keeps its sign", () => {
    expect(scale({ value: 1, dxPx: -10000 })).toBe(0.01)
    expect(scale({ value: -2, dxPx: -10000 })).toBe(-0.01)
    expect(scale({ value: 1, dxPx: -100000, fine: true })).toBe(0.001)
  })

  it("pushes additively out of zero", () => {
    expect(scale({ value: 0, dxPx: 100 })).toBe(0.2)
    expect(scale({ value: 0, dxPx: -100 })).toBe(-0.2)
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
