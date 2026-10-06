import { describe, expect, it } from "vitest"

import { HOLE_PAD, tourLayout, type TourTargets } from "./tourSteps.ts"

// The boards at 1440 × 900 (key-states snapshot): R1's equation card at
// (35, 187) 422 × 133.5, k's control at (35, 465.5) 204 × 66, the plane at
// (488, 92) 936 × 792, Q's card at (35, 713.5) 424 × 86.
const VIEW = { width: 1440, height: 900 }
const TARGETS: TourTargets = {
  equation: { x: 35, y: 187, w: 422, h: 133.5 },
  control: { x: 35, y: 465.5, w: 204, h: 66 },
  plane: { x: 488, y: 92, w: 936, h: 792 },
  qCard: { x: 35, y: 713.5, w: 424, h: 86 },
  curve: { x: 814.25, y: 94.25, w: 371.75, h: 427 },
}

describe("tourLayout", () => {
  it("spotlights R1's equation card and curve, its card right of the equation", () => {
    const layout = tourLayout(1, TARGETS, 200, VIEW)
    // The snapshot's first hole: (27, 179) 438 × 149.5.
    expect(layout.holes[0]).toEqual({ x: 27, y: 179, w: 438, h: 149.5 })
    expect(layout.holes[1]).toEqual({ x: 814.25 - HOLE_PAD, y: 86.25, w: 387.75, h: 443 })
    // The card at (491, 187), its caret's tip at the card's middle, 10 px out (the wrapper at 481).
    expect(layout.card).toEqual({ x: 491, y: 187, caret: { side: "left", at: 100 } })
    expect(layout.hand).toBeNull()
  })

  it("spotlights k's control with room for the drag path; the card right of it, 20 px up; the hand on the ruler", () => {
    const layout = tourLayout(2, TARGETS, 196, VIEW)
    expect(layout.holes).toEqual([{ x: 27, y: 457.5, w: 220, h: 94 }])
    expect(layout.card).toEqual({ x: 277, y: 445.5, caret: { side: "left", at: 98 } })
    expect(layout.hand).toEqual({ x: 81, y: 497.5 })
  })

  it("spotlights the plane and Q's card; the card low on the plane, caret up", () => {
    const layout = tourLayout(3, TARGETS, 196, VIEW)
    expect(layout.holes).toEqual([
      { x: 480, y: 84, w: 952, h: 808 },
      { x: 27, y: 705.5, w: 440, h: 102 },
    ])
    expect(layout.card).toEqual({ x: 548, y: 572, caret: { side: "top", at: 9 } })
  })

  it("keeps the card in the window: a short one lifts it, its caret still aimed", () => {
    const layout = tourLayout(2, { ...TARGETS, control: { x: 35, y: 600, w: 204, h: 66 } }, 196, {
      width: 1440,
      height: 720,
    })
    expect(layout.card?.y).toBe(720 - 16 - 196)
    // Aimed at the card's middle where it would have stood: 580 + 98.
    expect(layout.card?.caret).toEqual({ side: "left", at: 678 - (720 - 16 - 196) })
  })

  it("hangs the card under its target, caret up, where the window has no room on its right", () => {
    const narrow = { ...TARGETS, equation: { x: 17, y: 187, w: 766, h: 133.5 } }
    expect(tourLayout(1, narrow, 200, { width: 800, height: 900 }).card).toEqual({
      x: 17,
      y: 187 + 133.5 + 24 + 10,
      caret: { side: "top", at: 9 },
    })
  })

  it("leaves out what isn't on the page", () => {
    const layout = tourLayout(1, { ...TARGETS, curve: null }, 200, VIEW)
    expect(layout.holes).toHaveLength(1)
    expect(tourLayout(2, { ...TARGETS, control: null }, 196, VIEW)).toEqual({
      holes: [],
      card: null,
      hand: null,
    })
  })
})
