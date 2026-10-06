import { describe, expect, it, vi } from "vitest"

import { act, render, toElement } from "#test"

import { SettingsMenu } from "./SettingsMenu.tsx"

const click = (el: Element) => {
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }))
  })
}

describe("SettingsMenu", () => {
  it("lists a view's own items under the themes, and closes as one runs", async () => {
    const onSelect = vi.fn<() => void>()
    const screen = await render(
      <SettingsMenu actions={[{ id: "tour", label: "Show the tour again", onSelect }]} />,
    )
    click(toElement(screen.getByTestId("settings-button")))
    const item = toElement(screen.getByTestId("settings-action-tour"))
    expect(item.getAttribute("role")).toBe("menuitem")
    expect(item.textContent).toBe("Show the tour again")
    click(item)
    expect(onSelect).toHaveBeenCalledOnce()
    expect(document.querySelector('[data-testid="settings-menu"]')).toBeNull()
  })

  it("shows only the themes without items", async () => {
    const screen = await render(<SettingsMenu />)
    click(toElement(screen.getByTestId("settings-button")))
    expect(document.querySelectorAll('[role="menuitem"]')).toHaveLength(0)
    expect(document.querySelectorAll('[role="menuitemradio"]').length).toBeGreaterThan(0)
  })
})
