import { afterEach, describe, expect, it } from "vitest"

import { selectionMayStart } from "#test"

import { selectNothingUntilRelease } from "./selectNothing.ts"

const pointer = (type: string, pointerId: number, buttons = 0) => {
  window.dispatchEvent(new PointerEvent(type, { pointerId, buttons }))
}

describe("selectNothingUntilRelease", () => {
  afterEach(() => {
    pointer("pointerup", 1)
    pointer("pointerup", 2)
  })

  it("cancels selectstart from the press until that pointer lets go", () => {
    expect(selectionMayStart()).toBe(true)
    selectNothingUntilRelease({ pointerId: 1 })
    expect(selectionMayStart()).toBe(false)
    pointer("pointermove", 1, 1)
    expect(selectionMayStart()).toBe(false)
    pointer("pointerup", 2)
    expect(selectionMayStart()).toBe(false)
    pointer("pointerup", 1)
    expect(selectionMayStart()).toBe(true)
  })

  it("ends on pointercancel, a lost window focus, or a move with no button held", () => {
    selectNothingUntilRelease({ pointerId: 1 })
    pointer("pointercancel", 1)
    expect(selectionMayStart()).toBe(true)

    selectNothingUntilRelease({ pointerId: 1 })
    window.dispatchEvent(new Event("blur"))
    expect(selectionMayStart()).toBe(true)

    selectNothingUntilRelease({ pointerId: 1 })
    pointer("pointermove", 1, 0)
    expect(selectionMayStart()).toBe(true)
  })

  it("holds for each pointer until its own release (a pinch)", () => {
    selectNothingUntilRelease({ pointerId: 1 })
    selectNothingUntilRelease({ pointerId: 2 })
    pointer("pointerup", 1)
    expect(selectionMayStart()).toBe(false)
    pointer("pointerup", 2)
    expect(selectionMayStart()).toBe(true)
  })

  it("leaves a selection made before the press as it was", () => {
    const text = document.createElement("p")
    text.textContent = "selected before"
    document.body.append(text)
    getSelection()?.selectAllChildren(text)
    selectNothingUntilRelease({ pointerId: 1 })
    expect(getSelection()?.toString()).toBe("selected before")
    pointer("pointerup", 1)
    expect(getSelection()?.toString()).toBe("selected before")
    getSelection()?.removeAllRanges()
    text.remove()
  })
})
