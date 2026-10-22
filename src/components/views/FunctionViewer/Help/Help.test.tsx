import { getDefaultStore } from "jotai"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { act, isBrowser, render, toElement, updateLocationHash } from "#test"

import { FunctionViewer } from "../FunctionViewer"
import { helpShownAtom } from "../state"

const windowSize = async (width: number, height: number) => {
  if (isBrowser()) {
    const { page } = await import("vitest/browser")
    await page.viewport(width, height)
  }
}

beforeEach(async () => {
  await windowSize(1440, 900)
})

afterEach(async () => {
  getDefaultStore().set(helpShownAtom, false)
  await updateLocationHash("")
})

describe("the Show Help button", () => {
  it("shows a tip for each section, looking pressed, until it is clicked again", async () => {
    const screen = await render(<FunctionViewer />)
    const button = screen.getByRole("button", { name: "Show Help" })
    await expect.element(button).toHaveAttribute("aria-pressed", "false")
    expect(document.body.textContent).not.toContain("Pick a function")

    await button.click()
    await expect.element(button).toHaveAttribute("aria-pressed", "true")
    await expect.element(screen.getByText(/^Pick a function/)).toBeVisible()
    await expect.element(screen.getByText(/^These rows stretch and move the curve/)).toBeVisible()
    await expect.element(screen.getByText(/^P sits on the curve/)).toBeVisible()

    await button.click()
    await expect.element(button).toHaveAttribute("aria-pressed", "false")
    expect(document.body.textContent).not.toContain("Pick a function")
    expect(document.body.textContent).not.toContain("These rows stretch")
    expect(document.body.textContent).not.toContain("P sits on the curve")
  })

  it("hides the Function tip at a press or a key anywhere else", async () => {
    const screen = await render(<FunctionViewer />)
    const button = screen.getByRole("button", { name: "Show Help" })
    const box = toElement(screen.getByLabelText("y scale", { exact: true }))

    await button.click()
    await expect.element(screen.getByText(/^Pick a function/)).toBeVisible()

    act(() => box.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, button: 0, bubbles: true })))
    await expect.element(button).toHaveAttribute("aria-pressed", "false")
    expect(document.body.textContent).not.toContain("Pick a function")

    await button.click()
    await expect.element(screen.getByText(/^Pick a function/)).toBeVisible()

    act(() => box.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true })))
    await expect.element(button).toHaveAttribute("aria-pressed", "false")
    expect(document.body.textContent).not.toContain("Pick a function")
  })

  it.runIf(isBrowser())("is left out of the top bar in a phone-wide window", async () => {
    await windowSize(390, 844)
    const screen = await render(<FunctionViewer />)

    await expect.element(screen.getByRole("button", { name: "Settings" })).toBeVisible()
    await expect.element(screen.getByText("Show Help")).not.toBeVisible()
  })
})
