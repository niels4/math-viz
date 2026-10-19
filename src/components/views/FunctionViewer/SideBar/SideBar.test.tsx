import { afterEach, describe, expect, it } from "vitest"

import { act, render, toElement, updateLocationHash } from "#test"

import { SideBar } from "./SideBar"

afterEach(async () => {
  await updateLocationHash("")
})

describe("the function selector", () => {
  it("puts the picked function in the URL, and leaves x out of it", async () => {
    // A fresh page graphs x.
    const screen = await render(<SideBar />)
    await expect.element(screen.getByLabelText("x", { exact: true })).toBeChecked()

    // Picking x² checks it and writes func=x2.
    await screen.getByLabelText("x²").click()
    await expect.element(screen.getByLabelText("x²")).toBeChecked()
    expect(window.location.hash).toContain("func=x2")

    // Picking x again takes func out of the URL.
    await screen.getByLabelText("x", { exact: true }).click()
    await expect.element(screen.getByLabelText("x", { exact: true })).toBeChecked()
    expect(window.location.hash).not.toContain("func")
  })

  it("checks the function a link names", async () => {
    // A link with func=sinx opens on sin x.
    await updateLocationHash("#?func=sinx")
    const screen = await render(<SideBar />)
    await expect.element(screen.getByLabelText("sin x")).toBeChecked()
    expect(toElement(screen.getByLabelText("x²"))).not.toBeChecked()
  })
})

const point = (el: HTMLElement, type: "pointerover" | "pointerout") =>
  act(() => el.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: "mouse" })))

describe("highlighting a parameter", () => {
  it("lights a's row and a in the form together, from either one", async () => {
    // A fresh page shows the row for a and the form with its a.
    const screen = await render(<SideBar />)
    const row = toElement(screen.getByLabelText("Vertical scale")).closest<HTMLElement>("[data-param]")
    const form = toElement(screen.getByTestId("function-form"))
    const term = toElement(form.querySelector('[data-param="a"]'))
    const lit = (el: HTMLElement | null) => el?.hasAttribute("data-lit")
    expect(lit(row)).toBe(false)
    expect(lit(term)).toBe(false)

    // Pointing at the row lights it and the form's a.
    point(toElement(row), "pointerover")
    expect(lit(row)).toBe(true)
    expect(lit(term)).toBe(true)

    // Moving off it puts both out.
    point(toElement(row), "pointerout")
    expect(lit(row)).toBe(false)
    expect(lit(term)).toBe(false)

    // Pointing at the form's a lights the row too.
    point(term, "pointerover")
    expect(lit(row)).toBe(true)
    point(term, "pointerout")
    expect(lit(row)).toBe(false)
  })

  it("keeps a lit while its box has the focus, after the pointer leaves", async () => {
    // A fresh page shows a's row and the form's a unlit.
    const screen = await render(<SideBar />)
    const box = toElement(screen.getByLabelText("Vertical scale"))
    const row = box.closest<HTMLElement>("[data-param]")
    const form = toElement(screen.getByTestId("function-form"))
    const term = toElement(form.querySelector('[data-param="a"]'))
    const lit = (el: HTMLElement | null) => el?.hasAttribute("data-lit")
    expect(lit(row)).toBe(false)

    // Focusing a's box lights its row and the form's a.
    act(() => box.focus())
    expect(lit(row)).toBe(true)
    expect(lit(term)).toBe(true)

    // Pointing at the row and moving off leaves both lit.
    point(toElement(row), "pointerover")
    point(toElement(row), "pointerout")
    expect(lit(row)).toBe(true)
    expect(lit(term)).toBe(true)

    // Leaving the box puts both out.
    act(() => box.blur())
    expect(lit(row)).toBe(false)
    expect(lit(term)).toBe(false)
  })
})
