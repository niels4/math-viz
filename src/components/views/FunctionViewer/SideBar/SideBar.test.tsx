import { getDefaultStore } from "jotai"
import { afterEach, describe, expect, it } from "vitest"

import { act, render, toElement, updateLocationHash } from "#test"

import { hoverAtom, scrubModeAtoms, type TransformParam } from "../state"
import { SideBar } from "./SideBar"

afterEach(async () => {
  await updateLocationHash("")
})

describe("the function selector", () => {
  it("puts the picked function in the URL, and leaves x² out of it", async () => {
    const screen = await render(<SideBar />)
    await expect.element(screen.getByLabelText("x²")).toBeChecked()

    await screen.getByLabelText("x", { exact: true }).click()
    await expect.element(screen.getByLabelText("x", { exact: true })).toBeChecked()
    expect(window.location.hash).toContain("func=x1")

    await screen.getByLabelText("x²").click()
    await expect.element(screen.getByLabelText("x²")).toBeChecked()
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

describe("the points card", () => {
  it("shows its title", async () => {
    const screen = await render(<SideBar />)
    await expect.element(screen.getByRole("region", { name: "Points" })).toBeVisible()
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

  it("lights h and k together with both rulers out while the shift handle is dragged on the plane", async () => {
    const screen = await render(<SideBar />)
    const boxOf = (name: string) => toElement(screen.getByLabelText(name)).parentElement as HTMLElement
    const [hBox, kBox, aBox] = [boxOf("x shift"), boxOf("y shift"), boxOf("y scale")]
    const form = toElement(screen.getByTestId("function-form"))
    const term = (param: string) => toElement(form.querySelector(`[data-param="${param}"]`))
    const lit = (el: HTMLElement | null) => el?.hasAttribute("data-lit")
    const ruler = (box: HTMLElement) => box.nextElementSibling
    const hold = (mode: "coarse" | null) =>
      act(() => {
        getDefaultStore().set(scrubModeAtoms.h, mode)
        getDefaultStore().set(scrubModeAtoms.k, mode)
      })

    hold("coarse")
    expect(lit(hBox.closest("[data-param]"))).toBe(true)
    expect(lit(kBox.closest("[data-param]"))).toBe(true)
    expect(lit(term("h"))).toBe(true)
    expect(lit(term("k"))).toBe(true)
    expect(ruler(hBox)).not.toBeNull()
    expect(ruler(kBox)).not.toBeNull()
    expect(lit(aBox.closest("[data-param]"))).toBe(false)
    expect(ruler(aBox)).toBeNull()

    hold(null)
    expect(lit(hBox.closest("[data-param]"))).toBe(false)
    expect(lit(term("k"))).toBe(false)
    expect(ruler(hBox)).toBeNull()
    expect(ruler(kBox)).toBeNull()
  })

  it("lights h and k with the pointer on the shift handle, then a and b once it moves straight onto the scale handle", async () => {
    const screen = await render(<SideBar />)
    const row = (name: string) => toElement(screen.getByLabelText(name)).closest<HTMLElement>("[data-param]")
    const form = toElement(screen.getByTestId("function-form"))
    const term = (param: string) => toElement(form.querySelector(`[data-param="${param}"]`))
    const lit = (el: HTMLElement | null) => el?.hasAttribute("data-lit")
    const ruler = (name: string) => toElement(screen.getByLabelText(name)).parentElement?.nextElementSibling
    const hover = (params: TransformParam[], on: boolean) =>
      act(() => getDefaultStore().set(hoverAtom, params, on))

    hover(["h", "k"], true)
    expect(lit(row("x shift"))).toBe(true)
    expect(lit(row("y shift"))).toBe(true)
    expect(lit(term("h"))).toBe(true)
    expect(lit(term("k"))).toBe(true)
    expect(lit(row("y scale"))).toBe(false)
    expect(ruler("x shift")).toBeNull()
    expect(ruler("y shift")).toBeNull()

    hover(["a", "b"], true)
    hover(["h", "k"], false)
    expect(lit(row("x scale"))).toBe(true)
    expect(lit(term("b"))).toBe(true)
    expect(lit(row("x shift"))).toBe(false)
    expect(lit(term("k"))).toBe(false)

    hover(["a", "b"], false)
    expect(lit(row("x scale"))).toBe(false)
    expect(lit(term("b"))).toBe(false)
  })
})
