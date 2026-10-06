import { describe, expect, it } from "vitest"

import { visibleXExtent } from "./util.ts"

describe("visibleXExtent", () => {
  it("maps the screen edges through zoom with no pan", () => {
    // 1000px wide at 50px/unit: the center pixel is the origin, so the
    // visible range is symmetric.
    expect(visibleXExtent(1000, 50, 0)).toEqual({ minX: -10, maxX: 10 })
  })

  it("shifts with pan", () => {
    expect(visibleXExtent(1000, 50, 2)).toEqual({ minX: -12, maxX: 8 })
  })

  it("is degenerate at zero width (before first layout)", () => {
    expect(visibleXExtent(0, 50, 0)).toEqual({ minX: 0, maxX: 0 })
  })
})
