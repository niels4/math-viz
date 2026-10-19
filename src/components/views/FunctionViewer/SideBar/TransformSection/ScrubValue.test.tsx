import { afterEach, describe, expect, it } from "vitest"

import { act, render, selectionMayStart, toElement, updateLocationHash } from "#test"

import { TransformRow } from "./TransformRow"

afterEach(async () => {
  await updateLocationHash("")
})

// A mouse on the box at clientX. The field inside lets presses through to
// the box until it opens for typing, so the events go to the box.
const pointer = (type: string, box: HTMLElement, clientX: number) =>
  act(() =>
    box.dispatchEvent(
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
const down = (box: HTMLElement, clientX: number) => pointer("pointerdown", box, clientX)
const move = (box: HTMLElement, clientX: number) => pointer("pointermove", box, clientX)
const up = (box: HTMLElement, clientX: number) => pointer("pointerup", box, clientX)

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
