import { describe, expect, it } from "vitest"

import { rulerMarks } from "./scrubRuler"

// The transform grid's columns are 204 px wide (fvTransformGrid), and every
// expected position below is read off the key-states snapshot
// (fv-rec-key-states.json, R2, R3, R5), relative to the tape's left edge.
const W = 204

const labels = (kind: "additive" | "multiplicative", value: number) =>
  rulerMarks(kind, value, W).labels.map((l) => l.text)

describe("rulerMarks, linear (shifts)", () => {
  it("labels the whole numbers it has room for", () => {
    expect(labels("additive", 0)).toEqual(["−1", "1"])
    expect(labels("additive", 1)).toEqual(["0", "2"])
    expect(labels("additive", -1)).toEqual(["−2", "0"])
    expect(labels("additive", 1.5)).toEqual(["0", "1", "2", "3"])
  })

  it("places R3's k and h labels on the snapshot's boxes", () => {
    expect(rulerMarks("additive", 1, W).labels.map((l) => l.left)).toEqual([48, 148])
    expect(rulerMarks("additive", -1, W).labels.map((l) => l.left)).toEqual([45, 148])
  })

  it("ticks every tenth at 50 px per unit: halves longer, wholes labelled", () => {
    const marks = rulerMarks("additive", 1, W)
    expect(marks.major).toEqual([2, 52, 102, 152, 202])
    expect(marks.mid).toEqual([27, 77, 127, 177])
    expect(marks.minor).toHaveLength(32)
    expect(marks.minor[0]).toBe(7)
  })

  it("notches the default where it is off the index", () => {
    expect(rulerMarks("additive", 1, W).home).toBe(52)
    expect(rulerMarks("additive", -1, W).home).toBe(152)
    expect(rulerMarks("additive", 0, W).home).toBeNull()
    expect(rulerMarks("additive", 5, W).home).toBeNull()
  })

  it("follows a fine value between ticks", () => {
    const marks = rulerMarks("additive", -1.013, W)
    expect(marks.home).toBeCloseTo(152.65, 10)
    expect(marks.labels.map((l) => l.text)).toEqual(["−2", "0"])
  })
})

describe("rulerMarks, log (scales)", () => {
  it("labels 0.9 and 1.1 around 1, 1.8 and 2.2 around 2", () => {
    expect(labels("multiplicative", 1)).toEqual(["0.9", "1.1"])
    expect(labels("multiplicative", 2)).toEqual(["1.8", "2.2"])
    expect(rulerMarks("multiplicative", 2, W).labels.map((l) => l.left)).toEqual([38, 139])
  })

  it("reads a flipped scale's size", () => {
    expect(rulerMarks("multiplicative", -2, W)).toEqual(rulerMarks("multiplicative", 2, W))
  })

  it("labels ticks on their own lattice, R3's a: labelled 1.8 to 2.4", () => {
    const marks = rulerMarks("multiplicative", 2, W)
    expect(marks.major[0]).toBeCloseTo(49.267, 2)
    expect(marks.major.at(-1)).toBeCloseTo(193.25, 2)
    expect(marks.minor[0]).toBeCloseTo(2.675, 2)
    expect(marks.mid[0]).toBeCloseTo(20.659, 2)
  })

  it("notches 1 when it is on the tape and off the index", () => {
    expect(rulerMarks("multiplicative", 1, W).home).toBeNull()
    expect(rulerMarks("multiplicative", 2, W).home).toBeNull()
    expect(rulerMarks("multiplicative", 1.04, W).home).toBeCloseTo(82.37, 2)
  })

  it("spaces labels at least 38 px apart at any size", () => {
    for (const size of [0.01, 0.07, 0.3, 0.75, 1.5, 4, 12, 90]) {
      const xs = rulerMarks("multiplicative", size, W).major
      for (let i = 1; i < xs.length; i++) {
        expect((xs[i] ?? 0) - (xs[i - 1] ?? 0)).toBeGreaterThanOrEqual(38 - 1e-9)
      }
    }
  })

  it("draws nothing for a size of 0", () => {
    expect(rulerMarks("multiplicative", 0, W)).toEqual({
      minor: [],
      mid: [],
      major: [],
      labels: [],
      home: null,
    })
  })
})
