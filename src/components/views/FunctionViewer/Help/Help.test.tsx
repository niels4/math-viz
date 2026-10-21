import { getDefaultStore } from "jotai"
import { afterEach, describe, expect, it } from "vitest"

import { act, render, toElement, updateLocationHash } from "#test"

import { FunctionViewer } from "../FunctionViewer"
import { helpShownAtom } from "../state"

afterEach(async () => {
  getDefaultStore().set(helpShownAtom, false)
  await updateLocationHash("")
})

describe("the Show Help button", () => {
  it("shows the hello card, looking pressed, until it is clicked again", async () => {
    const screen = await render(<FunctionViewer />)
    const button = screen.getByRole("button", { name: "Show Help" })
    await expect.element(button).toHaveAttribute("aria-pressed", "false")
    expect(document.body.textContent).not.toContain("Hello")

    await button.click()
    await expect.element(button).toHaveAttribute("aria-pressed", "true")
    await expect.element(screen.getByText("Hello")).toBeVisible()

    await button.click()
    await expect.element(button).toHaveAttribute("aria-pressed", "false")
    expect(document.body.textContent).not.toContain("Hello")
  })

  it("hides the hello card at a press or a key anywhere else", async () => {
    const screen = await render(<FunctionViewer />)
    const button = screen.getByRole("button", { name: "Show Help" })
    const box = toElement(screen.getByLabelText("y scale", { exact: true }))

    await button.click()
    await expect.element(screen.getByText("Hello")).toBeVisible()

    act(() => box.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, button: 0, bubbles: true })))
    await expect.element(button).toHaveAttribute("aria-pressed", "false")
    expect(document.body.textContent).not.toContain("Hello")

    await button.click()
    await expect.element(screen.getByText("Hello")).toBeVisible()

    act(() => box.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true })))
    await expect.element(button).toHaveAttribute("aria-pressed", "false")
    expect(document.body.textContent).not.toContain("Hello")
  })
})
