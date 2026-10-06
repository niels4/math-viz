import { useState } from "react"
import { describe, expect, it } from "vitest"

import { act, render, toElement } from "#test"

import { ExtentSlider } from "./ExtentSlider"

const stubPointerCapture = () => {
  // Unconditional: real Chromium implements these but throws for synthetic
  // pointerIds, and `??=` would keep the throwing version in browsers.
  HTMLDivElement.prototype.setPointerCapture = () => {}
  HTMLDivElement.prototype.releasePointerCapture = () => {}
  HTMLDivElement.prototype.hasPointerCapture = () => false
}

const pointer = (type: string, init: { pointerId: number; clientX: number; buttons?: number }) =>
  new PointerEvent(type, { bubbles: true, ...init })

function Harness({
  initial = 5,
  min = 0,
  max = 10,
  seen,
}: {
  initial?: number
  min?: number
  max?: number
  seen?: (next: number) => void
}) {
  const [value, setValue] = useState(initial)
  const [range, setRange] = useState({ min, max })
  return (
    <>
      <button data-testid="widen" onClick={() => setRange({ min: 0, max: 20 })} />
      <ExtentSlider
        testId="s"
        label="p1 position"
        {...{ value }}
        min={range.min}
        max={range.max}
        onChange={(next: number) => {
          seen?.(next)
          setValue(next)
        }}
      />
    </>
  )
}

const renderSlider = async (props?: {
  initial?: number
  min?: number
  max?: number
  seen?: (next: number) => void
}) => {
  stubPointerCapture()
  const screen = await render(<Harness {...props} />)
  return { screen, track: toElement(screen.getByTestId("s")) as HTMLDivElement }
}

const knob = () => document.querySelector('[data-testid="s-knob"]') as HTMLDivElement | null

const stubTrackRect = (track: HTMLDivElement, left: number, width: number) => {
  track.getBoundingClientRect = () => ({
    x: left,
    y: 0,
    width,
    height: 14,
    top: 0,
    left,
    right: left + width,
    bottom: 14,
    toJSON: () => {},
  })
}

describe("ExtentSlider", () => {
  it("exposes slider semantics with the live min/max/value", async () => {
    const { track } = await renderSlider({ initial: 2.5, min: -10, max: 10 })
    expect(track.getAttribute("role")).toBe("slider")
    expect(track.getAttribute("aria-valuemin")).toBe("-10")
    expect(track.getAttribute("aria-valuemax")).toBe("10")
    expect(track.getAttribute("aria-valuenow")).toBe("2.5")
  })

  it("sits the knob at the value's fractional position", async () => {
    await renderSlider({ initial: 5, min: 0, max: 10 })
    expect(knob()?.style.left).toBe("50%")
  })

  it("shows the extent bounds under the track", async () => {
    const { screen } = await renderSlider({ min: -10, max: 10 })
    expect(toElement(screen.getByTestId("s-min")).textContent).toBe("-10")
    expect(toElement(screen.getByTestId("s-max")).textContent).toBe("10")
  })

  it("trims float tails off the displayed bounds", async () => {
    const { screen } = await renderSlider({ min: -13.999999999999998, max: 14.000000000000002 })
    expect(toElement(screen.getByTestId("s-min")).textContent).toBe("-14")
    expect(toElement(screen.getByTestId("s-max")).textContent).toBe("14")
  })

  it("follows min/max updates (the grid extent)", async () => {
    const { screen } = await renderSlider({ initial: 5, min: 0, max: 10 })
    expect(knob()?.style.left).toBe("50%")
    act(() => {
      toElement(screen.getByTestId("widen")).dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    expect(knob()?.style.left).toBe("25%")
    expect(toElement(screen.getByTestId("s-min")).textContent).toBe("0")
    expect(toElement(screen.getByTestId("s-max")).textContent).toBe("20")
  })

  it("hides the knob below min", async () => {
    await renderSlider({ initial: -1, min: 0, max: 10 })
    expect(knob()).toBeNull()
  })

  it("hides the knob above max", async () => {
    await renderSlider({ initial: 11, min: 0, max: 10 })
    expect(knob()).toBeNull()
  })

  it("hides the knob and ignores drags on a degenerate range", async () => {
    const seen: number[] = []
    const { track } = await renderSlider({ initial: 0, min: 0, max: 0, seen: (next) => seen.push(next) })
    expect(knob()).toBeNull()
    stubTrackRect(track, 100, 200)
    act(() => {
      track.dispatchEvent(pointer("pointerdown", { pointerId: 1, clientX: 150 }))
      track.dispatchEvent(pointer("pointermove", { pointerId: 1, clientX: 180, buttons: 1 }))
      track.dispatchEvent(pointer("pointerup", { pointerId: 1, clientX: 180 }))
    })
    expect(seen).toEqual([])
  })

  it("clicking the track jumps to that fraction of the range", async () => {
    const { track } = await renderSlider({ initial: 5, min: 0, max: 10 })
    stubTrackRect(track, 100, 200)
    act(() => {
      // 50px into a 200px track: min + 0.25 * span.
      track.dispatchEvent(pointer("pointerdown", { pointerId: 1, clientX: 150 }))
      track.dispatchEvent(pointer("pointerup", { pointerId: 1, clientX: 150 }))
    })
    expect(track.getAttribute("aria-valuenow")).toBe("2.5")
  })

  it("quantizes drags to 3 decimals (no float tails)", async () => {
    const { track } = await renderSlider({ initial: 5, min: 0, max: 10 })
    stubTrackRect(track, 100, 300)
    act(() => {
      // 1px into a 300px track over span 10: 0.0333... rounds to 0.033.
      track.dispatchEvent(pointer("pointerdown", { pointerId: 1, clientX: 101 }))
      track.dispatchEvent(pointer("pointerup", { pointerId: 1, clientX: 101 }))
    })
    expect(track.getAttribute("aria-valuenow")).toBe("0.033")
  })

  it("dragging scrubs along the range", async () => {
    const { track } = await renderSlider({ initial: 0, min: -10, max: 10 })
    stubTrackRect(track, 100, 200)
    act(() => {
      track.dispatchEvent(pointer("pointerdown", { pointerId: 1, clientX: 100 }))
      track.dispatchEvent(pointer("pointermove", { pointerId: 1, clientX: 300, buttons: 1 }))
      track.dispatchEvent(pointer("pointerup", { pointerId: 1, clientX: 300 }))
    })
    expect(track.getAttribute("aria-valuenow")).toBe("10")
  })

  it("arrow keys nudge by a hundredth of the span", async () => {
    const { track } = await renderSlider({ initial: 0, min: 0, max: 10 })
    act(() => {
      track.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }))
    })
    expect(track.getAttribute("aria-valuenow")).toBe("0.1")
  })

  it("Home and End jump to min and max", async () => {
    const { track } = await renderSlider({ initial: 5, min: 0, max: 10 })
    act(() => {
      track.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Home" }))
    })
    expect(track.getAttribute("aria-valuenow")).toBe("0")
    act(() => {
      track.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "End" }))
    })
    expect(track.getAttribute("aria-valuenow")).toBe("10")
  })
})
