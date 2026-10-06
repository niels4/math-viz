import { describe, expect, it } from "vitest"

import type { Hint } from "#src/components/ui/HintBar.tsx"

import type { FvState } from "./state.ts"

import { hintContext, hintFor } from "./hints.ts"
import { fvReducer, type FvAction } from "./reducer.ts"
import { initialFvState } from "./state.ts"

const run = (...actions: FvAction[]): FvState => actions.reduce(fvReducer, initialFvState)

/** The hint as a screen reader hears it: phrases joined by spaces. */
const read = (hint: Hint): string =>
  hint.phrases.map((p) => ("text" in p ? p.text : "math" in p ? p.math : p.key)).join(" ")

const hintOf = (...actions: FvAction[]) => hintFor(hintContext(run(...actions)))

describe("hint contexts (FV 01 › Hint contexts, Components › hint-bar-fv)", () => {
  it("is idle with nothing hovered, focused, dragged or typed (R1, R3)", () => {
    expect(read(hintOf())).toBe(
      "Drag a ruler sideways to reshape the curve · point at the plane to read f(x)",
    )
  })

  it("speaks about the plane while the pointer is on it (R2)", () => {
    expect(read(hintOf({ type: "planePointer", x: -1.5 }))).toBe(
      "Q follows your pointer · drag to pan · scroll to zoom",
    )
  })

  it("speaks about P while the pointer is on P's marker or drags it", () => {
    const point = "Drag P along the curve · ← → nudge 0.1"
    expect(read(hintOf({ type: "planePointer", x: 2, over: "p" }))).toBe(point)
    expect(
      read(hintOf({ type: "planePointer", x: 2, over: "p" }, { type: "drag", part: "p", mode: "coarse" })),
    ).toBe(point)
  })

  it("names a shift and its reset value while its control is hovered or dragged (R5)", () => {
    const k = "Drag to change k · Shift fine · Ctrl whole steps · double-click: back to 0"
    expect(read(hintOf({ type: "hover", part: "k", on: true }))).toBe(k)
    expect(read(hintOf({ type: "drag", part: "k", mode: "coarse" }))).toBe(k)
  })

  it("gives a scale its own reset value and quarter steps (plan § 1.8 calls 1 and 2)", () => {
    expect(read(hintOf({ type: "focus", part: "a", on: true }))).toBe(
      "Drag to change a · Shift fine · Ctrl quarter steps · double-click: back to 1",
    )
  })

  it("names a held modifier mid-drag", () => {
    expect(read(hintOf({ type: "drag", part: "h", mode: "fine" }))).toBe(
      "Shift Fine: a tenth of the speed, steps of 0.001",
    )
    expect(read(hintOf({ type: "drag", part: "b", mode: "snap" }))).toBe(
      "Ctrl Snapping to whole numbers (scales: quarters)",
    )
  })

  it("lists the typing keys while a value is typed, and the refusal with the value Esc puts back", () => {
    expect(read(hintOf({ type: "edit", part: "k", edit: { error: null, base: 0 } }))).toBe(
      "Enter apply · Esc cancel · ↑ ↓ nudge 0.01",
    )
    const invalid = hintOf({ type: "edit", part: "b", edit: { error: "invalid", base: 1.04 } })
    expect(read(invalid)).toBe("Type a number such as 1.5 · Esc puts back 1.04")
    expect(invalid.tone).toBe("error")
    expect(read(hintOf({ type: "edit", part: "b", edit: { error: "zero-scale", base: 1.04 } }))).toBe(
      "A scale of 0 squashes the curve flat. Try 0.1 · Esc puts back 1.04",
    )
  })

  it("speaks about P while its card is hovered or focused, or P is dragged", () => {
    const point = "Drag P along the curve · ← → nudge 0.1"
    expect(read(hintOf({ type: "hover", part: "p", on: true }))).toBe(point)
    expect(read(hintOf({ type: "focus", part: "p", on: true }))).toBe(point)
    expect(read(hintOf({ type: "drag", part: "p", mode: "coarse" }))).toBe(point)
  })

  it("puts an open field first, then a drag, then the pointer or the focus", () => {
    const busy: FvAction[] = [
      { type: "planePointer", x: 1 },
      { type: "drag", part: "h", mode: "snap" },
      { type: "edit", part: "h", edit: { error: null, base: 0 } },
    ]
    expect(hintContext(run(...busy)).kind).toBe("edit")
    expect(hintContext(run(...busy.slice(0, 2))).kind).toBe("snap")
  })

  it("follows whichever of the pointer and the focus moved last, else the other", () => {
    const tabbed = run({ type: "planePointer", x: 1 }, { type: "focus", part: "k", on: true })
    expect(hintContext(tabbed)).toEqual({ kind: "transform", param: "k" })
    const moved = fvReducer(tabbed, { type: "planePointer", x: 1.5 })
    expect(hintContext(moved)).toEqual({ kind: "plane" })
    expect(hintContext(fvReducer(moved, { type: "planePointer", x: null }))).toEqual({
      kind: "transform",
      param: "k",
    })
  })

  it("speaks about a term as its control does: it drags the same way (D13)", () => {
    expect(read(hintOf({ type: "eqPointer", over: "k" }))).toBe(
      "Drag to change k · Shift fine · Ctrl whole steps · double-click: back to 0",
    )
    expect(read(hintOf({ type: "eqPointer", over: null }))).toBe(read(hintOf()))
  })

  it("names the handles under the pointer, and what a dragged one sets (FV 11, R6)", () => {
    expect(read(hintOf({ type: "planePointer", x: 0, over: "stretch" }))).toBe(
      "Drag the diamond to move the curve · the square to stretch it",
    )
    expect(read(hintOf({ type: "drag", part: "anchor", mode: "coarse" }))).toBe(
      "Moving the anchor sets h and k · Shift locks one axis",
    )
    expect(read(hintOf({ type: "drag", part: "stretch", mode: "coarse" }))).toBe(
      "Stretching sets a (height) and b (width) · Shift locks one of them",
    )
  })
})
