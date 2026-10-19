import { afterEach, describe, expect, it } from "vitest"

import { act, render, toElement, updateLocationHash } from "#test"

import { aParam } from "../queryParams"
import { TransformRow } from "./TransformRow"

afterEach(async () => {
  await updateLocationHash("")
})

const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set

// Text typed into the box. React skips an input event when the box holds the
// value it last rendered, so the text goes in through the prototype's setter.
const type = (box: HTMLInputElement, text: string) =>
  act(() => {
    valueSetter?.call(box, text)
    box.dispatchEvent(new Event("input", { bubbles: true }))
  })

const press = (box: HTMLInputElement, key: string) =>
  act(() => box.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true })))

const urlValue = (key: string) => new URLSearchParams(window.location.hash.split("?")[1]).get(key)

describe("a transform row's box", () => {
  it("sets the value when Enter is pressed, not while typing", async () => {
    // A fresh page shows a at 1.00.
    const screen = await render(<TransformRow name="Vertical scale" param={aParam} />)
    const box = toElement(screen.getByLabelText("Vertical scale")) as HTMLInputElement
    await expect.element(box).toHaveValue("1.00")

    // Typing 2.5 shows the text as typed and leaves the URL alone.
    act(() => box.focus())
    type(box, "2.5")
    expect(box).toHaveValue("2.5")
    expect(urlValue("a")).toBeNull()

    // Enter writes a=2.5 and shows it with two decimals.
    press(box, "Enter")
    await expect.poll(() => urlValue("a")).toBe("2.5")
    expect(box).toHaveValue("2.50")
  })

  it("puts the old value back when a scale of 0 is typed", async () => {
    // A link with a=2 shows 2.00.
    await updateLocationHash("#?a=2")
    const screen = await render(<TransformRow name="Vertical scale" param={aParam} />)
    const box = toElement(screen.getByLabelText("Vertical scale")) as HTMLInputElement
    await expect.element(box).toHaveValue("2.00")

    // Typing 0 and leaving the box brings back 2.00, and the URL keeps a=2.
    act(() => box.focus())
    type(box, "0")
    expect(box).toHaveValue("0")
    act(() => box.blur())
    expect(box).toHaveValue("2.00")
    expect(urlValue("a")).toBe("2")
  })
})
