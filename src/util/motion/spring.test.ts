import { describe, expect, it } from "vitest"

import { SPRING_ENTER, SPRING_SWEEP } from "./motion.ts"
import { settleTime, springAt, springEase } from "./spring.ts"

const percent = (v: number) => Math.round(v * 100)

describe("springAt", () => {
  // FV 05 › Reset all filmstrip: motion/ease-sweep (1 / 170 / 26).
  it("matches the design's sweep filmstrip", () => {
    const frames = [0, 80, 160, 240, 320, 480].map((ms) => percent(springAt(SPRING_SWEEP, ms / 1000)))
    expect(frames).toEqual([0, 28, 62, 82, 92, 99])
  })

  it("never overshoots when critically damped", () => {
    for (let ms = 0; ms <= 2000; ms += 5) {
      expect(springAt(SPRING_SWEEP, ms / 1000)).toBeLessThanOrEqual(1)
    }
  })

  // motion/ease-enter: Figma bounce 0.32 (ζ 0.68) peaks about 5 % past the target.
  it("overshoots a little when entering", () => {
    let peak = 0
    let peakMs = 0
    for (let ms = 0; ms <= 1000; ms++) {
      const v = springAt(SPRING_ENTER, ms / 1000)
      if (v > peak) {
        peak = v
        peakMs = ms
      }
    }
    expect(peak).toBeCloseTo(1.053, 3)
    expect(peakMs).toBe(266)
  })

  it("handles exactly critical and overdamped springs", () => {
    const critical = { mass: 1, stiffness: 100, damping: 20 }
    expect(springAt(critical, 0.1)).toBeCloseTo(1 - Math.exp(-1) * 2, 10)
    const over = { mass: 1, stiffness: 100, damping: 40 }
    expect(springAt(over, 0)).toBe(0)
    expect(springAt(over, 0.05)).toBeLessThan(springAt(critical, 0.05))
    expect(springAt(over, 5)).toBeCloseTo(1, 4)
  })
})

describe("settleTime and springEase", () => {
  it("settles where the motion is done", () => {
    // FV 05: "spring settles ≈ 480 ms" at 99 %; to 0.1 % it takes about 0.7 s.
    expect(settleTime(SPRING_SWEEP, 0.01)).toBeCloseTo(0.506, 3)
    expect(settleTime(SPRING_SWEEP)).toBeCloseTo(0.702, 3)
    expect(settleTime(SPRING_ENTER)).toBeCloseTo(0.643, 3)
  })

  it("eases over the settle time and lands exactly", () => {
    const { ease, settle } = springEase(SPRING_SWEEP)
    expect(ease(0)).toBe(0)
    expect(ease(1)).toBe(1)
    expect(ease(0.08 / settle)).toBeCloseTo(springAt(SPRING_SWEEP, 0.08), 12)
    expect(Math.abs(1 - springAt(SPRING_SWEEP, settle))).toBeLessThanOrEqual(0.001)
  })
})
