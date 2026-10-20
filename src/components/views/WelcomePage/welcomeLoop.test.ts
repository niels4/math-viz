import { describe, expect, it } from "vitest"

import { loopAt, loopMs, welcomeStill } from "./welcomeLoop"

const frameEnd = (frame: number) => ((frame + 1) * 1000) / 24

const atRest = { func: "x2", a: 1, k: 0, b: 1, h: 0 }

describe("welcomeLoop", () => {
  it("starts on x² at rest", () => {
    expect(loopAt(0)).toEqual(atRest)
    expect(loopAt(frameEnd(28))).toEqual(atRest)
  })

  it("moves x² down to k = −1.5, fast at first and slow onto the value", () => {
    expect(loopAt(frameEnd(29))).toEqual(atRest)
    expect(loopAt(frameEnd(43))).toEqual({ ...atRest, k: -1.19 })
    expect(loopAt(frameEnd(57))).toEqual({ ...atRest, k: -1.5 })
  })

  it("switches to sin x at the click, keeping the transform", () => {
    expect(loopAt(frameEnd(105))).toEqual({ func: "x2", a: 1, k: -1.5, b: 1, h: 1 })
    expect(loopAt(frameEnd(106))).toEqual({ func: "sinx", a: 1, k: -1.5, b: 1, h: 1 })
  })

  it("grows the wave to a = 3", () => {
    expect(loopAt(frameEnd(163))).toEqual({ func: "sinx", a: 2.44, k: -1.5, b: 1, h: 1 })
    expect(loopAt(frameEnd(179))).toEqual({ func: "sinx", a: 3, k: -1.5, b: 1, h: 1 })
  })

  it("widens the wave to b = 2, passing the still half way", () => {
    expect(loopAt(frameEnd(239))).toEqual(welcomeStill)
    expect(loopAt(frameEnd(243))).toEqual({ func: "sinx", a: 3, k: 0, b: 1.74, h: 1 })
    expect(loopAt(frameEnd(257))).toEqual({ func: "sinx", a: 3, k: 0, b: 2, h: 1 })
  })

  it("brings x² back to rest by shrinking a, then b", () => {
    expect(loopAt(frameEnd(349))).toEqual({ func: "x3", a: 3, k: 0, b: 2, h: 0 })
    expect(loopAt(frameEnd(350))).toEqual({ func: "x2", a: 3, k: 0, b: 2, h: 0 })
    expect(loopAt(frameEnd(400))).toEqual({ ...atRest, a: 1.25, b: 2 })
    expect(loopAt(frameEnd(414))).toEqual({ ...atRest, b: 2 })
    expect(loopAt(frameEnd(436))).toEqual({ ...atRest, b: 1.15 })
    expect(loopAt(frameEnd(450))).toEqual(atRest)
  })

  it("starts over after 18.79 s", () => {
    expect(loopMs).toBeCloseTo(18_791.67, 2)
    expect(loopAt(frameEnd(449))).toEqual({ ...atRest, b: 1 })
    expect(loopAt(18_792)).toEqual(atRest)
    expect(loopAt(loopMs + frameEnd(43))).toEqual({ ...atRest, k: -1.19 })
  })
})
