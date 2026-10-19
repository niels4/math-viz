import { afterEach, describe, expect, it } from "vitest"

import { act, render, selectionMayStart, toElement, updateLocationHash } from "#test"

import { TransformRow } from "./TransformRow"

afterEach(async () => {
  await updateLocationHash("")
})

type Keys = { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }

// A mouse on the box at clientX, with any of Shift, Ctrl or ⌘ held. The
// field inside lets presses through to the box until it opens for typing,
// so the events go to the box.
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

// A modifier pressed or let go with the pointer still. The page hears it,
// wherever the focus is.
const modifier = (type: "keydown" | "keyup", key: string, keys: Keys) =>
  act(() => window.dispatchEvent(new KeyboardEvent(type, { key, ...keys })))

// Wheel notches over the box, 100 px of scroll each, up for negative. Says
// whether the page could still scroll.
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

// Text typed into the field. React skips an input event when the field
// holds the value it last rendered, so the text goes in through the
// prototype's setter.
const type = (field: HTMLInputElement, text: string) =>
  act(() => {
    valueSetter?.call(field, text)
    field.dispatchEvent(new Event("input", { bubbles: true }))
  })

const press = (field: HTMLInputElement, key: string, keys: Keys = {}) =>
  act(() => field.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...keys })))

const urlValue = (key: string) => new URLSearchParams(window.location.hash.split("?")[1]).get(key)

const renderRow = async (name: string, param: "a" | "k") => {
  const screen = await render(<TransformRow name={name} param={param} />)
  const field = toElement(screen.getByLabelText(name)) as HTMLInputElement
  const box = field.parentElement as HTMLElement
  return { field, box }
}

describe("dragging a transform row's box", () => {
  it("moves a shift 0.02 per px and writes the URL on letting go", async () => {
    // A fresh page shows k at 0.00.
    const { field, box } = await renderRow("Vertical shift", "k")
    await expect.element(field).toHaveValue("0.00")

    // Pressing and twitching 1 px leaves k alone.
    down(box, 100)
    move(box, 101)
    expect(field).toHaveValue("0.00")

    // Dragging 30 px right shows 0.60, the URL waits, and no text can be
    // selected while the press lasts.
    move(box, 130)
    expect(field).toHaveValue("0.60")
    expect(urlValue("k")).toBeNull()
    expect(selectionMayStart()).toBe(false)

    // Flicking 20 px further and letting go mid-move lands on 1.00 and
    // writes k=1.
    up(box, 150)
    expect(field).toHaveValue("1.00")
    await expect.poll(() => urlValue("k")).toBe("1")
    expect(selectionMayStart()).toBe(true)
  })

  it("multiplies a scale, and stops it at 0.01 short of 0", async () => {
    // A link with a=2 shows 2.00.
    await updateLocationHash("#?a=2")
    const { field, box } = await renderRow("Vertical scale", "a")
    await expect.element(field).toHaveValue("2.00")

    // 347 px right doubles it, as each px grows it 0.2 %.
    down(box, 1000)
    move(box, 1347)
    expect(field).toHaveValue("4.00")

    // Far to the left it shrinks toward 0 but stops at 0.01.
    move(box, -2000)
    expect(field).toHaveValue("0.01")
    up(box, -2000)
    await expect.poll(() => urlValue("a")).toBe("0.01")
  })

  it("moves a tenth as fast with Shift, to a third decimal, and holds still when Shift is let go", async () => {
    // A fresh page shows k at 0.00.
    const { field, box } = await renderRow("Vertical shift", "k")
    await expect.element(field).toHaveValue("0.00")

    // A Shift drag 30 px right reaches 0.06, shown with three decimals so
    // the digits keep their width while it moves.
    down(box, 100, { shiftKey: true })
    move(box, 130, { shiftKey: true })
    expect(field).toHaveValue("0.060")

    // 3 px more adds 0.006.
    move(box, 133, { shiftKey: true })
    expect(field).toHaveValue("0.066")

    // Letting go of Shift leaves 0.066.
    modifier("keyup", "Shift", {})
    expect(field).toHaveValue("0.066")

    // 10 px on without Shift adds 0.2 and lands on 0.01, at 0.27.
    move(box, 143)
    expect(field).toHaveValue("0.27")
    up(box, 143)
    await expect.poll(() => urlValue("k")).toBe("0.27")
  })

  it("snaps a shift to a whole number as soon as Ctrl is pressed", async () => {
    // A fresh page shows k at 0.00.
    const { field, box } = await renderRow("Vertical shift", "k")
    await expect.element(field).toHaveValue("0.00")

    // A drag 30 px right shows 0.60.
    down(box, 100)
    move(box, 130)
    expect(field).toHaveValue("0.60")

    // Pressing Ctrl with the pointer still snaps it to 1.00.
    modifier("keydown", "Control", { ctrlKey: true })
    expect(field).toHaveValue("1.00")

    // Snapping rounds the value the drag would reach: 30 px on, 1.2, stays
    // at 1.00, and 50 px on, 1.6, snaps to 2.00.
    move(box, 160, { ctrlKey: true })
    expect(field).toHaveValue("1.00")
    move(box, 180, { ctrlKey: true })
    expect(field).toHaveValue("2.00")
    up(box, 180, { ctrlKey: true })
    await expect.poll(() => urlValue("k")).toBe("2")
  })

  it("snaps a scale to a quarter with ⌘", async () => {
    // A fresh page shows a at 1.00.
    const { field, box } = await renderRow("Vertical scale", "a")
    await expect.element(field).toHaveValue("1.00")

    // A ⌘ drag 100 px right grows it to 1.22, which snaps to 1.25.
    down(box, 100, { metaKey: true })
    move(box, 200, { metaKey: true })
    expect(field).toHaveValue("1.25")
    up(box, 200, { metaKey: true })
    await expect.poll(() => urlValue("a")).toBe("1.25")
  })

  it("ends when the window loses focus", async () => {
    // A fresh page shows k at 0.00.
    const { field, box } = await renderRow("Vertical shift", "k")
    await expect.element(field).toHaveValue("0.00")

    // A drag 50 px right shows 1.00.
    down(box, 100)
    move(box, 150)
    expect(field).toHaveValue("1.00")

    // Switching to another window ends the drag and writes k=1.
    act(() => window.dispatchEvent(new Event("blur")))
    await expect.poll(() => urlValue("k")).toBe("1")

    // Moves after that change nothing.
    move(box, 200)
    expect(field).toHaveValue("1.00")
  })

  it("opens the box for typing on a click that doesn't drag", async () => {
    // A fresh page shows k at 0.00.
    const { field, box } = await renderRow("Vertical shift", "k")
    await expect.element(field).toHaveValue("0.00")

    // A click that twitches 1 px leaves k alone and selects its text.
    down(box, 100)
    move(box, 101)
    up(box, 101)
    expect(field).toHaveValue("0.00")
    expect(document.activeElement).toBe(field)
    expect([field.selectionStart, field.selectionEnd]).toEqual([0, 4])

    // A press while typing belongs to the text: moving doesn't drag.
    down(box, 100)
    move(box, 200)
    expect(field).toHaveValue("0.00")
  })
})

describe("the wheel over a transform row's box", () => {
  it("moves a shift as a 15 px drag per notch, and scrolls the page while typing", async () => {
    // A fresh page shows k at 0.00.
    const { field, box } = await renderRow("Vertical shift", "k")
    await expect.element(field).toHaveValue("0.00")

    // A notch up adds 0.30, and the page doesn't scroll.
    expect(wheel(box, -100)).toBe(false)
    expect(field).toHaveValue("0.30")

    // Two quick notches add 0.30 each, and the URL follows.
    wheel(box, -100, -100)
    expect(field).toHaveValue("0.90")
    await expect.poll(() => urlValue("k")).toBe("0.9")

    // While typing, a notch scrolls the page and leaves k alone.
    act(() => field.focus())
    expect(wheel(box, -100)).toBe(true)
    expect(field).toHaveValue("0.90")
  })
})

describe("arrow keys in a transform row's box", () => {
  it("nudge a shift from the text typed so far", async () => {
    // A fresh page shows k at 0.00.
    const { field } = await renderRow("Vertical shift", "k")
    await expect.element(field).toHaveValue("0.00")

    // Typing 2.5 and pressing ↑ shows 2.51.
    act(() => field.focus())
    type(field, "2.5")
    press(field, "ArrowUp")
    expect(field).toHaveValue("2.51")

    // Shift+↑ adds 0.1, and the URL follows.
    press(field, "ArrowUp", { shiftKey: true })
    expect(field).toHaveValue("2.61")
    await expect.poll(() => urlValue("k")).toBe("2.61")
  })

  it("nudge a scale's size and stop it at 0.01", async () => {
    // A link with a=-0.05 shows -0.05.
    await updateLocationHash("#?a=-0.05")
    const { field } = await renderRow("Vertical scale", "a")
    await expect.element(field).toHaveValue("-0.05")

    // ↓ shrinks its size to 0.04.
    act(() => field.focus())
    press(field, "ArrowDown")
    expect(field).toHaveValue("-0.04")

    // Shift+↓ would pass 0, so it stops at -0.01.
    press(field, "ArrowDown", { shiftKey: true })
    expect(field).toHaveValue("-0.01")

    // ↑ grows its size to 0.02.
    press(field, "ArrowUp")
    expect(field).toHaveValue("-0.02")
  })
})
