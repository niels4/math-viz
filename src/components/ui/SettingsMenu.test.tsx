import { afterEach, describe, expect, it, vi } from "vitest"

import { act, isBrowser, render, toElement } from "#test"

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

/** A CSS `linear()` easing with evenly spaced stops, as `cssLinear` writes them, at `progress`. */
const runLinear = (easing: string, progress: number): number => {
  const stops = easing.slice("linear(".length, -1).split(",").map(Number)
  const at = Math.min(1, Math.max(0, progress)) * (stops.length - 1)
  const i = Math.min(stops.length - 2, Math.floor(at))
  const from = stops[i] ?? 1
  return from + ((stops[i + 1] ?? from) - from) * (at - i)
}

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

  // Watched at real speed, a change under about 100 ms reads as a pop: on
  // the enter spring squeezed into 320 ms, 4 px and 98 %, the menu was all
  // there 80 ms after it showed. It comes out of the gear at the spring's
  // own pace, from 90 % and 8 px up, fading in over 160 ms, and goes back
  // over 200 ms. How far in it is at a few moments after it opens: its
  // opacity, and how much of the 8 px and the 10 % it has made up.
  const renderMotion = async () => {
    vi.stubGlobal("matchMedia", motionMedia(false))
    const screen = await render(<SettingsMenu />)
    const gear = toElement(screen.getByTestId("settings-button"))
    const token = (name: string) => gear.parentElement?.style.getPropertyValue(name) ?? ""
    const fadeMs = Number.parseFloat(token("--motion-dur-fast"))
    const enterMs = Number.parseFloat(token("--motion-dur-enter-settle"))
    return {
      gear,
      token,
      shownBy: (ms: number) => Math.min(1, ms / fadeMs),
      inBy: (ms: number) => runLinear(token("--motion-ease-enter"), ms / enterMs),
    }
  }

  it("comes out of the gear over about 200 ms and goes back over 200 ms", async () => {
    const { token, shownBy, inBy } = await renderMotion()
    expect(shownBy(50)).toBeLessThan(0.35)
    expect(shownBy(100)).toBeGreaterThan(0.5)
    expect(shownBy(100)).toBeLessThan(0.75)
    expect(shownBy(150)).toBeGreaterThan(0.9)
    expect(inBy(50)).toBeLessThan(0.3)
    expect(inBy(100)).toBeGreaterThan(0.5)
    expect(inBy(100)).toBeLessThan(0.7)
    expect(inBy(150)).toBeGreaterThan(0.8)
    expect(inBy(150)).toBeLessThan(0.95)
    expect(inBy(200)).toBeGreaterThan(0.98)
    // Going, linearly: half way back at 100 ms.
    expect(token("--motion-dur-menu-leave")).toBe("200ms")
  })

  // The browser runs the CSS: the menu's own transitions, seeked.
  it.runIf(isBrowser())("runs that motion in the browser", async () => {
    const { gear, shownBy, inBy } = await renderMotion()
    click(gear)
    const menu = document.querySelector<HTMLElement>('[data-testid="settings-menu"]')
    if (menu === null) {
      throw new Error("the menu did not open")
    }
    expect(getComputedStyle(menu).opacity).toBe("0")
    const transitions = menu.getAnimations()
    expect(transitions).toHaveLength(2)
    for (const ms of [50, 100, 150, 200]) {
      for (const transition of transitions) {
        transition.pause()
        transition.currentTime = ms
      }
      const style = getComputedStyle(menu)
      const shape = new DOMMatrixReadOnly(style.transform)
      expect(Number(style.opacity)).toBeCloseTo(shownBy(ms), 2)
      expect(shape.a).toBeCloseTo(0.9 + 0.1 * inBy(ms), 3)
      expect(shape.f).toBeCloseTo(-8 * (1 - inBy(ms)), 2)
    }
  })

  // jsdom draws no CSS and Vitest imports the module as its class names,
  // so this reads its source.
  it.skipIf(isBrowser())("runs that motion in its CSS, on those tokens", async () => {
    const fs = "node:fs"
    const { readFileSync } = (await import(/* @vite-ignore */ fs)) as {
      readFileSync: (path: string, encoding: "utf8") => string
    }
    const { dirname } = import.meta as ImportMeta & { dirname: string }
    const css = readFileSync(`${dirname}/SettingsMenu.module.css`, "utf8")
    // The fade is linear: Firefox paints an opacity eased past 1 washed out.
    expect(css).toContain("opacity var(--motion-dur-fast) linear")
    expect(css).toContain("transform var(--motion-dur-enter-settle) var(--motion-ease-enter)")
    expect(css).toContain("opacity var(--motion-dur-menu-leave) linear")
    expect(css).toContain("transform var(--motion-dur-menu-leave) linear")
    // From and back to, in @starting-style and [data-closing].
    expect(css.match(/opacity: 0;\s+transform: translateY\(-8px\) scale\(0\.9\);/g)).toHaveLength(2)
  })

  // It leaves in 200 ms (a 120 ms fade under reduced motion), taking no
  // input while it goes (SettingsMenu.module.css draws the motion).
  it.each([
    { motion: "full motion", reduce: false, ms: 200 },
    { motion: "reduced motion", reduce: true, ms: 120 },
  ])("stays $ms ms on its way out with $motion, inert, then goes", async ({ reduce, ms }) => {
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
      vi.advanceTimersByTime(ms - 1)
    })
    expect(document.querySelector('[data-testid="settings-menu"]')).not.toBeNull()
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(document.querySelector('[data-testid="settings-menu"]')).toBeNull()
  })
})
