import { describe, expect, it } from "vitest"

import type { FvState } from "./state.ts"

import { DEFAULT_PARAMS } from "../math/form.ts"
import { fvReducer, type FvAction } from "./reducer.ts"
import { curveAt, ghostVisible, isTransformed } from "./selectors.ts"
import { DEFAULT_GHOST_ON, DEFAULT_P_X, initialFvState } from "./state.ts"

const run = (...actions: FvAction[]): FvState => actions.reduce(fvReducer, initialFvState)

const R3: FvAction[] = [
  { type: "setParam", param: "a", value: 2 },
  { type: "setParam", param: "h", value: -1 },
  { type: "setParam", param: "k", value: 1 },
]

describe("defaults", () => {
  it("starts at x² with no transform, P at x = 2 (D4), the ghost on (D7)", () => {
    expect(initialFvState.fn).toBe("x2")
    expect(initialFvState.params).toEqual(DEFAULT_PARAMS)
    expect(initialFvState.pX).toBe(2)
    expect(DEFAULT_P_X).toBe(2)
    expect(initialFvState.ghostOn).toBe(DEFAULT_GHOST_ON)
    expect(initialFvState.qX).toBeNull()
  })
})

describe("fvReducer", () => {
  it("reaches R3: f(0.5) = 5.5 with the vertex at (−1, 1)", () => {
    const state = run(...R3, { type: "setP", x: 0.5 })
    expect(curveAt(state, state.pX)).toBe(5.5)
    expect(curveAt(state, -1)).toBe(1)
    expect(curveAt(state, -1.5)).toBeGreaterThan(1)
    expect(curveAt(state, -0.5)).toBeGreaterThan(1)
  })

  it("stores at most 3 decimals: no hidden digits", () => {
    expect(run({ type: "setParam", param: "b", value: 1.03511 }).params.b).toBe(1.035)
    expect(run({ type: "setParam", param: "h", value: 0.0004 }).params.h).toBe(0)
    expect(Object.is(run({ type: "setParam", param: "k", value: -0.0001 }).params.k, 0)).toBe(true)
  })

  it("never stores a scale of 0; a shift of 0 is fine", () => {
    expect(run({ type: "setParam", param: "b", value: 0 })).toBe(initialFvState)
    expect(run({ type: "setParam", param: "a", value: 0.0004 })).toBe(initialFvState)
    expect(
      run({ type: "setParam", param: "k", value: 1 }, { type: "setParam", param: "k", value: 0 }).params.k,
    ).toBe(0)
  })

  it("ignores values that are not numbers", () => {
    expect(run({ type: "setParam", param: "a", value: Number.NaN })).toBe(initialFvState)
    expect(run({ type: "setParam", param: "h", value: Number.NaN })).toBe(initialFvState)
    expect(run({ type: "setP", x: Number.POSITIVE_INFINITY })).toBe(initialFvState)
  })

  it("flips a scale and resets one or all", () => {
    const flipped = run(...R3, { type: "flip", param: "a" })
    expect(flipped.params.a).toBe(-2)
    expect(fvReducer(flipped, { type: "resetParam", param: "a" }).params).toEqual({ a: 1, b: 1, h: -1, k: 1 })
    expect(fvReducer(flipped, { type: "resetAll" }).params).toEqual(DEFAULT_PARAMS)
  })

  it("keeps P's x through every transform and function switch (D15)", () => {
    const transforms: FvAction[] = [
      ...R3,
      { type: "setParam", param: "b", value: 0.5 },
      { type: "flip", param: "a" },
      { type: "flip", param: "b" },
      { type: "resetParam", param: "h" },
      { type: "setFunction", fn: "sin" },
      { type: "resetAll" },
    ]
    let state = run({ type: "setP", x: 0.5 })
    for (const action of transforms) {
      state = fvReducer(state, action)
      expect(state.pX).toBe(0.5)
    }
  })

  it("puts P and Q on the 0.01 lattice", () => {
    expect(run({ type: "setP", x: 0.503 }).pX).toBe(0.5)
    expect(run({ type: "setQ", x: -1.4987 }).qX).toBe(-1.5)
    expect(run({ type: "setQ", x: 2 }, { type: "setQ", x: null }).qX).toBeNull()
  })

  it("returns the same state when nothing changes", () => {
    const state = run({ type: "setQ", x: 1.234 })
    expect(fvReducer(state, { type: "setQ", x: 1.229 })).toBe(state)
    expect(fvReducer(state, { type: "setParam", param: "a", value: 1 })).toBe(state)
    expect(fvReducer(state, { type: "setFunction", fn: "x2" })).toBe(state)
    const view = { zoom: 50, extent: { minX: -9.36, maxX: 9.36, minY: -7.92, maxY: 7.92 } }
    const withView = fvReducer(state, { type: "setView", view })
    expect(fvReducer(withView, { type: "setView", view: { ...view, extent: { ...view.extent } } })).toBe(
      withView,
    )
    expect(fvReducer(withView, { type: "setView", view: { ...view, zoom: 40 } }).view?.zoom).toBe(40)
  })
})

describe("selectors", () => {
  it("shows the ghost only while a transform is set and the toggle is on (D7)", () => {
    expect(isTransformed(initialFvState)).toBe(false)
    expect(ghostVisible(initialFvState)).toBe(false)
    const moved = run({ type: "setParam", param: "k", value: 1 })
    expect(ghostVisible(moved)).toBe(true)
    expect(ghostVisible(fvReducer(moved, { type: "setGhost", on: false }))).toBe(false)
  })
})
