import { useState } from "react"
import { describe, expect, it } from "vitest"

import { act, render, toElement } from "#test"

import type { ScrubKind, ScrubMode } from "./scrub.ts"

import { ScrubStrip } from "./ScrubStrip"

const stubPointerCapture = () => {
  // Unconditional: real Chromium implements these but throws for synthetic
  // pointerIds, and `??=` would keep the throwing version in browsers.
  HTMLDivElement.prototype.setPointerCapture = () => {}
  HTMLDivElement.prototype.releasePointerCapture = () => {}
  HTMLDivElement.prototype.hasPointerCapture = () => false
}

type PointerInit = {
  clientX: number
  shiftKey?: boolean
  ctrlKey?: boolean
  buttons?: number
  button?: number
}

const pointer = (type: string, init: PointerInit) =>
  new PointerEvent(type, { bubbles: true, pointerId: 1, button: 0, ...init })

const key = (type: "keydown" | "keyup", init: KeyboardEventInit) =>
  new KeyboardEvent(type, { bubbles: true, cancelable: true, ...init })

type Seen = { values: number[]; modes: (ScrubMode | null)[]; resets: number; edits: number }

type Report = {
  value: (next: number) => void
  mode: (mode: ScrubMode | null) => void
  reset: () => void
  edit: () => void
}

function Harness({ initial, kind, report }: { initial: number; kind: ScrubKind; report: Report }) {
  const [value, setValue] = useState(initial)
  return (
    <ScrubStrip
      testId="strip"
      label="k: Vertical shift"
      value={value}
      kind={kind}
      onChange={(next) => {
        report.value(next)
        setValue(next)
      }}
      onReset={() => {
        report.reset()
        setValue(kind === "additive" ? 0 : 1)
      }}
      onEditRequest={report.edit}
      onModeChange={report.mode}
    />
  )
}

const renderStrip = async ({
  initial = 1,
  kind = "additive",
}: { initial?: number; kind?: ScrubKind } = {}) => {
  stubPointerCapture()
  const seen: Seen = { values: [], modes: [], resets: 0, edits: 0 }
  const report: Report = {
    value: (next) => seen.values.push(next),
    mode: (mode) => seen.modes.push(mode),
    reset: () => {
      seen.resets += 1
    },
    edit: () => {
      seen.edits += 1
    },
  }
  const screen = await render(<Harness initial={initial} kind={kind} report={report} />)
  const strip = toElement(screen.getByTestId("strip"))
  const dispatch = (...events: Event[]) => {
    act(() => {
      for (const event of events) {
        strip.dispatchEvent(event)
      }
    })
  }
  return { strip, seen, dispatch, now: () => strip.getAttribute("aria-valuetext") }
}

describe("ScrubStrip", () => {
  it("is a named slider with its value as text, U+2212 for negatives", async () => {
    const { strip, now } = await renderStrip({ initial: -1.5 })
    expect(strip.getAttribute("role")).toBe("slider")
    expect(strip.getAttribute("tabindex")).toBe("0")
    expect(strip.getAttribute("aria-label")).toBe("k: Vertical shift")
    expect(strip.getAttribute("aria-valuenow")).toBe("-1.5")
    expect(now()).toBe("−1.50")
  })

  it("a scale's ruler reads its size; the text keeps the sign", async () => {
    const { strip, now } = await renderStrip({ initial: -2, kind: "multiplicative" })
    expect(strip.getAttribute("aria-valuenow")).toBe("2")
    expect(now()).toBe("−2.00")
  })

  it("drags right for more, 50 px per unit, from the press", async () => {
    const { dispatch, now, seen } = await renderStrip({ initial: 1 })
    dispatch(
      pointer("pointerdown", { clientX: 100 }),
      pointer("pointermove", { clientX: 150, buttons: 1 }),
      pointer("pointermove", { clientX: 200, buttons: 1 }),
      pointer("pointerup", { clientX: 200 }),
    )
    expect(now()).toBe("3.00")
    expect(seen.modes).toEqual(["coarse", null])
  })

  it("reports the mode as it changes and never jumps when Shift comes or goes", async () => {
    const { dispatch, now, seen } = await renderStrip({ initial: 1 })
    dispatch(
      pointer("pointerdown", { clientX: 100 }),
      pointer("pointermove", { clientX: 150, buttons: 1 }),
      pointer("pointermove", { clientX: 150, buttons: 1, shiftKey: true }),
    )
    // 50 px coarse: +1. Pressing Shift mid-drag moves nothing.
    expect(now()).toBe("2.00")
    dispatch(pointer("pointermove", { clientX: 160, buttons: 1, shiftKey: true }))
    // 10 px at a tenth of the speed: +0.02, on the 0.001 lattice.
    expect(now()).toBe("2.02")
    dispatch(pointer("pointermove", { clientX: 161, buttons: 1, shiftKey: true }))
    expect(now()).toBe("2.022")
    // Letting go of Shift keeps the fine digit until the pointer moves on.
    dispatch(key("keyup", { key: "Shift" }))
    expect(now()).toBe("2.022")
    dispatch(pointer("pointermove", { clientX: 171, buttons: 1 }), pointer("pointerup", { clientX: 171 }))
    expect(now()).toBe("2.22")
    expect(seen.modes).toEqual(["coarse", "fine", "coarse", null])
  })

  it("Ctrl snaps at once, held from the press or pressed mid-drag (D9)", async () => {
    const { dispatch, now, seen } = await renderStrip({ initial: 1.3 })
    dispatch(pointer("pointerdown", { clientX: 100, ctrlKey: true }))
    expect(now()).toBe("1.00")
    dispatch(pointer("pointerup", { clientX: 100 }))
    dispatch(pointer("pointerdown", { clientX: 100 }), pointer("pointermove", { clientX: 117, buttons: 1 }))
    expect(now()).toBe("1.34")
    dispatch(key("keydown", { key: "Control", ctrlKey: true }))
    expect(now()).toBe("1.00")
    dispatch(pointer("pointerup", { clientX: 117 }))
    expect(seen.modes).toEqual(["snap", null, "coarse", "snap", null])
  })

  it("a scale drags on its log ruler and never crosses 0", async () => {
    const { dispatch, seen } = await renderStrip({ initial: 1, kind: "multiplicative" })
    dispatch(
      pointer("pointerdown", { clientX: 1000 }),
      pointer("pointermove", { clientX: 1100, buttons: 1 }),
      pointer("pointermove", { clientX: -9000, buttons: 1 }),
      pointer("pointerup", { clientX: -9000 }),
    )
    expect(seen.values[0]).toBe(1.22)
    expect(Math.min(...seen.values)).toBe(0.01)
  })

  it("arrows nudge 0.01, Shift 0.1 (FV 07)", async () => {
    const { dispatch, now } = await renderStrip({ initial: 1 })
    dispatch(key("keydown", { key: "ArrowRight" }))
    expect(now()).toBe("1.01")
    dispatch(key("keydown", { key: "ArrowLeft", shiftKey: true }))
    expect(now()).toBe("0.91")
    dispatch(key("keydown", { key: "ArrowUp" }))
    expect(now()).toBe("0.92")
    dispatch(key("keydown", { key: "ArrowDown" }))
    expect(now()).toBe("0.91")
  })

  it("Enter asks for the value field; Backspace, Delete and a double-click reset", async () => {
    const { dispatch, seen } = await renderStrip({ initial: 5 })
    dispatch(key("keydown", { key: "Enter" }))
    expect(seen.edits).toBe(1)
    dispatch(key("keydown", { key: "Backspace" }))
    dispatch(key("keydown", { key: "Delete" }))
    dispatch(new MouseEvent("dblclick", { bubbles: true }))
    expect(seen.resets).toBe(3)
  })

  it("wheel up increases without scrolling", async () => {
    const { strip, now } = await renderStrip({ initial: 1 })
    const event = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: -100 })
    act(() => {
      strip.dispatchEvent(event)
    })
    expect(event.defaultPrevented).toBe(true)
    // One notch up: 15px at 0.02 units/px from 1.
    expect(now()).toBe("1.30")
  })

  it("only the primary button drags", async () => {
    const { dispatch, seen } = await renderStrip({ initial: 1 })
    dispatch(
      pointer("pointerdown", { clientX: 100, button: 2 }),
      pointer("pointermove", { clientX: 200, buttons: 2 }),
    )
    expect(seen.values).toEqual([])
    expect(seen.modes).toEqual([])
  })

  it("a buttonless move never scrubs (missed release self-heals)", async () => {
    const { dispatch, seen } = await renderStrip({ initial: 1 })
    // Release outside the window: no pointerup ever arrives, so the next
    // hover move carries buttons 0 and must not scrub.
    dispatch(pointer("pointerdown", { clientX: 100 }), pointer("pointermove", { clientX: 200, buttons: 0 }))
    expect(seen.values).toEqual([])
    expect(seen.modes).toEqual(["coarse", null])
  })

  it("lostpointercapture stops the scrub", async () => {
    const { dispatch, seen } = await renderStrip({ initial: 1 })
    dispatch(pointer("pointerdown", { clientX: 100 }), pointer("pointermove", { clientX: 200, buttons: 1 }))
    const frozen = seen.values.length
    expect(frozen).toBeGreaterThan(0)
    dispatch(
      new PointerEvent("lostpointercapture", { bubbles: true, pointerId: 1 }),
      pointer("pointermove", { clientX: 300, buttons: 1 }),
    )
    expect(seen.values.length).toBe(frozen)
  })

  it("window blur stops the scrub", async () => {
    const { dispatch, seen } = await renderStrip({ initial: 1 })
    dispatch(pointer("pointerdown", { clientX: 100 }), pointer("pointermove", { clientX: 200, buttons: 1 }))
    const frozen = seen.values.length
    act(() => {
      window.dispatchEvent(new Event("blur"))
    })
    dispatch(pointer("pointermove", { clientX: 300, buttons: 1 }))
    expect(seen.values.length).toBe(frozen)
    expect(seen.modes.at(-1)).toBeNull()
  })
})
