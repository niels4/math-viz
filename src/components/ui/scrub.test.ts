import { describe, expect, it } from "vitest"

import { nudge, scrubDelta, scrubMode, wheelDxPx, type ScrubDelta } from "./scrub"

const offset = (over: Partial<ScrubDelta>): number =>
  scrubDelta({ value: 1, dxPx: 0, kind: "additive", mode: "coarse", ...over })

const scale = (over: Partial<ScrubDelta>): number => offset({ kind: "multiplicative", ...over })

describe("scrubMode", () => {
  it("Shift is fine, Ctrl or ⌘ snaps and wins over Shift", () => {
    const keys = { shiftKey: false, ctrlKey: false, metaKey: false }
    expect(scrubMode(keys)).toBe("coarse")
    expect(scrubMode({ ...keys, shiftKey: true })).toBe("fine")
    expect(scrubMode({ ...keys, ctrlKey: true })).toBe("snap")
    expect(scrubMode({ ...keys, metaKey: true, shiftKey: true })).toBe("snap")
  })
})

describe("scrubDelta additive", () => {
  it("moves 0.02 per px: 50 px per unit", () => {
    expect(offset({ dxPx: 100 })).toBe(3)
    expect(offset({ dxPx: 50 })).toBe(2)
  })

  it("Shift scales the rate down", () => {
    expect(offset({ dxPx: 100, mode: "fine" })).toBe(1.2)
  })

  it("lands on 0.01, and on 0.001 when fine", () => {
    // 10px at 0.02 is exactly 0.2, but binary float says 0.20000000000000004
    // without quantization.
    expect(offset({ value: 0, dxPx: 10 })).toBe(0.2)
    expect(offset({ value: 0, dxPx: 0.6 })).toBe(0.01)
    expect(offset({ value: 0, dxPx: 0.6, mode: "fine" })).toBe(0.001)
  })

  it("Ctrl snaps shifts to whole numbers", () => {
    expect(offset({ dxPx: 100, mode: "snap" })).toBe(3)
    expect(offset({ value: 0.4, mode: "snap" })).toBe(0)
    expect(offset({ value: -1.6, mode: "snap" })).toBe(-2)
  })
})

describe("scrubDelta multiplicative", () => {
  it("compounds per px (1.002^px) and lands on 0.01", () => {
    expect(scale({ dxPx: 100 })).toBe(1.22)
    expect(scale({ dxPx: -100 })).toBe(0.82)
  })

  it("lands on 0.001 when fine", () => {
    expect(scale({ dxPx: 100, mode: "fine" })).toBe(1.02)
    expect(scale({ value: 1.035, dxPx: 1, mode: "fine" })).toBe(1.035)
  })

  it("Ctrl snaps scales to quarters (D9)", () => {
    expect(scale({ value: 0.4, mode: "snap" })).toBe(0.5)
    expect(scale({ value: 1.3, mode: "snap" })).toBe(1.25)
    expect(scale({ value: -0.9, mode: "snap" })).toBe(-1)
  })

  it("never snaps a scale to 0 (D9)", () => {
    expect(scale({ value: 0.1, mode: "snap" })).toBe(0.25)
    expect(scale({ value: -0.1, mode: "snap" })).toBe(-0.25)
  })

  it("never rounds a scale to 0 and keeps its sign", () => {
    expect(scale({ value: 1, dxPx: -10000 })).toBe(0.01)
    expect(scale({ value: -2, dxPx: -10000 })).toBe(-0.01)
    expect(scale({ value: 1, dxPx: -100000, mode: "fine" })).toBe(0.001)
  })

  it("pushes additively out of zero", () => {
    expect(scale({ value: 0, dxPx: 100 })).toBe(0.2)
    expect(scale({ value: 0, dxPx: -100 })).toBe(-0.2)
  })
})

describe("nudge (arrow keys, FV 07)", () => {
  it("steps a shift by 0.01 or 0.1 and keeps a fine digit", () => {
    expect(nudge(1, "additive", 0.01)).toBe(1.01)
    expect(nudge(1, "additive", -0.1)).toBe(0.9)
    expect(nudge(-1.013, "additive", 0.01)).toBe(-1.003)
    expect(Object.is(nudge(-0.01, "additive", 0.01), 0)).toBe(true)
  })

  it("steps a scale's size, keeps its sign and never reaches 0", () => {
    expect(nudge(2, "multiplicative", 0.01)).toBe(2.01)
    expect(nudge(-2, "multiplicative", 0.01)).toBe(-2.01)
    expect(nudge(-2, "multiplicative", -0.1)).toBe(-1.9)
    expect(nudge(0.05, "multiplicative", -0.1)).toBe(0.01)
    expect(nudge(0.01, "multiplicative", -0.01)).toBe(0.01)
    expect(nudge(-0.005, "multiplicative", -0.01)).toBe(-0.005)
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
