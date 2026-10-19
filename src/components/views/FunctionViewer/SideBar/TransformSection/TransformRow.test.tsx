import { afterEach, describe, expect, it } from "vitest"

import { act, isBrowser, render, toElement, updateLocationHash } from "#test"

import { TransformRow } from "./TransformRow"

afterEach(async () => {
  await updateLocationHash("")
})

const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set

const type = (box: HTMLInputElement, text: string) =>
  act(() => {
    valueSetter?.call(box, text)
    box.dispatchEvent(new Event("input", { bubbles: true }))
  })

const press = (box: HTMLInputElement, key: string) =>
  act(() => box.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true })))

const urlValue = (key: string) => new URLSearchParams(window.location.hash.split("?")[1]).get(key)

const pointer = (type: string, box: HTMLInputElement, clientX: number) =>
  act(() =>
    box.parentElement?.dispatchEvent(
      new PointerEvent(type, {
        pointerId: 1,
        pointerType: "mouse",
        button: 0,
        buttons: type === "pointerup" ? 0 : 1,
        clientX,
        bubbles: true,
      }),
    ),
  )

const point = (row: HTMLElement, type: "pointerover" | "pointerout") =>
  act(() => row.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: "mouse" })))

describe("a transform row's box", () => {
  it("sets the value when Enter is pressed, not while typing", async () => {
    const screen = await render(<TransformRow name="y scale" param="a" />)
    const box = toElement(screen.getByLabelText("y scale")) as HTMLInputElement
    await expect.element(box).toHaveValue("1.00")

    act(() => box.focus())
    type(box, "2.5")
    expect(box).toHaveValue("2.5")
    expect(urlValue("a")).toBeNull()

    press(box, "Enter")
    await expect.poll(() => urlValue("a")).toBe("2.5")
    expect(box).toHaveValue("2.50")
  })

  it("puts the old value back when a scale of 0 is typed", async () => {
    await updateLocationHash("#?a=2")
    const screen = await render(<TransformRow name="y scale" param="a" />)
    const box = toElement(screen.getByLabelText("y scale")) as HTMLInputElement
    await expect.element(box).toHaveValue("2.00")

    act(() => box.focus())
    type(box, "0")
    expect(box).toHaveValue("0")
    act(() => box.blur())
    expect(box).toHaveValue("2.00")
    expect(urlValue("a")).toBe("2")
  })
})

describe("a transform row's reset button", () => {
  it("shows while the value is off its default, and puts the default back", async () => {
    await updateLocationHash("#?a=2")
    const screen = await render(<TransformRow name="y scale" param="a" />)
    const box = toElement(screen.getByLabelText("y scale", { exact: true })) as HTMLInputElement
    await expect.element(box).toHaveValue("2.00")
    const reset = toElement(screen.getByRole("button", { name: "Reset y scale to 1" }))

    act(() => reset.dispatchEvent(new MouseEvent("click", { bubbles: true })))
    expect(box).toHaveValue("1.00")
    await expect.poll(() => urlValue("a")).toBeNull()
    expect(reset.isConnected).toBe(false)
  })

  it.runIf(isBrowser())("hides while a drag holds the value", async () => {
    await updateLocationHash("#?a=2")
    const screen = await render(<TransformRow name="y scale" param="a" />)
    const box = toElement(screen.getByLabelText("y scale", { exact: true })) as HTMLInputElement
    await expect.element(box).toHaveValue("2.00")
    const reset = toElement(screen.getByRole("button", { name: "Reset y scale to 1" }))
    expect(getComputedStyle(reset).display).not.toBe("none")

    pointer("pointerdown", box, 100)
    pointer("pointermove", box, 130)
    expect(getComputedStyle(reset).display).toBe("none")

    pointer("pointerup", box, 130)
    expect(getComputedStyle(reset).display).not.toBe("none")
  })

  it.runIf(isBrowser())("leaves the row unlit once the pointer moves off after a click", async () => {
    await updateLocationHash("#?a=2")
    const screen = await render(<TransformRow name="y scale" param="a" />)
    const box = toElement(screen.getByLabelText("y scale", { exact: true }))
    await expect.element(box).toHaveValue("2.00")
    const row = toElement(box.closest("[data-param]"))
    expect(row.hasAttribute("data-lit")).toBe(false)

    await screen.getByRole("button", { name: "Reset y scale to 1" }).click()
    await expect.element(box).toHaveValue("1.00")
    expect(row.hasAttribute("data-lit")).toBe(true)

    point(row, "pointerout")
    expect(row.hasAttribute("data-lit")).toBe(false)
  })
})
