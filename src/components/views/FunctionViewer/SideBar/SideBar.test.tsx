import { afterEach, describe, expect, it } from "vitest"

import { render, toElement, updateLocationHash } from "#test"

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
