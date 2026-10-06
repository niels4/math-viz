import { useState } from "react"
import { describe, expect, it } from "vitest"

import { act, render, toElement } from "#test"

import { ScrubStrip } from "./ScrubStrip"

const stubPointerCapture = () => {
  // Unconditional: real Chromium implements these but throws for synthetic
  // pointerIds, and `??=` would keep the throwing version in browsers.
  HTMLDivElement.prototype.setPointerCapture = () => {}
  HTMLDivElement.prototype.releasePointerCapture = () => {}
  HTMLDivElement.prototype.hasPointerCapture = () => false
}

const pointer = (type: string, init: { pointerId: number; clientX: number; shiftKey?: boolean }) =>
  new PointerEvent(type, { bubbles: true, ...init })

function Harness({
  initial = 1,
  kind = "additive",
  step = 0.02,
  defaultValue = 0,
  seen,
}: {
  initial?: number
  kind?: "additive" | "multiplicative"
  step?: number
  defaultValue?: number
  seen?: (next: number) => void
}) {
  const [value, setValue] = useState(initial)
  return (
    <ScrubStrip
      testId="strip"
      label="X offset"
      {...{
        value,
        onChange: (next: number) => {
          seen?.(next)
          setValue(next)
        },
        kind,
        step,
        defaultValue,
      }}
    />
  )
}

const renderStrip = async (props?: {
  initial?: number
  kind?: "additive" | "multiplicative"
  step?: number
  defaultValue?: number
  seen?: (next: number) => void
}) => {
  stubPointerCapture()
  const screen = await render(<Harness {...props} />)
  return toElement(screen.getByTestId("strip")) as HTMLDivElement
}

describe("ScrubStrip", () => {
  it("exposes slider semantics with the live value", async () => {
    const strip = await renderStrip({ initial: 2.5 })
    expect(strip.getAttribute("role")).toBe("slider")
    expect(strip.getAttribute("aria-valuenow")).toBe("2.5")
  })

  it("scrubs relative to the grab point", async () => {
    const strip = await renderStrip({ initial: 1 })
    act(() => {
      strip.dispatchEvent(pointer("pointerdown", { pointerId: 1, clientX: 100 }))
      strip.dispatchEvent(pointer("pointermove", { pointerId: 1, clientX: 200 }))
      strip.dispatchEvent(pointer("pointerup", { pointerId: 1, clientX: 200 }))
    })
    // +100px at 0.02 units/px from 1.
    expect(strip.getAttribute("aria-valuenow")).toBe("3")
  })

  it("Shift drags at fine rate", async () => {
    const strip = await renderStrip({ initial: 1 })
    act(() => {
      strip.dispatchEvent(pointer("pointerdown", { pointerId: 1, clientX: 100 }))
      strip.dispatchEvent(pointer("pointermove", { pointerId: 1, clientX: 200, shiftKey: true }))
      strip.dispatchEvent(pointer("pointerup", { pointerId: 1, clientX: 200 }))
    })
    // +100px at 0.002 units/px from 1.
    expect(strip.getAttribute("aria-valuenow")).toBe("1.2")
  })

  it("double-click resets to the default", async () => {
    const seen: number[] = []
    const strip = await renderStrip({ initial: 5, defaultValue: 0, seen: (next) => seen.push(next) })
    act(() => {
      strip.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }))
    })
    expect(seen).toEqual([0])
  })

  it("wheel up increases without scrolling", async () => {
    const strip = await renderStrip({ initial: 1 })
    const event = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: -100 })
    let canceled = false
    act(() => {
      canceled = !strip.dispatchEvent(event)
    })
    expect(event.defaultPrevented).toBe(true)
    expect(canceled).toBe(true)
    // One notch up: 15px at 0.02 units/px from 1.
    expect(strip.getAttribute("aria-valuenow")).toBe("1.3")
  })

  it("arrow keys nudge", async () => {
    const strip = await renderStrip({ initial: 1 })
    act(() => {
      strip.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }))
    })
    expect(strip.getAttribute("aria-valuenow")).toBe("1.3")
  })

  it("multiplicative scrub never crosses zero", async () => {
    const seen: number[] = []
    const strip = await renderStrip({
      initial: 1,
      kind: "multiplicative",
      step: 0.002,
      seen: (next) => seen.push(next),
    })
    act(() => {
      strip.dispatchEvent(pointer("pointerdown", { pointerId: 1, clientX: 1000 }))
      strip.dispatchEvent(pointer("pointermove", { pointerId: 1, clientX: -9000 }))
      strip.dispatchEvent(pointer("pointerup", { pointerId: 1, clientX: -9000 }))
    })
    expect(seen.length).toBeGreaterThan(0)
    expect(Math.min(...seen)).toBeGreaterThan(0)
  })
})
