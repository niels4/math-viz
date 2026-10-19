import { describe, expect, it } from "vitest"

import { rulerMarks } from "./rulerMarks.ts"
import { scrubbed } from "./scrub.ts"

// The tape inside a sidebar row's ruler, 164 px each side of its centre.
const TAPE_WIDTH = 328

const rounded = (xs: number[]) => xs.map((x) => Number(x.toFixed(2)))
const texts = (labels: { text: string }[]) => labels.map((label) => label.text)

describe("the ruler under a dragged shift", () => {
  it("puts whole numbers 50 px apart, labelled, with the value at the centre", () => {
    // k at 0 sits at the centre, 164 px in, and 1 sits 50 px to its right.
    const marks = rulerMarks(0, TAPE_WIDTH, false)
    expect(rounded(marks.major)).toEqual([14, 64, 114, 164, 214, 264, 314])
    expect(texts(marks.labels)).toEqual(["−3", "−2", "−1", "0", "1", "2", "3"])

    // Halves get longer ticks than the other tenths.
    expect(rounded(marks.mid)).toEqual([39, 89, 139, 189, 239, 289])
    expect(rounded(marks.minor).slice(0, 4)).toEqual([4, 9, 19, 24])
  })

  it("slides its marks as far as the pointer moves, the other way", () => {
    // k at 0.6 puts 0 30 px left of the centre.
    const before = rulerMarks(0.6, TAPE_WIDTH, false)
    expect(rounded(before.major)).toEqual([34, 84, 134, 184, 234, 284])

    // A drag 10 px right reaches 0.8 and slides every whole number 10 px
    // left, bringing 4 onto the tape.
    const after = rulerMarks(scrubbed(0.6, 10, false, "coarse"), TAPE_WIDTH, false)
    expect(rounded(after.major)).toEqual([24, 74, 124, 174, 224, 274, 324])
    expect(texts(after.labels)).toEqual(["−2", "−1", "0", "1", "2", "3", "4"])
  })

  it("draws nothing for a shift too large to count in tenths", () => {
    // A link with k=1e20 would otherwise count tenths forever.
    expect(rulerMarks(1e20, TAPE_WIDTH, false)).toEqual({ minor: [], mid: [], major: [], labels: [] })
  })
})

describe("the ruler under a dragged scale", () => {
  it("lays values out by ratio, so 1.5 sits as far left of 2 as 0.75 of 1", () => {
    // a at 1 shows 0.72 to 1.39: ticks every 0.01 from 0.73 to 1.38, longer
    // ones every 0.05, and labels every 0.2.
    const one = rulerMarks(1, TAPE_WIDTH, true)
    expect(texts(one.labels)).toEqual(["0.8", "1", "1.2"])
    expect(one.minor.length + one.mid.length + one.major.length).toBe(66)

    // a at 2 shows 1.44 to 2.78, labelled every 0.5.
    const two = rulerMarks(2, TAPE_WIDTH, true)
    expect(texts(two.labels)).toEqual(["1.5", "2", "2.5"])

    // 1.5 is 3/4 of 2, as 0.75 is of 1, so both lie 144 px left of the
    // centre.
    expect(rounded(two.labels.map((label) => label.x))).toEqual([20.02, 164, 275.68])
    expect(rounded(one.mid)).toContain(20.02)
  })

  it("reads a negative scale's size", () => {
    // a at −2 draws as a at 2.
    expect(rulerMarks(-2, TAPE_WIDTH, true)).toEqual(rulerMarks(2, TAPE_WIDTH, true))
  })
})
