import { describe, expect, it } from "vitest"

import { extentMarks, LABEL_MIN_PX, niceStep } from "./extentTicks.ts"

const round2 = (v: number) => Math.round(v * 100) / 100

describe("niceStep", () => {
  it("is the smallest 1-2-5 step that is at least `min`, never below the floor", () => {
    expect(niceStep(0.19, 0.5)).toBe(0.5)
    expect(niceStep(0.6, 0.5)).toBe(1)
    expect(niceStep(1.51, 2)).toBe(2)
    expect(niceStep(3.98, 1)).toBe(5)
    expect(niceStep(15.1, 2)).toBe(20)
    expect(niceStep(120, 2)).toBe(200)
  })
})

describe("extentMarks: the P scrubber's calibration (fvScrubber)", () => {
  // R2: the plane's visible x-range at 100 % on its 936 px canvas, over the 396 px track.
  const r2 = extentMarks(-9.36, 9.36, 396)

  it("puts R2's labels every 2 units, at the snapshot's boxes", () => {
    expect(r2?.labels.map((l) => l.text)).toEqual(["−8", "−6", "−4", "−2", "0", "2", "4", "6", "8"])
    // Board x minus the track's 50.
    expect(r2?.labels.map((l) => l.left)).toEqual([21, 64, 106, 148, 194, 236, 279, 321, 363])
  })

  it("puts R2's ticks on the grid: majors on whole units, minors on halves", () => {
    expect(r2?.major).toHaveLength(19)
    expect(r2?.minor).toHaveLength(18)
    // The snapshot's tick vectors: Ticks · 1 from 7.62 to 388.39, Ticks · 0.5 from 18.19 to 377.81.
    expect([r2?.major[0], r2?.major.at(-1)].map((v) => round2(v ?? 0))).toEqual([7.62, 388.38])
    expect([r2?.minor[0], r2?.minor.at(-1)].map((v) => round2(v ?? 0))).toEqual([18.19, 377.81])
  })

  it("thins its steps as the range widens, labels at least 32 px apart, never past the ends", () => {
    for (const half of [2.3, 9.36, 18.72, 93.6, 936, 18720]) {
      const marks = extentMarks(-half, half, 396)
      const lefts = marks?.labels.map((l) => l.left) ?? []
      expect(lefts.length).toBeGreaterThan(1)
      lefts
        .slice(1)
        .forEach((left, i) => expect(left - (lefts[i] ?? 0)).toBeGreaterThanOrEqual(LABEL_MIN_PX - 1))
      for (const l of marks?.labels ?? []) {
        expect(l.left).toBeGreaterThanOrEqual(0)
        expect(l.left + Math.ceil(l.text.length * 7.2)).toBeLessThanOrEqual(396)
      }
    }
    // Ten times wider than R2: labels every 20.
    expect(extentMarks(-93.6, 93.6, 396)?.labels.map((l) => l.text)).toEqual([
      "−80",
      "−60",
      "−40",
      "−20",
      "0",
      "20",
      "40",
      "60",
      "80",
    ])
  })

  it("labels only whole numbers, even zoomed far in", () => {
    const labels = extentMarks(-1.17, 1.17, 396)?.labels.map((l) => l.value) ?? []
    expect(labels.every((v) => Number.isInteger(v))).toBe(true)
  })

  it("draws nothing over an empty range or track", () => {
    expect(extentMarks(0, 0, 396)).toBeNull()
    expect(extentMarks(-1, 1, 0)).toBeNull()
    expect(extentMarks(1, -1, 396)).toBeNull()
  })
})
