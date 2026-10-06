import { describe, expect, it } from "vitest"

import { act, render, toElement } from "#test"

import { HelpTip } from "./HelpTip"

const tooltip = (): HTMLElement | null => document.querySelector('[role="tooltip"]')

const help = {
  title: "Scrub the offset",
  rows: [
    { keys: "drag", text: "scrub" },
    { keys: "Shift drag", text: "fine control" },
  ],
}

const renderButton = async () => {
  const screen = await render(<HelpTip help={help} />)
  return toElement(screen.getByRole("button", { name: "Help" })) as HTMLButtonElement
}

describe("HelpTip", () => {
  it("starts closed", async () => {
    const button = await renderButton()
    expect(button.getAttribute("aria-expanded")).toBe("false")
    expect(tooltip()).toBeNull()
  })

  it("click pins it open and a second click closes", async () => {
    const button = await renderButton()
    act(() => {
      button.click()
    })
    expect(button.getAttribute("aria-expanded")).toBe("true")
    expect(tooltip()?.textContent).toContain("Scrub the offset")
    act(() => {
      button.click()
    })
    expect(button.getAttribute("aria-expanded")).toBe("false")
    expect(tooltip()).toBeNull()
  })

  it("Escape closes", async () => {
    const button = await renderButton()
    act(() => {
      button.click()
    })
    expect(tooltip()).not.toBeNull()
    act(() => {
      button.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }))
    })
    expect(tooltip()).toBeNull()
  })
})
