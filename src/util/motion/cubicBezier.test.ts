import { describe, expect, it } from "vitest"

import { cubicBezier } from "./cubicBezier.ts"
import { cssLinear, easeDraw, easeEnter, motionCssVars } from "./motion.ts"

describe("cubicBezier", () => {
  // FV 05 › Function switch filmstrip: motion/ease-draw over 900 ms.
  it("matches the design's draw-on filmstrip", () => {
    const frames = [0, 160, 300, 450, 600, 900].map((ms) => Math.round(easeDraw(ms / 900) * 100))
    expect(frames).toEqual([0, 3, 15, 50, 85, 100])
  })

  it("is the identity for a straight line", () => {
    const linear = cubicBezier(0, 0, 1, 1)
    for (const p of [0.1, 0.33, 0.5, 0.9]) {
      expect(linear(p)).toBeCloseTo(p, 6)
    }
  })

  // CSS `ease` is cubic-bezier(0.25, 0.1, 0.25, 1): halfway in time it is about 80 % done.
  it("agrees with CSS ease", () => {
    expect(cubicBezier(0.25, 0.1, 0.25, 1)(0.5)).toBeCloseTo(0.8024, 3)
  })

  it("clamps outside 0 … 1", () => {
    expect(easeDraw(-1)).toBe(0)
    expect(easeDraw(2)).toBe(1)
  })
})

describe("CSS custom properties", () => {
  it("samples an ease into linear(), keeping overshoot", () => {
    const css = cssLinear(easeEnter.ease, 4)
    expect(css.startsWith("linear(0, ")).toBe(true)
    expect(css.endsWith(", 1)")).toBe(true)
    const stops = css.slice("linear(".length, -1).split(", ").map(Number)
    expect(Math.max(...stops)).toBeGreaterThan(1)
  })

  it("exposes the durations in ms", () => {
    expect(motionCssVars).toMatchObject({ "--motion-dur-fast": "160ms", "--motion-dur-draw": "900ms" })
  })
})
