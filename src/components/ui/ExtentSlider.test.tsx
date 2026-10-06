import { useState } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { formatNumber } from "#src/util/format/number.ts"
import { act, render, toElement } from "#test"

import { ExtentSlider } from "./ExtentSlider.tsx"

// R2's scrubber: the plane's visible x-range at 100 % over a 396 px track.
const TRACK = { left: 100, width: 396 }
const R2 = { min: -9.36, max: 9.36 }

const stubLayout = () => {
  // Unconditional: real Chromium implements these but throws for synthetic
  // pointerIds, and `??=` would keep the throwing version in browsers.
  HTMLDivElement.prototype.setPointerCapture = () => {}
  HTMLDivElement.prototype.releasePointerCapture = () => {}
  HTMLDivElement.prototype.hasPointerCapture = () => false
  // Real Chromium's ResizeObserver would report the laid-out track over the mock.
  vi.stubGlobal("ResizeObserver", undefined)
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    x: TRACK.left,
    y: 0,
    left: TRACK.left,
    top: 0,
    width: TRACK.width,
    height: 36,
    right: TRACK.left + TRACK.width,
    bottom: 36,
    toJSON: () => ({}),
  })
}

type Seen = { values: number[]; drags: boolean[]; edits: string[] }

function Harness({
  initial,
  range,
  seen,
}: {
  initial: number
  range: { min: number; max: number }
  seen: Seen
}) {
  const [value, setValue] = useState(initial)
  return (
    <ExtentSlider
      testId="s"
      label="x of P"
      symbol="x"
      format={formatNumber}
      value={value}
      min={range.min}
      max={range.max}
      quantum={0.01}
      onChange={(next) => {
        seen.values.push(next)
        setValue(next)
      }}
      renderThumb={(parked) => <i data-testid="mark" data-parked={parked || undefined} />}
      onEditRequest={() => seen.edits.push("Enter")}
      onDragChange={(dragging) => seen.drags.push(dragging)}
    />
  )
}

const renderSlider = async (initial = 2, range = R2) => {
  const seen: Seen = { values: [], drags: [], edits: [] }
  const screen = await render(<Harness initial={initial} range={range} seen={seen} />)
  const track = toElement(screen.getByTestId("s")) as HTMLDivElement
  const thumb = () => document.querySelector('[data-testid="s-thumb"]') as HTMLElement | null
  const key = (k: string, init: KeyboardEventInit = {}) => {
    act(() => {
      track.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: k, ...init }))
    })
  }
  const pointer = (type: string, clientX: number, buttons = 1) => {
    act(() => {
      track.dispatchEvent(
        new PointerEvent(type, { bubbles: true, pointerId: 1, button: 0, buttons, clientX }),
      )
    })
  }
  return { track, thumb, key, pointer, seen }
}

describe("ExtentSlider (the P scrubber, FV 07)", () => {
  beforeEach(stubLayout)
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("is a slider over the live range that names its value", async () => {
    const { track } = await renderSlider(2)
    expect(track.getAttribute("role")).toBe("slider")
    expect(track.getAttribute("aria-valuemin")).toBe("-9.36")
    expect(track.getAttribute("aria-valuemax")).toBe("9.36")
    expect(track.getAttribute("aria-valuenow")).toBe("2")
    expect(track.getAttribute("aria-valuetext")).toBe("2")
  })

  it("calibrates the track like the x-axis and centres the thumb on the value (R2)", async () => {
    const { track, thumb } = await renderSlider(2)
    const labels = [...track.querySelectorAll("span")].filter((s) => /^[−\d]+$/.test(s.textContent))
    expect(labels.map((s) => s.textContent)).toEqual(["−8", "−6", "−4", "−2", "0", "2", "4", "6", "8"])
    // (2 + 9.36) / 18.72 of 396 px.
    expect(thumb()?.style.left).toBe("240.31px")
    expect(track.textContent).toContain("= 2")
  })

  it("parks the thumb on the end the value lies past, dashed, the tip pointing the way", async () => {
    const right = await renderSlider(21.5)
    expect(right.track.getAttribute("data-parked")).toBe("right")
    expect(right.thumb()?.style.left).toBe("396px")
    expect(document.querySelector('[data-testid="mark"]')?.hasAttribute("data-parked")).toBe(true)
  })

  it("parks on the left end too", async () => {
    const left = await renderSlider(-14.2)
    expect(left.track.getAttribute("data-parked")).toBe("left")
    expect(left.thumb()?.style.left).toBe("0px")
  })

  it("jumps to a press and drags, on the 0.01 lattice and inside the range", async () => {
    const { pointer, seen, track } = await renderSlider(2)
    // A quarter of the way along: −9.36 + 4.68.
    pointer("pointerdown", TRACK.left + 99)
    expect(track.getAttribute("aria-valuenow")).toBe("-4.68")
    pointer("pointermove", TRACK.left + 2000)
    expect(track.getAttribute("aria-valuenow")).toBe("9.36")
    pointer("pointerup", TRACK.left + 2000, 0)
    expect(seen.drags).toEqual([true, false])
  })

  it("steps 0.1 with the arrows and 1 with Shift, past the range's ends", async () => {
    const { key, track } = await renderSlider(9.3)
    key("ArrowRight")
    expect(track.getAttribute("aria-valuenow")).toBe("9.4")
    key("ArrowLeft", { shiftKey: true })
    expect(track.getAttribute("aria-valuenow")).toBe("8.4")
    key("ArrowDown")
    expect(track.getAttribute("aria-valuenow")).toBe("8.3")
  })

  it("jumps to the ends with Home and End, inside the range", async () => {
    const { key, track } = await renderSlider(2, { min: -9.364, max: 9.366 })
    key("Home")
    expect(track.getAttribute("aria-valuenow")).toBe("-9.36")
    key("End")
    expect(track.getAttribute("aria-valuenow")).toBe("9.36")
  })

  it("asks its owner to open the value field on Enter", async () => {
    const { key, seen } = await renderSlider(2)
    key("Enter")
    expect(seen.edits).toEqual(["Enter"])
  })

  it("ends a drag on a release anywhere, and drops one whose release was missed", async () => {
    const { pointer, seen } = await renderSlider(2)
    pointer("pointerdown", TRACK.left + 198)
    act(() => {
      window.dispatchEvent(new PointerEvent("pointerup"))
    })
    expect(seen.drags).toEqual([true, false])
    pointer("pointerdown", TRACK.left + 198)
    pointer("pointermove", TRACK.left + 300, 0)
    expect(seen.drags).toEqual([true, false, true, false])
    pointer("pointermove", TRACK.left + 350, 0)
    expect(seen.values.at(-1)).toBe(0)
  })

  it("shows no thumb and ignores presses over an empty range", async () => {
    const { pointer, seen, thumb } = await renderSlider(0, { min: 0, max: 0 })
    expect(thumb()).toBeNull()
    pointer("pointerdown", TRACK.left + 150)
    expect(seen.values).toEqual([])
    expect(seen.drags).toEqual([])
  })
})
