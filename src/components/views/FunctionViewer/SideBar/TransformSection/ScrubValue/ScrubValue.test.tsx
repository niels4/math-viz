import { afterEach, describe, expect, it, vi } from "vitest"

import { act, render, selectionMayStart, toElement, updateLocationHash } from "#test"

import { ScrubValue } from "./ScrubValue"

afterEach(async () => {
  await updateLocationHash("")
})

type Keys = { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }

const pointer = (type: string, box: HTMLElement, clientX: number, keys: Keys) =>
  act(() =>
    box.dispatchEvent(
      new PointerEvent(type, {
        pointerId: 1,
        pointerType: "mouse",
        button: 0,
        buttons: type === "pointerup" ? 0 : 1,
        clientX,
        bubbles: true,
        ...keys,
      }),
    ),
  )
const down = (box: HTMLElement, clientX: number, keys: Keys = {}) =>
  pointer("pointerdown", box, clientX, keys)
const move = (box: HTMLElement, clientX: number, keys: Keys = {}) =>
  pointer("pointermove", box, clientX, keys)
const up = (box: HTMLElement, clientX: number, keys: Keys = {}) => pointer("pointerup", box, clientX, keys)

const modifier = (type: "keydown" | "keyup", key: string, keys: Keys) =>
  act(() => window.dispatchEvent(new KeyboardEvent(type, { key, ...keys })))

const wheel = (box: HTMLElement, ...deltaYs: number[]) => {
  let scrolls = true
  act(() => {
    for (const deltaY of deltaYs) {
      scrolls = box.dispatchEvent(new WheelEvent("wheel", { deltaY, bubbles: true, cancelable: true }))
    }
  })
  return scrolls
}

const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set

const type = (field: HTMLInputElement, text: string) =>
  act(() => {
    valueSetter?.call(field, text)
    field.dispatchEvent(new Event("input", { bubbles: true }))
  })

const press = (field: HTMLInputElement, key: string, keys: Keys = {}) =>
  act(() => field.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...keys })))

const doubleClick = (target: HTMLElement) =>
  act(() => target.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })))

const point = (box: HTMLElement, type: "pointerover" | "pointerout") =>
  act(() => box.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: "mouse" })))

const tip = (box: HTMLElement) =>
  [...box.querySelectorAll("span, kbd")]
    .map((item) => item.textContent)
    .filter((text) => text !== "")
    .join(" ")

const ruler = (box: HTMLElement) => box.nextElementSibling

const urlValue = (key: string) => new URLSearchParams(window.location.hash.split("?")[1]).get(key)

const renderBox = async (param: "a" | "k") => {
  const screen = await render(<ScrubValue id="value" param={param} />)
  const field = toElement(screen.getByRole("textbox")) as HTMLInputElement
  const box = field.parentElement as HTMLElement
  return { field, box }
}

describe("dragging the value box", () => {
  it("moves a shift 0.02 per px and writes the URL on letting go", async () => {
    const { field, box } = await renderBox("k")
    await expect.element(field).toHaveValue("0.00")

    down(box, 100)
    move(box, 101)
    expect(field).toHaveValue("0.00")

    move(box, 130)
    expect(field).toHaveValue("0.60")
    expect(urlValue("k")).toBeNull()
    expect(selectionMayStart()).toBe(false)

    up(box, 150)
    expect(field).toHaveValue("1.00")
    await expect.poll(() => urlValue("k")).toBe("1")
    expect(selectionMayStart()).toBe(true)
  })

  it("multiplies a scale, and stops it at 0.01 short of 0", async () => {
    await updateLocationHash("#?a=2")
    const { field, box } = await renderBox("a")
    await expect.element(field).toHaveValue("2.00")

    down(box, 1000)
    move(box, 1347)
    expect(field).toHaveValue("4.00")

    move(box, -2000)
    expect(field).toHaveValue("0.01")
    up(box, -2000)
    await expect.poll(() => urlValue("a")).toBe("0.01")
  })

  it("moves a tenth as fast with Shift, to a third decimal, and holds still when Shift is let go", async () => {
    const { field, box } = await renderBox("k")
    await expect.element(field).toHaveValue("0.00")

    down(box, 100, { shiftKey: true })
    move(box, 130, { shiftKey: true })
    expect(field).toHaveValue("0.060")

    move(box, 133, { shiftKey: true })
    expect(field).toHaveValue("0.066")

    modifier("keyup", "Shift", {})
    expect(field).toHaveValue("0.066")

    move(box, 143)
    expect(field).toHaveValue("0.27")
    up(box, 143)
    await expect.poll(() => urlValue("k")).toBe("0.27")
  })

  it("snaps a shift to a whole number as soon as Ctrl is pressed", async () => {
    const { field, box } = await renderBox("k")
    await expect.element(field).toHaveValue("0.00")

    down(box, 100)
    move(box, 130)
    expect(field).toHaveValue("0.60")

    modifier("keydown", "Control", { ctrlKey: true })
    expect(field).toHaveValue("1.00")

    move(box, 160, { ctrlKey: true })
    expect(field).toHaveValue("1.00")
    move(box, 180, { ctrlKey: true })
    expect(field).toHaveValue("2.00")
    up(box, 180, { ctrlKey: true })
    await expect.poll(() => urlValue("k")).toBe("2")
  })

  it("snaps a scale to a quarter with ⌘", async () => {
    const { field, box } = await renderBox("a")
    await expect.element(field).toHaveValue("1.00")

    down(box, 100, { metaKey: true })
    move(box, 200, { metaKey: true })
    expect(field).toHaveValue("1.25")
    up(box, 200, { metaKey: true })
    await expect.poll(() => urlValue("a")).toBe("1.25")
  })

  it("ends when the window loses focus", async () => {
    const { field, box } = await renderBox("k")
    await expect.element(field).toHaveValue("0.00")

    down(box, 100)
    move(box, 150)
    expect(field).toHaveValue("1.00")

    act(() => window.dispatchEvent(new Event("blur")))
    await expect.poll(() => urlValue("k")).toBe("1")

    move(box, 200)
    expect(field).toHaveValue("1.00")
  })

  it("shows the ruler while the drag holds the value", async () => {
    const { field, box } = await renderBox("k")
    await expect.element(field).toHaveValue("0.00")
    expect(ruler(box)).toBeNull()

    down(box, 100)
    move(box, 101)
    expect(ruler(box)).toBeNull()

    move(box, 130)
    expect(ruler(box)).not.toBeNull()

    up(box, 130)
    expect(ruler(box)).toBeNull()
  })

  it("opens the box for typing on a click that doesn't drag", async () => {
    const { field, box } = await renderBox("k")
    await expect.element(field).toHaveValue("0.00")

    down(box, 100)
    move(box, 101)
    up(box, 101)
    expect(field).toHaveValue("0.00")
    expect(document.activeElement).toBe(field)
    expect([field.selectionStart, field.selectionEnd]).toEqual([0, 4])

    down(box, 100)
    move(box, 200)
    expect(field).toHaveValue("0.00")
  })
})

describe("the wheel over the value box", () => {
  it("moves a shift as a 15 px drag per notch, and scrolls the page while typing", async () => {
    const { field, box } = await renderBox("k")
    await expect.element(field).toHaveValue("0.00")

    expect(wheel(box, -100)).toBe(false)
    expect(field).toHaveValue("0.30")

    wheel(box, -100, -100)
    expect(field).toHaveValue("0.90")
    await expect.poll(() => urlValue("k")).toBe("0.9")

    act(() => field.focus())
    expect(wheel(box, -100)).toBe(true)
    expect(field).toHaveValue("0.90")
  })
})

describe("arrow keys in the value box", () => {
  it("nudge a shift 0.1 from the text typed so far, and 0.01 with Shift", async () => {
    const { field } = await renderBox("k")
    await expect.element(field).toHaveValue("0.00")

    act(() => field.focus())
    type(field, "2.5")
    press(field, "ArrowUp")
    expect(field).toHaveValue("2.60")

    press(field, "ArrowUp", { shiftKey: true })
    expect(field).toHaveValue("2.61")
    await expect.poll(() => urlValue("k")).toBe("2.61")
  })

  it("nudge a scale's size and stop it at 0.01", async () => {
    await updateLocationHash("#?a=-0.05")
    const { field } = await renderBox("a")
    await expect.element(field).toHaveValue("-0.05")

    act(() => field.focus())
    press(field, "ArrowDown", { shiftKey: true })
    expect(field).toHaveValue("-0.04")

    press(field, "ArrowDown")
    expect(field).toHaveValue("-0.01")

    press(field, "ArrowUp", { shiftKey: true })
    expect(field).toHaveValue("-0.02")
  })
})

describe("Esc in the value box", () => {
  it("puts back the value from before the box opened, over nudges and typed text, and closes the box", async () => {
    await updateLocationHash("#?k=2")
    const { field, box } = await renderBox("k")
    await expect.element(field).toHaveValue("2.00")

    down(box, 100)
    up(box, 100)
    type(field, "5")
    press(field, "ArrowUp")
    expect(field).toHaveValue("5.10")
    await expect.poll(() => urlValue("k")).toBe("5.1")

    type(field, "7")
    expect(field).toHaveValue("7")

    press(field, "Escape")
    expect(field).toHaveValue("2.00")
    expect(document.activeElement).not.toBe(field)
    await expect.poll(() => urlValue("k")).toBe("2")
  })
})

describe("double-clicking the value box", () => {
  it("puts a shift back to 0 and closes the box", async () => {
    await updateLocationHash("#?k=2")
    const { field, box } = await renderBox("k")
    await expect.element(field).toHaveValue("2.00")

    down(box, 100)
    up(box, 100)
    expect(document.activeElement).toBe(field)

    down(field, 100)
    up(field, 100)
    doubleClick(field)
    expect(field).toHaveValue("0.00")
    expect(document.activeElement).not.toBe(field)
    await expect.poll(() => urlValue("k")).toBeNull()
  })

  it("puts a scale back to 1 over text typed into it", async () => {
    await updateLocationHash("#?a=2")
    const { field, box } = await renderBox("a")
    await expect.element(field).toHaveValue("2.00")

    down(box, 100)
    up(box, 100)
    type(field, "3")
    expect(field).toHaveValue("3")

    down(field, 100)
    up(field, 100)
    down(field, 100)
    up(field, 100)
    expect(field).toHaveValue("3")
    doubleClick(field)
    expect(field).toHaveValue("1.00")
    await expect.poll(() => urlValue("a")).toBeNull()
  })
})

describe("the tip on the value box", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows how to drag once a mouse rests on the box, and the keys while the box is typed into", async () => {
    const { field, box } = await renderBox("k")
    await expect.element(field).toHaveValue("0.00")
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
    expect(tip(box)).toBe("")

    point(box, "pointerover")
    act(() => vi.advanceTimersByTime(300))
    point(box, "pointerout")
    act(() => vi.advanceTimersByTime(300))
    expect(tip(box)).toBe("")

    point(box, "pointerover")
    act(() => vi.advanceTimersByTime(399))
    expect(tip(box)).toBe("")
    act(() => vi.advanceTimersByTime(1))
    expect(tip(box)).toBe("Drag sideways · Shift for fine · double-click: back to 0")

    down(box, 100)
    expect(tip(box)).toBe("")
    up(box, 100)
    expect(document.activeElement).toBe(field)
    expect(tip(box)).toBe("Enter apply · Esc cancel · nudge 0.1")

    press(field, "Escape")
    expect(tip(box)).toBe("")
  })
})
