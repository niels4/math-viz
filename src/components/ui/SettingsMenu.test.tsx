import { afterEach, describe, expect, it, vi } from "vitest"

import { act, render, toElement } from "#test"

import { SettingsMenu } from "./SettingsMenu.tsx"

const click = (el: Element) => {
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }))
  })
}

/** A browser's matchMedia that prefers motion (or not). */
const motionMedia = (reduce: boolean) => (query: string) =>
  ({ matches: reduce && query.includes("reduce"), media: query }) as MediaQueryList

describe("SettingsMenu", () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  // These two read the menu's items: no matchMedia, no motion, as in jsdom.
  it("lists a view's own items under the themes, and closes as one runs", async () => {
    vi.stubGlobal("matchMedia", undefined)
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
    vi.stubGlobal("matchMedia", undefined)
    const screen = await render(<SettingsMenu />)
    click(toElement(screen.getByTestId("settings-button")))
    expect(document.querySelectorAll('[role="menuitem"]')).toHaveLength(0)
    expect(document.querySelectorAll('[role="menuitemradio"]').length).toBeGreaterThan(0)
  })

  // It opens on the overlays' motion and leaves in 120 ms, taking no input
  // while it goes (SettingsMenu.module.css draws the motion).
  it.each([
    ["full motion", false],
    ["reduced motion", true],
  ])("stays 120 ms on its way out with %s, inert, then goes", async (_, reduce) => {
    vi.stubGlobal("matchMedia", motionMedia(reduce))
    const screen = await render(<SettingsMenu />)
    click(toElement(screen.getByTestId("settings-button")))
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
    click(toElement(screen.getByTestId("settings-theme-clean-teal")))
    const menu = document.querySelector('[data-testid="settings-menu"]')
    expect(menu?.hasAttribute("data-closing")).toBe(true)
    expect(menu?.hasAttribute("inert")).toBe(true)
    expect(toElement(screen.getByTestId("settings-button")).getAttribute("aria-expanded")).toBe("false")
    act(() => {
      vi.advanceTimersByTime(120)
    })
    expect(document.querySelector('[data-testid="settings-menu"]')).toBeNull()
  })
})
