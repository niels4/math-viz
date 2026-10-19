import { describe, expect, it } from "vitest"

import { rulerMarks } from "./rulerMarks.ts"
import { scrubbed } from "./scrub.ts"

const TAPE_WIDTH = 328

const rounded = (xs: number[]) => xs.map((x) => Number(x.toFixed(2)))
const texts = (labels: { text: string }[]) => labels.map((label) => label.text)

describe("the ruler under a dragged shift", () => {
  it("puts whole numbers 50 px apart, labelled, with the value at the centre", () => {
    const marks = rulerMarks(0, TAPE_WIDTH, false)
    expect(rounded(marks.major)).toEqual([14, 64, 114, 164, 214, 264, 314])
    expect(texts(marks.labels)).toEqual(["−3", "−2", "−1", "0", "1", "2", "3"])

    expect(rounded(marks.mid)).toEqual([39, 89, 139, 189, 239, 289])
    expect(rounded(marks.minor).slice(0, 4)).toEqual([4, 9, 19, 24])
  })

  it("slides its marks as far as the pointer moves, the other way", () => {
    const before = rulerMarks(0.6, TAPE_WIDTH, false)
    expect(rounded(before.major)).toEqual([34, 84, 134, 184, 234, 284])

    const after = rulerMarks(scrubbed(0.6, 10, false, "coarse"), TAPE_WIDTH, false)
    expect(rounded(after.major)).toEqual([24, 74, 124, 174, 224, 274, 324])
    expect(texts(after.labels)).toEqual(["−2", "−1", "0", "1", "2", "3", "4"])
  })

  it("draws nothing for a shift too large to count in tenths", () => {
    expect(rulerMarks(1e20, TAPE_WIDTH, false)).toEqual({ minor: [], mid: [], major: [], labels: [] })
  })
})

describe("the ruler under a dragged scale", () => {
  it("lays values out by ratio, so 1.5 sits as far left of 2 as 0.75 of 1", () => {
    const one = rulerMarks(1, TAPE_WIDTH, true)
    expect(texts(one.labels)).toEqual(["0.8", "1", "1.2"])
    expect(one.minor.length + one.mid.length + one.major.length).toBe(66)

    const two = rulerMarks(2, TAPE_WIDTH, true)
    expect(texts(two.labels)).toEqual(["1.5", "2", "2.5"])

    expect(rounded(two.labels.map((label) => label.x))).toEqual([20.02, 164, 275.68])
    expect(rounded(one.mid)).toContain(20.02)
  })

  it("reads a negative scale's size", () => {
    expect(rulerMarks(-2, TAPE_WIDTH, true)).toEqual(rulerMarks(2, TAPE_WIDTH, true))
  })
})
