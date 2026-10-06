import { describe, expect, it } from "vitest"

import { placeExplainer } from "./explainer.ts"
import { EXPLAINER_PLOTS } from "./explainerPlots.ts"

// R7 (key-states snapshot): the panel at (16, 92) 460 × 792, a's chip at
// (35, 390.5), the explainer's card at (489, 383.5), 389 tall.
const PANEL = { x: 16, y: 92, w: 460, h: 792 }
const VIEW = { width: 1440, height: 900 }

describe("placeExplainer", () => {
  it("opens right of the panel with its caret's tip on the chip's centre (R7)", () => {
    expect(placeExplainer({ x: 35, y: 390.5, w: 26, h: 26 }, PANEL, 389, VIEW)).toEqual({
      x: 489,
      y: 383.5,
      caret: { side: "left", at: 20 },
    })
  })

  it("stays 16 px inside the window, its caret still on the chip", () => {
    // h's chip low in a short window: the card rises, the caret follows the chip.
    const place = placeExplainer({ x: 255, y: 600, w: 26, h: 26 }, PANEL, 389, { width: 1440, height: 720 })
    expect(place.y).toBe(720 - 16 - 389)
    expect(place.caret).toEqual({ side: "left", at: 613 - place.y })
  })

  it("hangs under the chip, caret up, where nothing fits right of the panel (the stacked layout)", () => {
    const place = placeExplainer({ x: 35, y: 400, w: 26, h: 26 }, { x: 16, y: 92, w: 768, h: 900 }, 389, {
      width: 800,
      height: 900,
    })
    expect(place).toEqual({ x: 28, y: 439, caret: { side: "top", at: 20 } })
    // Lower, it would run out of the window: it stands above the chip instead,
    // reaching left as far as the window's margin lets it.
    const low = placeExplainer({ x: 35, y: 500, w: 26, h: 26 }, { x: 16, y: 92, w: 768, h: 900 }, 389, {
      width: 800,
      height: 900,
    })
    expect(low).toEqual({ x: 16, y: 98, caret: { side: "bottom", at: 32 } })
  })

  it("stands above the chip, caret down, reaching away from the middle, in the dock (R9 at 1280 × 720)", () => {
    // The dock spans the window under the plane; a's chip at (387, 544), k's at (387, 618), b's at (620, 544).
    const dock = { x: 12, y: 504, w: 1256, h: 204 }
    const view = { width: 1280, height: 720 }
    expect(placeExplainer({ x: 387, y: 544, w: 26, h: 26 }, dock, 389, view)).toEqual({
      x: 120,
      y: 544 - 4 - 9 - 389,
      caret: { side: "bottom", at: 280 },
    })
    expect(placeExplainer({ x: 387, y: 618, w: 26, h: 26 }, dock, 367, view)).toEqual({
      x: 120,
      y: 618 - 4 - 9 - 367,
      caret: { side: "bottom", at: 280 },
    })
    // Right of the middle it reaches right.
    expect(placeExplainer({ x: 900, y: 544, w: 26, h: 26 }, dock, 389, view)).toMatchObject({
      x: 893,
      caret: { side: "bottom", at: 20 },
    })
  })

  it("takes the roomier side where neither fits", () => {
    const place = placeExplainer({ x: 35, y: 300, w: 26, h: 26 }, { x: 16, y: 92, w: 768, h: 600 }, 389, {
      width: 800,
      height: 640,
    })
    expect(place.caret.side).toBe("top")
  })
})

describe("EXPLAINER_PLOTS (D10: x², the value at 2)", () => {
  it("carries the unit point for a scale and the anchor for a shift, as FV 02's pictures do", () => {
    const carried = (p: "a" | "k" | "b" | "h") => {
      const arrow = EXPLAINER_PLOTS[p].arrows?.[0]
      return arrow === undefined ? null : [arrow.from, arrow.to]
    }
    expect(carried("a")).toEqual([
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ])
    expect(carried("b")).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ])
    expect(carried("k")).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 2 },
    ])
    expect(carried("h")).toEqual([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
    ])
  })

  it("draws the original dashed and the example solid", () => {
    const [before, after] = EXPLAINER_PLOTS.h.curves
    expect(before).toMatchObject({ ink: "foregroundMuted", width: 1.75, dash: [5, 4], alpha: 0.8 })
    expect(before?.fn(3)).toBe(9)
    expect(after).toMatchObject({ ink: "chartLine", width: 2.5 })
    // h = 2 moves the vertex to x = 2.
    expect(after?.fn(2)).toBe(0)
    expect(EXPLAINER_PLOTS.a.curves[1]?.fn(1)).toBe(2)
    expect(EXPLAINER_PLOTS.b.curves[1]?.fn(2)).toBe(1)
    expect(EXPLAINER_PLOTS.k.curves[1]?.fn(0)).toBe(2)
  })
})
