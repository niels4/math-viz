import { useState } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { act, render, selectionMayStart, toElement } from "#test"

import { Slider } from "./Slider.tsx"

// A 200 px track from x 0: 2 px per percent.
const stubLayout = () => {
  // Unconditional: real Chromium implements these but throws for synthetic pointerIds.
  HTMLDivElement.prototype.setPointerCapture = () => {}
  HTMLDivElement.prototype.releasePointerCapture = () => {}
  HTMLDivElement.prototype.hasPointerCapture = () => false
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    width: 200,
    height: 14,
    right: 200,
    bottom: 14,
    toJSON: () => ({}),
  })
}

function Harness() {
  const [value, setValue] = useState(50)
  return <Slider value={value} onChange={setValue} label="Opacity" testId="s" />
}

describe("Slider", () => {
  beforeEach(stubLayout)
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("follows a drag and selects no text from the press until it is let go", async () => {
    const screen = await render(<Harness />)
    const track = toElement(screen.getByTestId("s"))
    const pointer = (type: string, clientX: number, buttons: number) => {
      act(() => {
        track.dispatchEvent(
          new PointerEvent(type, { bubbles: true, pointerId: 1, button: 0, buttons, clientX }),
        )
      })
    }
    pointer("pointerdown", 50, 1)
    expect(track.getAttribute("aria-valuenow")).toBe("25")
    pointer("pointermove", 900, 1)
    expect(track.getAttribute("aria-valuenow")).toBe("100")
    expect(selectionMayStart()).toBe(false)
    pointer("pointerup", 900, 0)
    expect(selectionMayStart()).toBe(true)
  })
})
