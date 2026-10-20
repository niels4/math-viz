import { getDefaultStore } from "jotai"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { act, render, selectionMayStart, toElement, updateLocationHash } from "#test"

import { centerParam, scaleParam } from "../../../CartesianPlane/queryParams"
import { planeSizeAtom } from "../../../CartesianPlane/state"
import { PointSlider } from "./PointSlider"

// A 500 px plane at the default camera shows x from -5 to 5; the track's
// 218 px leave a 200 px run between its 9 px insets, 20 px per unit.
beforeEach(() => {
  getDefaultStore().set(planeSizeAtom, { width: 500, height: 400 })
})

afterEach(async () => {
  const store = getDefaultStore()
  store.set(planeSizeAtom, { width: 0, height: 0 })
  store.set(centerParam.atom, centerParam.defaultValue)
  store.set(scaleParam.atom, scaleParam.defaultValue)
  await updateLocationHash("")
})

const pointer = (type: string, track: HTMLElement, clientX: number) =>
  act(() =>
    track.dispatchEvent(
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

const press = (track: HTMLElement, key: string, shiftKey = false) =>
  act(() => track.dispatchEvent(new KeyboardEvent("keydown", { key, shiftKey, bubbles: true })))

const urlValue = (key: string) => new URLSearchParams(window.location.hash.split("?")[1]).get(key)

const renderSlider = async () => {
  const screen = await render(<PointSlider onEditRequest={() => {}} />)
  const track = toElement(screen.getByRole("slider", { name: "x of P" }))
  vi.spyOn(track, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 218, 20))
  return track
}

const valueOf = (track: HTMLElement) => Number(track.getAttribute("aria-valuenow"))

describe("the P slider", () => {
  it("spans the plane's visible x-range, and follows the camera", async () => {
    const track = await renderSlider()
    expect(track).toHaveAttribute("aria-valuemin", "-5")
    expect(track).toHaveAttribute("aria-valuemax", "5")

    act(() => getDefaultStore().set(scaleParam.atom, 1))
    expect(track).toHaveAttribute("aria-valuemin", "-10")
    expect(track).toHaveAttribute("aria-valuemax", "10")

    act(() => getDefaultStore().set(centerParam.atom, [3, 0]))
    expect(track).toHaveAttribute("aria-valuemin", "-7")
    expect(track).toHaveAttribute("aria-valuemax", "13")
  })

  it("jumps P to the pointer, follows the drag, and writes the URL on letting go", async () => {
    const track = await renderSlider()
    expect(valueOf(track)).toBe(2)

    pointer("pointerdown", track, 169)
    expect(valueOf(track)).toBe(3)
    expect(selectionMayStart()).toBe(false)

    pointer("pointermove", track, 59)
    expect(valueOf(track)).toBe(-2.5)
    expect(urlValue("p")).toBeNull()

    pointer("pointermove", track, -400)
    expect(valueOf(track)).toBe(-5)

    pointer("pointerup", track, -400)
    expect(urlValue("p")).toBe("-5")
    expect(selectionMayStart()).toBe(true)
  })

  it("steps 0.1 with the arrow keys and 1 with Shift", async () => {
    const track = await renderSlider()

    press(track, "ArrowRight")
    expect(valueOf(track)).toBe(2.1)

    press(track, "ArrowDown", true)
    expect(valueOf(track)).toBe(1.1)
    await expect.poll(() => urlValue("p")).toBe("1.1")
  })

  it("jumps to the ends of the visible range with Home and End", async () => {
    act(() => getDefaultStore().set(centerParam.atom, [0.123, 0]))
    const track = await renderSlider()

    press(track, "Home")
    expect(valueOf(track)).toBe(-4.87)

    press(track, "End")
    expect(valueOf(track)).toBe(5.12)
    await expect.poll(() => urlValue("p")).toBe("5.12")
  })

  it("parks the thumb on the end P lies past", async () => {
    await updateLocationHash("#?p=8")
    const track = await renderSlider()
    expect(track).toHaveAttribute("data-parked", "right")

    act(() => getDefaultStore().set(scaleParam.atom, 1))
    expect(track).not.toHaveAttribute("data-parked")
  })
})
