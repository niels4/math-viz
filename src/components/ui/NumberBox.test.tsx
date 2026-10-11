import { useState } from "react"
import { describe, expect, it } from "vitest"

import { act, render, selectionMayStart, toElement } from "#test"

import type { ScrubKind, ScrubMode } from "./scrub.ts"

import { NumberBox } from "./NumberBox.tsx"

const stubPointerCapture = () => {
  // Unconditional: real Chromium implements these but throws for synthetic
  // pointerIds, and `??=` would keep the throwing version in browsers.
  HTMLDivElement.prototype.setPointerCapture = () => {}
  HTMLDivElement.prototype.releasePointerCapture = () => {}
  HTMLDivElement.prototype.hasPointerCapture = () => false
}

type PointerInit = { clientX: number; shiftKey?: boolean; ctrlKey?: boolean; buttons?: number }

const pointer = (type: string, init: PointerInit) =>
  new PointerEvent(type, { bubbles: true, pointerId: 1, button: 0, ...init })

type Seen = {
  changes: number[]
  commits: number[]
  modes: (ScrubMode | null)[]
  resets: string[]
}

function Harness({ initial, kind, seen }: { initial: number; kind: ScrubKind; seen: Seen }) {
  const [value, setValue] = useState(initial)
  return (
    <NumberBox
      testId="n"
      label="k: Vertical shift"
      value={value}
      kind={kind}
      validate={(next) => (kind === "multiplicative" && next === 0 ? "zero-scale" : null)}
      onChange={(next) => {
        seen.changes.push(next)
        setValue(next)
      }}
      onCommit={(next) => {
        seen.commits.push(next)
        setValue(next)
      }}
      onReset={() => {
        seen.resets.push("reset")
        setValue(kind === "additive" ? 0 : 1)
      }}
      onModeChange={(mode) => seen.modes.push(mode)}
    />
  )
}

const setInput = (input: HTMLInputElement, next: string) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set
  setter?.call(input, next)
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

const renderBox = async ({ initial = 1, kind = "additive" }: { initial?: number; kind?: ScrubKind } = {}) => {
  stubPointerCapture()
  const seen: Seen = { changes: [], commits: [], modes: [], resets: [] }
  const screen = await render(<Harness initial={initial} kind={kind} seen={seen} />)
  const box = toElement(screen.getByTestId("n-box"))
  const field = toElement(screen.getByTestId("n-field")) as HTMLInputElement
  const fire = (type: string, init: PointerInit) => {
    act(() => {
      box.dispatchEvent(pointer(type, init))
    })
  }
  const key = (target: HTMLElement, k: string, init: KeyboardEventInit = {}) => {
    act(() => {
      target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: k, ...init }))
    })
  }
  /** A press and release where the pointer was, as a click is. */
  const click = (detail = 1) => {
    fire("pointerdown", { clientX: 100, buttons: 1 })
    act(() => {
      box.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, detail }))
    })
    fire("pointerup", { clientX: 100, buttons: 0 })
  }
  return { box, field, fire, key, click, seen }
}

describe("NumberBox (figma0 SB3 · C3 › Number box)", () => {
  it("is a spin button that prints its value", async () => {
    const { box, field } = await renderBox({ initial: -1 })
    expect(box.getAttribute("role")).toBe("spinbutton")
    expect(box.getAttribute("aria-label")).toBe("k: Vertical shift")
    expect(box.getAttribute("aria-valuetext")).toBe("−1.00")
    expect(field.value).toBe("−1.00")
  })

  it("drags sideways once the press has moved 3 px, from the press, at the ruler's rate", async () => {
    const { fire, seen, box } = await renderBox({ initial: 1 })
    fire("pointerdown", { clientX: 100, buttons: 1 })
    fire("pointermove", { clientX: 102, buttons: 1 })
    // Still a press: no drag, no change.
    expect(seen.modes).toEqual([])
    expect(seen.changes).toEqual([])
    fire("pointermove", { clientX: 150, buttons: 1 })
    expect(seen.modes).toEqual(["coarse"])
    // 50 px at 50 px per unit, measured from the press.
    expect(box.getAttribute("aria-valuenow")).toBe("2")
    expect(selectionMayStart()).toBe(false)
    fire("pointerup", { clientX: 150, buttons: 0 })
    expect(seen.modes).toEqual(["coarse", null])
    expect(selectionMayStart()).toBe(true)
  })

  it("drags fine with Shift and snaps with Ctrl, as the ruler does", async () => {
    const { fire, seen } = await renderBox({ initial: 1 })
    fire("pointerdown", { clientX: 100, buttons: 1, shiftKey: true })
    fire("pointermove", { clientX: 150, buttons: 1, shiftKey: true })
    expect(seen.modes).toEqual(["fine"])
    expect(seen.changes.at(-1)).toBe(1.1)
    fire("pointermove", { clientX: 150, buttons: 1, ctrlKey: true })
    expect(seen.modes.at(-1)).toBe("snap")
    expect(seen.changes.at(-1)).toBe(1)
    fire("pointerup", { clientX: 150, buttons: 0 })
  })

  it("opens its field on a click, text selected, and Enter applies a typed value", async () => {
    const { box, field, click, key, seen } = await renderBox({ initial: 1 })
    click()
    expect(seen.modes).toEqual([])
    expect(box.hasAttribute("data-editing")).toBe(true)
    expect(document.activeElement).toBe(field)
    expect(field.readOnly).toBe(false)
    act(() => setInput(field, "2.5"))
    key(field, "Enter")
    expect(seen.commits).toEqual([2.5])
    expect(box.hasAttribute("data-editing")).toBe(false)
    // The focus comes back to the box, the row's one tab stop.
    expect(document.activeElement).toBe(box)
  })

  it("keeps refused text open, marked, until Esc puts the value back", async () => {
    const { box, field, click, key, seen } = await renderBox({ initial: 2, kind: "multiplicative" })
    click()
    act(() => setInput(field, "0"))
    key(field, "Enter")
    expect(box.hasAttribute("data-error")).toBe(true)
    expect(seen.commits).toEqual([])
    key(field, "Escape")
    expect(box.hasAttribute("data-error")).toBe(false)
    expect(field.value).toBe("2.00")
  })

  it("resets on a double-click, whatever the first click opened", async () => {
    const { box, click, seen } = await renderBox({ initial: 3 })
    click(1)
    click(2)
    expect(seen.resets).toEqual(["reset"])
    expect(box.hasAttribute("data-editing")).toBe(false)
    expect(box.getAttribute("aria-valuetext")).toBe("0.00")
  })

  it("nudges with the arrows, types on Enter and resets on Backspace", async () => {
    const { box, field, key, seen } = await renderBox({ initial: 1 })
    act(() => box.focus())
    key(box, "ArrowRight")
    key(box, "ArrowUp", { shiftKey: true })
    key(box, "ArrowLeft")
    expect(seen.changes).toEqual([1.01, 1.11, 1.1])
    key(box, "Enter")
    expect(document.activeElement).toBe(field)
    key(field, "Escape")
    expect(document.activeElement).toBe(box)
    key(box, "Backspace")
    expect(seen.resets).toEqual(["reset"])
  })

  it("scrubs with the wheel without scrolling the page", async () => {
    const { box, seen } = await renderBox({ initial: 1 })
    const wheel = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: -10 })
    act(() => {
      box.dispatchEvent(wheel)
    })
    expect(wheel.defaultPrevented).toBe(true)
    expect(seen.changes.length).toBe(1)
  })
})
