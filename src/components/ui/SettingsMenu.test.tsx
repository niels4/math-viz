import { afterEach, describe, expect, it, vi } from "vitest"

import { act, render, toElement } from "#test"

import { SettingsMenu } from "./SettingsMenu.tsx"

const click = (el: Element) => {
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }))
  })
}

const key = (el: Element | null, name: string) => {
  const event = new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true })
  act(() => {
    el?.dispatchEvent(event)
  })
  return event
}

const focused = () => document.activeElement?.getAttribute("data-testid") ?? null

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

  // A menu button (WAI-ARIA APG), so the keyboard reaches every item (FV 07:
  // everything works from the keyboard).
  it("takes the focus to the checked theme; ↑ ↓ Home End move it, Esc hands it back, Tab closes", async () => {
    vi.stubGlobal("matchMedia", undefined)
    const screen = await render(
      <SettingsMenu actions={[{ id: "tour", label: "Show the tour again", onSelect: () => {} }]} />,
    )
    const gear = toElement(screen.getByTestId("settings-button"))
    gear.focus()
    click(gear)
    expect(document.activeElement?.getAttribute("aria-checked")).toBe("true")
    const items = [...document.querySelectorAll('[role="menuitemradio"], [role="menuitem"]')].map((el) =>
      el.getAttribute("data-testid"),
    )
    expect(items.at(-1)).toBe("settings-action-tour")
    key(document.activeElement, "End")
    expect(focused()).toBe("settings-action-tour")
    key(document.activeElement, "ArrowDown")
    expect(focused()).toBe(items[0])
    key(document.activeElement, "ArrowUp")
    expect(focused()).toBe("settings-action-tour")
    key(document.activeElement, "Home")
    expect(focused()).toBe(items[0])
    key(document.activeElement, "ArrowDown")
    expect(focused()).toBe(items[1])
    expect(key(document.activeElement, "Escape").defaultPrevented).toBe(true)
    expect(document.querySelector('[data-testid="settings-menu"]')).toBeNull()
    expect(focused()).toBe("settings-button")
    key(gear, "ArrowUp")
    expect(focused()).toBe("settings-action-tour")
    key(document.activeElement, "Tab")
    expect(gear.getAttribute("aria-expanded")).toBe("false")
  })

  it("closes on Esc while the focus is on the gear, before the view's own Esc", async () => {
    vi.stubGlobal("matchMedia", undefined)
    const screen = await render(<SettingsMenu />)
    const gear = toElement(screen.getByTestId("settings-button"))
    click(gear)
    gear.focus()
    expect(key(gear, "Escape").defaultPrevented).toBe(true)
    expect(document.querySelector('[data-testid="settings-menu"]')).toBeNull()
    // Closed, the gear leaves Esc to the view.
    expect(key(gear, "Escape").defaultPrevented).toBe(false)
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
