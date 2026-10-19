import { afterEach, describe, expect, it } from "vitest"

import { act, render, toElement, updateLocationHash } from "#test"

import { SideBar } from "./SideBar"

afterEach(async () => {
  await updateLocationHash("")
})

describe("the function selector", () => {
  it("puts the picked function in the URL, and leaves x out of it", async () => {
    const screen = await render(<SideBar />)
    await expect.element(screen.getByLabelText("x", { exact: true })).toBeChecked()

    await screen.getByLabelText("x²").click()
    await expect.element(screen.getByLabelText("x²")).toBeChecked()
    expect(window.location.hash).toContain("func=x2")

    await screen.getByLabelText("x", { exact: true }).click()
    await expect.element(screen.getByLabelText("x", { exact: true })).toBeChecked()
    expect(window.location.hash).not.toContain("func")
  })

  it("checks the function a link names", async () => {
    await updateLocationHash("#?func=sinx")
    const screen = await render(<SideBar />)
    await expect.element(screen.getByLabelText("sin x")).toBeChecked()
    expect(toElement(screen.getByLabelText("x²"))).not.toBeChecked()
  })
})

describe("the transform card", () => {
  it("shows each parameter a link sets in its own row", async () => {
    await updateLocationHash("#?a=2&k=-1&b=0.5&h=3")
    const screen = await render(<SideBar />)

    await expect.element(screen.getByLabelText("y scale")).toHaveValue("2.00")
    await expect.element(screen.getByLabelText("y shift")).toHaveValue("-1.00")
    await expect.element(screen.getByLabelText("x scale")).toHaveValue("0.50")
    await expect.element(screen.getByLabelText("x shift")).toHaveValue("3.00")
  })
})

const point = (el: HTMLElement, type: "pointerover" | "pointerout") =>
  act(() => el.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: "mouse" })))

describe("highlighting a parameter", () => {
  it("lights a's row and a in the form together, from either one", async () => {
    const screen = await render(<SideBar />)
    const row = toElement(screen.getByLabelText("y scale")).closest<HTMLElement>("[data-param]")
    const form = toElement(screen.getByTestId("function-form"))
    const term = toElement(form.querySelector('[data-param="a"]'))
    const lit = (el: HTMLElement | null) => el?.hasAttribute("data-lit")
    expect(lit(row)).toBe(false)
    expect(lit(term)).toBe(false)

    point(toElement(row), "pointerover")
    expect(lit(row)).toBe(true)
    expect(lit(term)).toBe(true)

    point(toElement(row), "pointerout")
    expect(lit(row)).toBe(false)
    expect(lit(term)).toBe(false)

    point(term, "pointerover")
    expect(lit(row)).toBe(true)
    point(term, "pointerout")
    expect(lit(row)).toBe(false)
  })

  it("keeps a lit while its box has the focus, after the pointer leaves", async () => {
    const screen = await render(<SideBar />)
    const box = toElement(screen.getByLabelText("y scale"))
    const row = box.closest<HTMLElement>("[data-param]")
    const form = toElement(screen.getByTestId("function-form"))
    const term = toElement(form.querySelector('[data-param="a"]'))
    const lit = (el: HTMLElement | null) => el?.hasAttribute("data-lit")
    expect(lit(row)).toBe(false)

    act(() => box.focus())
    expect(lit(row)).toBe(true)
    expect(lit(term)).toBe(true)

    point(toElement(row), "pointerover")
    point(toElement(row), "pointerout")
    expect(lit(row)).toBe(true)
    expect(lit(term)).toBe(true)

    act(() => box.blur())
    expect(lit(row)).toBe(false)
    expect(lit(term)).toBe(false)
  })

  it("lights only the parameter the pointer or the focus moved to last", async () => {
    const screen = await render(<SideBar />)
    const box = toElement(screen.getByLabelText("y scale"))
    const row = box.closest<HTMLElement>("[data-param]")
    const form = toElement(screen.getByTestId("function-form"))
    const k = toElement(form.querySelector('[data-param="k"]'))
    const lit = (el: HTMLElement | null) => el?.hasAttribute("data-lit")

    act(() => box.focus())
    expect(lit(row)).toBe(true)
    expect(lit(k)).toBe(false)

    point(k, "pointerover")
    expect(lit(k)).toBe(true)
    expect(lit(row)).toBe(false)

    point(k, "pointerout")
    expect(lit(k)).toBe(false)
    expect(lit(row)).toBe(true)
  })
})
