import { getDefaultStore } from "jotai"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { act, render, toElement, updateLocationHash } from "#test"

import { planeSizeAtom } from "../../../CartesianPlane/state"
import { PRow } from "./PRow"

// A 500 × 400 px plane at the default camera shows y from -4 to 4.
beforeEach(() => {
  getDefaultStore().set(planeSizeAtom, { width: 500, height: 400 })
})

afterEach(async () => {
  getDefaultStore().set(planeSizeAtom, { width: 0, height: 0 })
  await updateLocationHash("")
})

const renderRow = async (hash = "") => {
  await updateLocationHash(hash)
  const screen = await render(<PRow />)
  const slider = toElement(screen.getByRole("slider", { name: "x of P" }))
  const field = toElement(screen.getByLabelText("x of P, value")) as HTMLInputElement
  const row = slider.parentElement as HTMLElement
  const tip = () =>
    [...row.querySelectorAll(":scope > [aria-hidden] :is(span, kbd)")]
      .map((item) => item.textContent)
      .filter((text) => text !== "")
      .join(" ")
  return { slider, field, row, tip }
}

const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set

const type = (field: HTMLInputElement, text: string) =>
  act(() => {
    valueSetter?.call(field, text)
    field.dispatchEvent(new Event("input", { bubbles: true }))
  })

const press = (el: HTMLElement, key: string) =>
  act(() => el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true })))

const urlValue = (key: string) => new URLSearchParams(window.location.hash.split("?")[1]).get(key)

describe("P's head row", () => {
  it("reads f(P) through the picked function and transform", async () => {
    const { field, row } = await renderRow("#?func=x2&p=1.5&k=-1")
    expect(row.textContent).toContain("pinned")
    expect(field).toHaveValue("1.50")
    expect(row.textContent).toContain("f() = 1.25")
  })

  it("says ≈ when two decimals round f(P)", async () => {
    const { row } = await renderRow("#?func=sinx&p=1")
    expect(row.textContent).toContain("≈ 0.84")
  })

  it("says when f(P) lies above the view", async () => {
    const { row } = await renderRow("#?func=x2&p=3")
    expect(row.textContent).toContain("above the view")
    expect(row.textContent).not.toContain("pinned")
  })

  it("says when f(P) lies below the view, with a true minus", async () => {
    const { field, row } = await renderRow("#?p=-5")
    expect(row.textContent).toContain("below the view")
    expect(field).toHaveValue("−5.00")
    expect(row.textContent).toContain("= −5.00")
  })
})

describe("typing P's x", () => {
  it("opens from Enter on the slider, applies on Enter and hands the focus back", async () => {
    const { slider, field, tip } = await renderRow()
    act(() => slider.focus())

    press(slider, "Enter")
    expect(document.activeElement).toBe(field)
    expect(field).toHaveAttribute("data-editing")
    expect([field.selectionStart, field.selectionEnd]).toEqual([0, 4])
    expect(tip()).toBe("Enter apply · nudge 0.01")

    type(field, "−1.5")
    press(field, "Enter")
    expect(slider).toHaveAttribute("aria-valuenow", "-1.5")
    expect(field).toHaveValue("−1.50")
    expect(field).not.toHaveAttribute("data-editing")
    expect(urlValue("p")).toBe("-1.5")
    expect(document.activeElement).toBe(slider)
    expect(tip()).toBe("")
  })

  it("keeps refused text open, and puts the value back on Esc", async () => {
    const { slider, field, tip } = await renderRow()
    act(() => field.focus())

    type(field, "abc")
    press(field, "Enter")
    expect(document.activeElement).toBe(field)
    expect(field).toHaveAttribute("aria-invalid", "true")
    expect(tip()).toBe("Type a number such as 1.5 · Esc puts back 2.00")

    type(field, "3")
    expect(field).not.toHaveAttribute("aria-invalid")

    press(field, "Escape")
    expect(field).toHaveValue("2.00")
    expect(slider).toHaveAttribute("aria-valuenow", "2")
    expect(document.activeElement).toBe(slider)
  })

  it("nudges 0.01 with the arrow keys at once, and Esc undoes the nudges", async () => {
    const { slider, field } = await renderRow()
    act(() => field.focus())

    press(field, "ArrowUp")
    press(field, "ArrowUp")
    expect(field).toHaveValue("2.02")
    expect(slider).toHaveAttribute("aria-valuenow", "2.02")

    press(field, "ArrowDown")
    expect(slider).toHaveAttribute("aria-valuenow", "2.01")

    press(field, "Escape")
    expect(slider).toHaveAttribute("aria-valuenow", "2")
    expect(urlValue("p")).toBeNull()
  })

  it("applies a number on leaving, and puts the value back when the text isn't one", async () => {
    const { slider, field } = await renderRow()

    act(() => field.focus())
    type(field, "3.256")
    act(() => field.blur())
    expect(slider).toHaveAttribute("aria-valuenow", "3.256")
    expect(field).toHaveValue("3.26")
    expect(urlValue("p")).toBe("3.256")

    act(() => field.focus())
    type(field, "1..2")
    act(() => field.blur())
    expect(slider).toHaveAttribute("aria-valuenow", "3.256")
    expect(document.activeElement).not.toBe(slider)
  })
})
