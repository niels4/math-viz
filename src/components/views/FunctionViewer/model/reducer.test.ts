import { describe, expect, it } from "vitest"

import type { FvState } from "./state.ts"

import { DEFAULT_PARAMS } from "../math/form.ts"
import { fvReducer, type FvAction } from "./reducer.ts"
import {
  active,
  activeParams,
  curveAt,
  draggedParams,
  ghostVisible,
  handleHeld,
  handleLit,
  isTransformed,
  partUi,
  pLit,
  pMoved,
  pOffView,
} from "./selectors.ts"
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
    expect(run({ type: "planePointer", x: -1.4987 }).qX).toBe(-1.5)
    expect(run({ type: "planePointer", x: 2 }, { type: "planePointer", x: null }).qX).toBeNull()
  })

  it("returns the same state when nothing changes", () => {
    const state = run({ type: "planePointer", x: 1.234 })
    expect(fvReducer(state, { type: "planePointer", x: 1.229 })).toBe(state)
    expect(fvReducer(state, { type: "hover", part: "plane", on: true })).toBe(state)
    expect(fvReducer(state, { type: "hover", part: "k", on: false })).toBe(state)
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

describe("parts: hover, focus, drag, edit", () => {
  it("Q follows the pointer on the plane, which is then the hovered part", () => {
    const on = run(
      { type: "hover", part: "k", on: true },
      { type: "hover", part: "k", on: false },
      {
        type: "planePointer",
        x: -1.5,
      },
    )
    expect(on).toMatchObject({ qX: -1.5, hover: "plane", lead: "hover" })
    expect(fvReducer(on, { type: "planePointer", x: null })).toMatchObject({ qX: null, hover: null })
  })

  it("hides Q over P's marker, while P is dragged and while the plane pans (FV 07)", () => {
    const overP = run({ type: "planePointer", x: 1.99, over: "p" })
    expect(overP).toMatchObject({ qX: null, planeOver: "p", hover: "plane" })
    expect(run({ type: "planePointer", x: 1, panning: true })).toMatchObject({ qX: null, planeOver: null })
    // Back on the empty plane, Q follows again; off the plane, nothing is over.
    const back = fvReducer(overP, { type: "planePointer", x: 1 })
    expect(back).toMatchObject({ qX: 1, planeOver: null })
    expect(fvReducer(overP, { type: "planePointer", x: null })).toMatchObject({
      planeOver: null,
      hover: null,
    })
  })

  it("lights P while its card is hovered or focused, it is dragged, or the pointer is on it (FV 04)", () => {
    expect(pLit(initialFvState)).toBe(false)
    expect(pLit(run({ type: "hover", part: "p", on: true }))).toBe(true)
    expect(pLit(run({ type: "focus", part: "p", on: true }))).toBe(true)
    expect(pLit(run({ type: "drag", part: "p", mode: "coarse" }))).toBe(true)
    expect(pLit(run({ type: "planePointer", x: 2, over: "p" }))).toBe(true)
    expect(pLit(run({ type: "planePointer", x: 2 }))).toBe(false)
    expect(pLit(run({ type: "hover", part: "k", on: true }))).toBe(false)
  })

  it("a leave clears only its own part, so a late leave changes nothing", () => {
    const state = run({ type: "hover", part: "a", on: true }, { type: "hover", part: "b", on: true })
    expect(fvReducer(state, { type: "hover", part: "a", on: false })).toBe(state)
    expect(
      run(
        { type: "planePointer", x: 1 },
        { type: "hover", part: "p", on: true },
        {
          type: "planePointer",
          x: null,
        },
      ).hover,
    ).toBe("p")
  })

  it("hover and focus each hold one part; the last to move leads", () => {
    const focused = run({ type: "hover", part: "plane", on: true }, { type: "focus", part: "k", on: true })
    expect(focused).toMatchObject({ hover: "plane", focus: "k", lead: "focus" })
    const moved = fvReducer(focused, { type: "planePointer", x: 0.5 })
    expect(moved.lead).toBe("hover")
    expect(fvReducer(moved, { type: "focus", part: "k", on: false }).focus).toBeNull()
  })

  it("holds one drag with its mode, and one edit with its refusal and the value Esc puts back", () => {
    const dragging = run(
      { type: "drag", part: "h", mode: "coarse" },
      { type: "drag", part: "h", mode: "fine" },
    )
    expect(dragging.drag).toEqual({ part: "h", mode: "fine" })
    expect(fvReducer(dragging, { type: "drag", part: "k", mode: null })).toBe(dragging)
    expect(fvReducer(dragging, { type: "drag", part: "h", mode: null }).drag).toBeNull()
    const refused = run({ type: "edit", part: "b", edit: { error: "zero-scale", base: 1.04 } })
    expect(refused.edit).toEqual({ part: "b", error: "zero-scale", base: 1.04 })
    expect(fvReducer(refused, { type: "edit", part: "b", edit: { error: "zero-scale", base: 1.04 } })).toBe(
      refused,
    )
    expect(fvReducer(refused, { type: "edit", part: "b", edit: null }).edit).toBeNull()
  })

  it("gives each part its own hover, drag mode and edit", () => {
    const state = run(
      { type: "hover", part: "a", on: true },
      { type: "drag", part: "p", mode: "coarse" },
      { type: "edit", part: "k", edit: { error: null, base: 0 } },
    )
    // The open field leads (FV 04: one active value at a time): only k is lit.
    expect(partUi(state, "a")).toEqual({ hovered: true, lit: false, mode: null, edit: null })
    expect(partUi(state, "p")).toEqual({ hovered: false, lit: false, mode: "coarse", edit: null })
    expect(partUi(state, "k")).toEqual({
      hovered: false,
      lit: true,
      mode: null,
      edit: { error: null, base: 0 },
    })
  })
})

describe("the active value and its partners (FV 04 › Partner map)", () => {
  it("is the control under the pointer or holding the focus, whichever moved last", () => {
    expect(active(initialFvState)).toBeNull()
    expect(active(run({ type: "hover", part: "a", on: true }))).toBe("a")
    const both = run({ type: "hover", part: "a", on: true }, { type: "focus", part: "k", on: true })
    expect(active(both)).toBe("k")
    expect(activeParams(both)).toEqual(["k"])
    // The pointer moving onto the empty plane hands the highlight over: nothing is lit.
    expect(active(fvReducer(both, { type: "planePointer", x: 1 }))).toBeNull()
  })

  it("lights a term's parameter while the pointer is on it, and lets go when it leaves the card", () => {
    const over = run({ type: "eqPointer", over: "h" })
    expect(over.hover).toBe("eq")
    expect(active(over)).toBe("h")
    expect(active(fvReducer(over, { type: "eqPointer", over: null }))).toBeNull()
    const left = fvReducer(over, { type: "hover", part: "eq", on: false })
    expect([left.hover, left.eqOver]).toEqual([null, null])
  })

  it("lights both of a handle's values while the pointer is on it or drags it (FV 11)", () => {
    const over = run({ type: "planePointer", x: 0, over: "anchor" })
    expect(active(over)).toBe("anchor")
    expect(activeParams(over)).toEqual(["h", "k"])
    expect(over.qX).toBeNull()
    expect([handleLit(over), handleHeld(over)]).toEqual(["anchor", null])
    const held = fvReducer(over, { type: "drag", part: "stretch", mode: "coarse" })
    expect(activeParams(held)).toEqual(["a", "b"])
    expect([handleLit(held), handleHeld(held)]).toEqual(["stretch", "stretch"])
    // The rulers of a dragged handle's values show its drag.
    expect(partUi(held, "a").mode).toBe("coarse")
    expect(partUi(held, "h").mode).toBeNull()
    expect(draggedParams(held)).toEqual(["a", "b"])
  })

  it("lights nothing while a field holds refused text", () => {
    const refused = run(
      { type: "hover", part: "a", on: true },
      { type: "edit", part: "b", edit: { error: "zero-scale", base: 1 } },
    )
    expect(active(refused)).toBeNull()
  })
})

describe("handle drags (D21, D22)", () => {
  it("moves the curve with the anchor: R3 to R6", () => {
    const state = run(
      ...R3,
      { type: "drag", part: "anchor", mode: "coarse" },
      {
        type: "dragHandle",
        handle: "anchor",
        to: { x: 1.5, y: 1 },
      },
    )
    expect(state.params).toEqual({ a: 2, b: 1, h: 1.5, k: 1 })
  })

  it("stretches with the grip and flips below the anchor", () => {
    const state = run(...R3, { type: "dragHandle", handle: "stretch", to: { x: 0.5, y: -1 } })
    expect(state.params).toEqual({ a: -2, b: 1.5, h: -1, k: 1 })
  })
})

describe("P's ghost while a transform is dragged (FV 04 › Rules)", () => {
  // R5: k's ruler dragged from 0 to 1 with P at 0.5.
  const R5_START: FvAction[] = [
    { type: "setParam", param: "a", value: 2 },
    { type: "setParam", param: "h", value: -1 },
    { type: "setP", x: 0.5 },
    { type: "drag", part: "k", mode: "coarse" },
  ]

  it("takes P where the drag found it, and says how far the drag moved it (R5: moved +1)", () => {
    const start = run(...R5_START)
    expect(start.pBefore).toEqual({ x: 0.5, y: 4.5, moved: false })
    expect(pMoved(start)).toBeNull()
    const moved = fvReducer(start, { type: "setParam", param: "k", value: 1 })
    expect(pMoved(moved)).toBe(1)
    // Back where it started, it still says so: "moved 0".
    expect(pMoved(fvReducer(moved, { type: "setParam", param: "k", value: 0 }))).toBe(0)
  })

  it("keeps the ghost after the release until it is cleared, never mid-drag", () => {
    const moved = run(...R5_START, { type: "setParam", param: "k", value: 1 })
    expect(fvReducer(moved, { type: "clearPBefore" })).toBe(moved)
    const released = fvReducer(moved, { type: "drag", part: "k", mode: null })
    expect(pMoved(released)).toBe(1)
    expect(fvReducer(released, { type: "clearPBefore" }).pBefore).toBeNull()
  })

  it("starts over on the next drag, and goes with any change that isn't a drag", () => {
    const released = run(
      ...R5_START,
      { type: "setParam", param: "k", value: 1 },
      { type: "drag", part: "k", mode: null },
    )
    expect(run(...R5_START).pBefore?.y).toBe(4.5)
    expect(fvReducer(released, { type: "drag", part: "a", mode: "fine" }).pBefore).toEqual({
      x: 0.5,
      y: 5.5,
      moved: false,
    })
    expect(fvReducer(released, { type: "resetAll" }).pBefore).toBeNull()
    expect(fvReducer(released, { type: "setP", x: 1 }).pBefore).toBeNull()
    // A mode change mid-drag keeps it.
    const fine = run(...R5_START, { type: "drag", part: "k", mode: "fine" })
    expect(fine.pBefore).toEqual({ x: 0.5, y: 4.5, moved: false })
  })

  it("takes none for P's own drag or a hover", () => {
    expect(run({ type: "drag", part: "p", mode: "coarse" }).pBefore).toBeNull()
    expect(run({ type: "hover", part: "k", on: true }).pBefore).toBeNull()
  })
})

describe("P off the view (FV 01 › Ranges)", () => {
  const view = (minY: number, maxY: number) => ({ zoom: 50, extent: { minX: -9.36, maxX: 9.36, minY, maxY } })

  it("says where f(P) lies against the visible y-range", () => {
    expect(pOffView(initialFvState)).toBeNull()
    expect(pOffView(run({ type: "setView", view: view(-7.92, 7.92) }))).toBeNull()
    // x³ at P = 2 is 8, above R2's 7.92 (FV 10 › x1).
    expect(
      pOffView(run({ type: "setView", view: view(-7.92, 7.92) }, { type: "setFunction", fn: "x3" })),
    ).toBe("above")
    expect(
      pOffView(
        run({ type: "setView", view: view(-7.92, 7.92) }, { type: "setParam", param: "k", value: -12 }),
      ),
    ).toBe("below")
  })
})

describe("explainers (D12)", () => {
  const open = (param: "a" | "k" | "b" | "h", by: "hover" | "tap" | "key"): FvAction => ({
    type: "explain",
    param,
    by,
    open: true,
  })

  it("opens one at a time, and a close ends only what the same means opened", () => {
    expect(run(open("a", "hover")).explainer).toEqual({ param: "a", by: "hover" })
    expect(run(open("a", "hover"), open("k", "key")).explainer).toEqual({ param: "k", by: "key" })
    // Leaving the chip doesn't close what ? opened.
    expect(
      run(open("a", "key"), { type: "explain", param: "a", by: "hover", open: false }).explainer,
    ).toEqual({
      param: "a",
      by: "key",
    })
    expect(
      run(open("a", "hover"), { type: "explain", param: "a", by: "hover", open: false }).explainer,
    ).toBeNull()
    // A close for another parameter changes nothing.
    expect(
      run(open("a", "hover"), { type: "explain", param: "k", by: "hover", open: false }).explainer,
    ).toEqual({
      param: "a",
      by: "hover",
    })
  })

  it("toggles from a tap or ?, whatever opened it", () => {
    const toggle = (by: "tap" | "key"): FvAction => ({ type: "explain", param: "b", by, open: "toggle" })
    expect(run(toggle("tap")).explainer).toEqual({ param: "b", by: "tap" })
    expect(run(toggle("tap"), toggle("tap")).explainer).toBeNull()
    expect(run(open("b", "hover"), toggle("key")).explainer).toBeNull()
  })

  it("closes on Esc, and when the focus leaves the control whose ? opened it", () => {
    expect(run(open("h", "tap"), { type: "escape" }).explainer).toBeNull()
    const focused: FvAction = { type: "focus", part: "h", on: true }
    const blurred: FvAction = { type: "focus", part: "h", on: false }
    expect(run(focused, open("h", "key"), blurred).explainer).toBeNull()
    expect(run(focused, open("h", "hover"), blurred).explainer).toEqual({ param: "h", by: "hover" })
  })

  it("lights its value (R7: its terms light), after a field and a drag, before hover and focus", () => {
    expect(active(run(open("a", "tap")))).toBe("a")
    expect(active(run(open("a", "tap"), { type: "hover", part: "k", on: true }))).toBe("a")
    expect(active(run(open("a", "tap"), { type: "drag", part: "k", mode: "coarse" }))).toBe("k")
    expect(partUi(run(open("a", "tap")), "a").lit).toBe(true)
  })
})

describe("the tour (D19, FV 08)", () => {
  const start: FvAction = { type: "tour", to: "start" }
  const next: FvAction = { type: "tour", to: "next" }
  const step = (state: FvState) => state.tour?.step ?? null

  it("starts at step 1, goes on with Next, ends after step 3 or at once", () => {
    expect(step(run(start))).toBe(1)
    expect(step(run(start, next))).toBe(2)
    expect(step(run(start, next, next))).toBe(3)
    expect(step(run(start, next, next, next))).toBeNull()
    expect(step(run(start, next, { type: "tour", to: "end" }))).toBeNull()
    // Started again (the settings menu), it begins at step 1.
    expect(step(run(start, next, start))).toBe(1)
    // Next with no tour does nothing.
    expect(run(next).tour).toBeNull()
  })

  it("completes step 2 when a drag that changed the curve lets go: a ruler's, a term's or a handle's", () => {
    const atTwo = [start, next]
    const drag = (part: "k" | "anchor"): FvAction => ({ type: "drag", part, mode: "coarse" })
    const release = (part: "k" | "anchor"): FvAction => ({ type: "drag", part, mode: null })
    const kTo1: FvAction = { type: "setParam", param: "k", value: 1 }
    expect(step(run(...atTwo, drag("k"), kTo1))).toBe(2)
    expect(step(run(...atTwo, drag("k"), kTo1, release("k")))).toBe(3)
    expect(
      step(run(...atTwo, drag("anchor"), { type: "dragHandle", handle: "anchor", to: { x: 1, y: 1 } }, release("anchor"))),
    ).toBe(3)
    // A drag that changed nothing, or a change that wasn't a drag (typing), doesn't.
    expect(step(run(...atTwo, drag("k"), release("k")))).toBe(2)
    expect(step(run(...atTwo, kTo1))).toBe(2)
    // P's own drag isn't a transform's.
    expect(
      step(run(...atTwo, { type: "drag", part: "p", mode: "coarse" }, { type: "setP", x: 3 }, { type: "drag", part: "p", mode: null })),
    ).toBe(2)
  })

  it("completes step 3 once Q has followed the pointer across the plane", () => {
    const atThree = [start, next, next]
    expect(step(run(...atThree, { type: "planePointer", x: -1.5 }))).toBe(3)
    expect(step(run(...atThree, { type: "planePointer", x: -1.5 }, { type: "planePointer", x: -1.2 }))).toBeNull()
    // Panning hides Q: no reading.
    expect(
      step(
        run(
          ...atThree,
          { type: "planePointer", x: -1.5, panning: true },
          { type: "planePointer", x: -1.2, panning: true },
        ),
      ),
    ).toBe(3)
  })

  it("is skipped by Esc, after an open explainer has closed", () => {
    const explained: FvAction = { type: "explain", param: "a", by: "tap", open: true }
    const once = run(start, explained, { type: "escape" })
    expect([once.explainer, step(once)]).toEqual([null, 1])
    expect(step(run(start, explained, { type: "escape" }, { type: "escape" }))).toBeNull()
  })
})

describe("how the curve changed (FV 05)", () => {
  it("says jump for a typed value, a reset, Reset all and a flip", () => {
    expect(run({ type: "setParam", param: "a", value: 2, jump: true }).change).toBe("jump")
    expect(run(...R3, { type: "resetParam", param: "k" }).change).toBe("jump")
    expect(run(...R3, { type: "resetAll" }).change).toBe("jump")
    expect(run({ type: "flip", param: "a" }).change).toBe("jump")
  })

  it("says direct for a ruler's, a key's or a handle's change, switch for a new function", () => {
    expect(run({ type: "setParam", param: "a", value: 2, jump: true }, ...R3).change).toBe("direct")
    expect(run({ type: "dragHandle", handle: "anchor", to: { x: 1, y: 2 } }).change).toBe("direct")
    expect(run({ type: "setFunction", fn: "sin" }).change).toBe("switch")
  })

  it("says nothing new when the curve stays", () => {
    const typed = run({ type: "setParam", param: "a", value: 2, jump: true })
    const same = fvReducer(typed, { type: "setParam", param: "a", value: 2 })
    expect(same).toBe(typed)
    expect(fvReducer(typed, { type: "setP", x: 1 }).change).toBe("jump")
    expect(run({ type: "resetAll" }).change).toBe("direct")
  })
})
