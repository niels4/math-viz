import { afterEach, describe, expect, it, vi } from "vitest"

import { act, render, selectionMayStart, toElement, updateLocationHash } from "#test"

import { ScrubValue } from "./ScrubValue"

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

// The browser's word, as the second of two quick clicks lets go, that they
// were a double-click.
const doubleClick = (target: HTMLElement) =>
  act(() => target.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })))

// A mouse moving onto or off the box.
const point = (box: HTMLElement, type: "pointerover" | "pointerout") =>
  act(() => box.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: "mouse" })))

// The words of the box's tip, empty while it shows none.
const tip = (box: HTMLElement) => [...box.querySelectorAll("span")].map((word) => word.textContent).join(" ")

// The ruler after the box, null while it shows none.
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
    // A fresh page shows k at 0.00.
    const { field, box } = await renderBox("k")
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
    const { field, box } = await renderBox("a")
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
    const { field, box } = await renderBox("k")
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
    const { field, box } = await renderBox("k")
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
    const { field, box } = await renderBox("a")
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
    const { field, box } = await renderBox("k")
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

  it("shows the ruler while the drag holds the value", async () => {
    // A fresh page shows k's box with no ruler.
    const { field, box } = await renderBox("k")
    await expect.element(field).toHaveValue("0.00")
    expect(ruler(box)).toBeNull()

    // Pressing and twitching 1 px shows none.
    down(box, 100)
    move(box, 101)
    expect(ruler(box)).toBeNull()

    // Dragging 30 px right shows it.
    move(box, 130)
    expect(ruler(box)).not.toBeNull()

    // Letting go takes it away.
    up(box, 130)
    expect(ruler(box)).toBeNull()
  })

  it("opens the box for typing on a click that doesn't drag", async () => {
    // A fresh page shows k at 0.00.
    const { field, box } = await renderBox("k")
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

describe("the wheel over the value box", () => {
  it("moves a shift as a 15 px drag per notch, and scrolls the page while typing", async () => {
    // A fresh page shows k at 0.00.
    const { field, box } = await renderBox("k")
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

describe("arrow keys in the value box", () => {
  it("nudge a shift from the text typed so far", async () => {
    // A fresh page shows k at 0.00.
    const { field } = await renderBox("k")
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
    const { field } = await renderBox("a")
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

describe("double-clicking the value box", () => {
  it("puts a shift back to 0 and closes the box", async () => {
    // A link with k=2 shows 2.00.
    await updateLocationHash("#?k=2")
    const { field, box } = await renderBox("k")
    await expect.element(field).toHaveValue("2.00")

    // The first click opens the box for typing.
    down(box, 100)
    up(box, 100)
    expect(document.activeElement).toBe(field)

    // The second click lands on the open field. As it lets go, the box
    // shows 0.00, closes and takes k out of the URL.
    down(field, 100)
    up(field, 100)
    doubleClick(field)
    expect(field).toHaveValue("0.00")
    expect(document.activeElement).not.toBe(field)
    await expect.poll(() => urlValue("k")).toBeNull()
  })

  it("puts a scale back to 1 over text typed into it", async () => {
    // A link with a=2 shows 2.00.
    await updateLocationHash("#?a=2")
    const { field, box } = await renderBox("a")
    await expect.element(field).toHaveValue("2.00")

    // A click opens the box, and typing 3 shows it.
    down(box, 100)
    up(box, 100)
    type(field, "3")
    expect(field).toHaveValue("3")

    // A double-click on the text shows 1.00, not 3, and takes a out of the
    // URL.
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

  it("shows how to drag once a mouse rests on the box, until it presses", async () => {
    // A fresh page shows k's box with no tip.
    const { field, box } = await renderBox("k")
    await expect.element(field).toHaveValue("0.00")
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
    expect(tip(box)).toBe("")

    // A mouse passing over for 300 ms shows nothing.
    point(box, "pointerover")
    act(() => vi.advanceTimersByTime(300))
    point(box, "pointerout")
    act(() => vi.advanceTimersByTime(300))
    expect(tip(box)).toBe("")

    // Coming back and resting 400 ms shows the tip.
    point(box, "pointerover")
    act(() => vi.advanceTimersByTime(399))
    expect(tip(box)).toBe("")
    act(() => vi.advanceTimersByTime(1))
    expect(tip(box)).toBe("Drag sideways · Shift for fine · double-click: back to 0")

    // Pressing the box hides it, and letting go opens the box for typing
    // with no tip.
    down(box, 100)
    expect(tip(box)).toBe("")
    up(box, 100)
    expect(document.activeElement).toBe(field)
    expect(tip(box)).toBe("")
  })
})
