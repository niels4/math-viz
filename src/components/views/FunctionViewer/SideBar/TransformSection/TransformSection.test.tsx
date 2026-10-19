import { afterEach, describe, expect, it } from "vitest"

import { act, render, toElement, updateLocationHash } from "#test"

import { TransformSection } from "./TransformSection"

afterEach(async () => {
  await updateLocationHash("")
})

const urlValue = (key: string) => new URLSearchParams(window.location.hash.split("?")[1]).get(key)

describe("the Transform card's Reset all", () => {
  it("shows while any value is off its default, and puts every default back", async () => {
    await updateLocationHash("#?a=2&h=3")
    const screen = await render(<TransformSection />)
    const a = toElement(screen.getByLabelText("y scale", { exact: true }))
    const h = toElement(screen.getByLabelText("x shift", { exact: true }))
    await expect.element(a).toHaveValue("2.00")
    expect(h).toHaveValue("3.00")
    const resetAll = toElement(screen.getByRole("button", { name: "Reset all" }))

    act(() => resetAll.dispatchEvent(new MouseEvent("click", { bubbles: true })))
    expect(a).toHaveValue("1.00")
    expect(h).toHaveValue("0.00")
    await expect.poll(() => [urlValue("a"), urlValue("h")]).toEqual([null, null])
    expect(resetAll.isConnected).toBe(false)
  })
})

describe("the Transform card's flip buttons", () => {
  it("show on the two scale rows only", async () => {
    const screen = await render(<TransformSection />)
    const a = toElement(screen.getByLabelText("y scale", { exact: true }))
    await expect.element(a).toHaveValue("1.00")

    const flips = [...(a.closest("section")?.querySelectorAll("[aria-pressed]") ?? [])]
    expect(
      flips.map((f) => [f.closest("[data-param]")?.getAttribute("data-param"), f.getAttribute("aria-label")]),
    ).toEqual([
      ["a", "Flip upside down"],
      ["b", "Mirror left to right"],
    ])
  })
})
