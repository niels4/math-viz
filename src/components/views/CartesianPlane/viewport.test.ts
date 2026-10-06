import { describe, expect, it } from "vitest"

import {
  defaultZoom,
  makeViewport,
  panIntoView,
  scaleBarUnits,
  scaleLabel,
  stepZoom,
  toMathX,
  toMathY,
  toScreenX,
  toScreenY,
  visibleExtent,
  ZOOM_STOPS,
  zoomLabel,
  zoomPercent,
} from "./viewport.ts"

const view = (zoom: number, panX = 0, panY = 0) => ({ zoom, panX, panY })

describe("makeViewport", () => {
  it("puts the origin at the floored centre with no pan", () => {
    const vp = makeViewport({ width: 936, height: 792, dpr: 1 }, view(50))
    expect([vp.originX, vp.originY]).toEqual([468, 396])
    expect([toScreenX(vp, 1), toScreenY(vp, 1)]).toEqual([518, 346])
    expect([toMathX(vp, 518), toMathY(vp, 346)]).toEqual([1, 1])
  })

  it("maps the visible range through zoom and pan", () => {
    expect(visibleExtent(makeViewport({ width: 1000, height: 800, dpr: 1 }, view(50)))).toEqual({
      minX: -10,
      maxX: 10,
      minY: -8,
      maxY: 8,
    })
    // Pan is the math offset of the view centre: +2 in x shows −12 … 8.
    const panned = visibleExtent(makeViewport({ width: 1000, height: 800, dpr: 1 }, view(50, 2, 1)))
    expect([panned.minX, panned.maxX, panned.minY, panned.maxY]).toEqual([-12, 8, -9, 7])
  })

  it("is degenerate at zero size (before the first layout)", () => {
    expect(visibleExtent(makeViewport({ width: 0, height: 0, dpr: 1 }, view(50)))).toEqual({
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
    })
  })

  it("lands the origin on whole device pixels", () => {
    expect(makeViewport({ width: 936, height: 792, dpr: 1 }, view(50, 0.013, 0)).originX).toBe(469)
    expect(makeViewport({ width: 936, height: 792, dpr: 2 }, view(50, 0.013, 0)).originX).toBe(468.5)
  })
})

describe("zoom stops", () => {
  it("run from 0.5 % to 200 % on the R10 numbers", () => {
    expect(ZOOM_STOPS[0]).toBe(0.25)
    expect(ZOOM_STOPS.at(-1)).toBe(100)
    expect(ZOOM_STOPS.map(zoomPercent).filter((p) => p >= 50)).toEqual([50, 63, 80, 100, 125, 160, 200])
  })

  it("step to the next stop, or stay at the limits", () => {
    expect(stepZoom(50, 1)).toBe(62.5)
    expect(stepZoom(50, -1)).toBe(40)
    expect(stepZoom(45, 1)).toBe(50)
    expect(stepZoom(45, -1)).toBe(40)
    expect(stepZoom(100, 1)).toBe(100)
    expect(stepZoom(0.25, -1)).toBe(0.25)
  })
})

describe("defaultZoom (D17)", () => {
  it("keeps y ∈ [−5, 5] in view at the largest stop, at most 100 %", () => {
    expect(defaultZoom(792, 5)).toBe(50)
    // R9's dock plane: 408 px tall → 40 px per unit, 80 %.
    expect(defaultZoom(408, 5)).toBe(40)
    expect(zoomPercent(defaultZoom(408, 5))).toBe(80)
    expect(defaultZoom(300, 5)).toBe(25)
  })

  it("falls back to 100 % before the first layout", () => {
    expect(defaultZoom(0, 5)).toBe(50)
  })
})

describe("labels", () => {
  it("measure 50 px of scale bar: 1 u at 100 %, 1.25 u at 80 % (R9)", () => {
    expect(scaleBarUnits(50)).toBe(1)
    expect(scaleBarUnits(40)).toBe(1.25)
    expect(scaleLabel(50)).toBe("1 u")
    expect(scaleLabel(40)).toBe("1.25 u")
    expect(scaleLabel(100)).toBe("0.5 u")
    expect(scaleLabel(37)).toBe("1.35 u")
  })

  it("print the zoom in whole percent, one decimal below 10 %", () => {
    expect(zoomLabel(50)).toBe("100%")
    expect(zoomLabel(40)).toBe("80%")
    expect(zoomLabel(31.5)).toBe("63%")
    expect(zoomLabel(3.15)).toBe("6.3%")
    expect(zoomLabel(0.25)).toBe("0.5%")
  })
})

describe("panIntoView", () => {
  const vp = makeViewport({ width: 936, height: 792, dpr: 1 }, { zoom: 50, panX: 0, panY: 0 })

  it("brings a point above the view a quarter of the plane below the top edge", () => {
    // FV 10 X1: x³'s P (2, 8) lies 4 px above the view.
    const next = panIntoView(vp, { panX: 0, panY: 0 }, { x: 2, y: 8 })
    expect(next.panX).toBe(0)
    const moved = makeViewport({ width: 936, height: 792, dpr: 1 }, { zoom: 50, ...next })
    expect(moved.originY - 8 * 50).toBeCloseTo(792 / 4, 9)
  })

  it("brings a point past the right or left edge a quarter in, keeping the other axis", () => {
    const right = panIntoView(vp, { panX: 0, panY: 1 }, { x: 12, y: 0 })
    expect(right.panY).toBe(1)
    const moved = makeViewport({ width: 936, height: 792, dpr: 1 }, { zoom: 50, ...right })
    expect(moved.originX + 12 * 50).toBeCloseTo((936 * 3) / 4, 9)
    const left = panIntoView(vp, { panX: 0, panY: 0 }, { x: -20, y: -9 })
    const both = makeViewport({ width: 936, height: 792, dpr: 1 }, { zoom: 50, ...left })
    expect(both.originX - 20 * 50).toBeCloseTo(936 / 4, 9)
    expect(both.originY + 9 * 50).toBeCloseTo((792 * 3) / 4, 9)
  })

  it("leaves a point in view where it is", () => {
    expect(panIntoView(vp, { panX: 0.5, panY: -1 }, { x: 2, y: 4 })).toEqual({ panX: 0.5, panY: -1 })
  })
})
