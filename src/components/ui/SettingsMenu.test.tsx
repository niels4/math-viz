import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { APPEARANCE_KEY } from "#src/state/useAppTheme.ts"
import { motionMedia, runLinear, testMedia } from "#src/test/motion.ts"
import { act, isBrowser, render, toElement } from "#test"

import { SettingsMenu } from "./SettingsMenu.tsx"
import { ThemeChip } from "./ThemeChip.tsx"

// A plain click event: jsdom's patched click() (src/test/jsdom-setup.ts)
// throws on an element that unmounts during its own click.
const click = (el: Element) => {
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }))
  })
}

const key = (el: Element | null, name: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true, ...init })
  act(() => {
    el?.dispatchEvent(event)
  })
  return event
}

const byTestId = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
const panel = () => byTestId("settings-panel")
const gear = () => byTestId("settings-button") as HTMLElement
const focused = () => document.activeElement?.getAttribute("data-testid") ?? null
const shown = () => byTestId("theme-chip")?.textContent ?? null
const radiosIn = (group: Element | null | undefined) => [...(group?.querySelectorAll('[role="radio"]') ?? [])]
const themeRows = () => radiosIn(byTestId("settings-themes"))
const rowsAsRead = () =>
  themeRows().map((row) => `${row.textContent}${row.getAttribute("aria-checked") === "true" ? " ✓" : ""}`)

/** The menu with the theme chip beside it, so a test sees the theme shown, on a system light or dark. */
const renderMenu = async ({ dark = true, reduce = false }: { dark?: boolean; reduce?: boolean } = {}) => {
  const media = testMedia({ dark, reduce })
  vi.stubGlobal("matchMedia", media.matchMedia)
  await render(
    <>
      <ThemeChip />
      <SettingsMenu />
      <button type="button" data-testid="outside">
        Elsewhere
      </button>
    </>,
  )
  return media
}

const openByClick = () => {
  click(gear())
  expect(panel()).not.toBeNull()
}

/** Closed: the gear says so and the panel is gone or on its way out (motion is on). */
const isClosed = () =>
  gear().getAttribute("aria-expanded") === "false" &&
  (panel() === null || panel()?.hasAttribute("data-closing"))

describe("SettingsMenu", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  // D1: a non-modal dialog holding two radio groups (WAI-ARIA 1.2: a menu
  // owns only menu items).
  it("opens a dialog from the gear: Appearance and the themes, two named radio groups", async () => {
    await renderMenu()
    expect(gear().getAttribute("aria-haspopup")).toBe("dialog")
    expect(gear().getAttribute("aria-expanded")).toBe("false")
    expect(panel()).toBeNull()
    openByClick()
    expect(gear().getAttribute("aria-expanded")).toBe("true")
    const dialog = panel()
    expect(dialog?.getAttribute("role")).toBe("dialog")
    expect(dialog?.getAttribute("aria-label")).toBe("Settings")
    expect(gear().getAttribute("aria-controls")).toBe(dialog?.id)
    const [appearance, themes] = [...(dialog?.querySelectorAll('[role="radiogroup"]') ?? [])]
    expect(appearance?.getAttribute("aria-label")).toBe("Appearance")
    const help = document.getElementById(appearance?.getAttribute("aria-describedby") ?? "")
    expect(help?.textContent).toBe("Your system is dark right now.")
    const label = document.getElementById(themes?.getAttribute("aria-labelledby") ?? "")
    expect(label?.textContent).toBe("Dark theme")
    expect(radiosIn(appearance).map((r) => [r.textContent, r.getAttribute("aria-checked")])).toEqual([
      ["System", "true"],
      ["Light", "false"],
      ["Dark", "false"],
    ])
    expect(rowsAsRead()).toEqual(["Arctic Ice ✓", "Tron Cyan", "Midnight Violet"])
    // One tab stop per group, at its checked option (APG Radio Group).
    expect(radiosIn(dialog).map((r) => (r as HTMLElement).tabIndex)).toEqual([0, -1, -1, 0, -1, -1])
    // No menu roles, and nothing else in it: the tour's item has gone (D14).
    expect(dialog?.querySelector('[role^="menu"]')).toBeNull()
    expect(dialog?.querySelectorAll("button")).toHaveLength(6)
  })

  // D8, D4: in System the line names the system's scheme and the list is
  // that scheme's; Light and Dark say so and list their own.
  it.each([
    { os: "dark", mode: "system", help: "Your system is dark right now.", label: "Dark theme" },
    { os: "light", mode: "system", help: "Your system is light right now.", label: "Light theme" },
    { os: "dark", mode: "light", help: "Always light.", label: "Light theme" },
    { os: "light", mode: "dark", help: "Always dark.", label: "Dark theme" },
  ])("in $mode on a $os system says “$help” and lists the $label", async ({ os, mode, help, label }) => {
    localStorage.setItem(APPEARANCE_KEY, JSON.stringify({ mode, dark: "arctic-ice", light: "clean-teal" }))
    await renderMenu({ dark: os === "dark" })
    openByClick()
    expect(byTestId("settings-help")?.textContent).toBe(help)
    const themes = byTestId("settings-themes")
    expect(document.getElementById(themes?.getAttribute("aria-labelledby") ?? "")?.textContent).toBe(label)
    expect(rowsAsRead()).toEqual(
      label === "Dark theme"
        ? ["Arctic Ice ✓", "Tron Cyan", "Midnight Violet"]
        : ["Clean Teal ✓", "Educational Warm", "Sage Editorial"],
    )
  })

  // D2: a pick applies at once and the panel stays open.
  it("applies a pick at once and stays open, for a theme and for a mode", async () => {
    await renderMenu()
    openByClick()
    click(toElement(byTestId("settings-theme-tron-cyan")))
    expect(shown()).toBe("Theme: Tron Cyan")
    expect(rowsAsRead()).toEqual(["Arctic Ice", "Tron Cyan ✓", "Midnight Violet"])
    click(toElement(byTestId("settings-mode-light")))
    expect(shown()).toBe("Theme: Clean Teal")
    expect(rowsAsRead()).toEqual(["Clean Teal ✓", "Educational Warm", "Sage Editorial"])
    click(toElement(byTestId("settings-theme-sage-editorial")))
    // One pick per scheme, kept while the mode switches (D4).
    click(toElement(byTestId("settings-mode-dark")))
    expect(shown()).toBe("Theme: Tron Cyan")
    click(toElement(byTestId("settings-mode-light")))
    expect(shown()).toBe("Theme: Sage Editorial")
    expect(panel()).not.toBeNull()
    expect(panel()?.hasAttribute("data-closing")).toBe(false)
    expect(JSON.parse(localStorage.getItem(APPEARANCE_KEY) ?? "null")).toEqual({
      mode: "light",
      dark: "tron-cyan",
      light: "sage-editorial",
    })
  })

  // D3 and SM · States › Keyboard: three tab stops; arrows pick within a
  // group and wrap, Home and End go to the ends, Space picks.
  it("takes the focus to the checked theme; the arrows pick and wrap in either group", async () => {
    await renderMenu()
    gear().focus()
    click(gear())
    expect(focused()).toBe("settings-theme-arctic-ice")
    const steps: [string, string][] = [
      ["ArrowDown", "tron-cyan"],
      ["ArrowRight", "midnight-violet"],
      ["ArrowDown", "arctic-ice"],
      ["ArrowUp", "midnight-violet"],
      ["ArrowLeft", "tron-cyan"],
      ["Home", "arctic-ice"],
      ["End", "midnight-violet"],
    ]
    for (const [name, slug] of steps) {
      expect(key(document.activeElement, name).defaultPrevented).toBe(true)
      expect(focused()).toBe(`settings-theme-${slug}`)
      expect(document.activeElement?.getAttribute("aria-checked")).toBe("true")
    }
    expect(shown()).toBe("Theme: Midnight Violet")
    // The toggle: its checked option is its stop; arrows apply the mode.
    act(() => toElement(byTestId("settings-mode-system")).focus())
    key(document.activeElement, "ArrowRight")
    expect(focused()).toBe("settings-mode-light")
    expect(shown()).toBe("Theme: Clean Teal")
    key(document.activeElement, "ArrowRight")
    key(document.activeElement, "ArrowRight")
    expect(focused()).toBe("settings-mode-system")
    key(document.activeElement, "End")
    expect(focused()).toBe("settings-mode-dark")
    key(document.activeElement, "Home")
    expect(focused()).toBe("settings-mode-system")
    expect(panel()).not.toBeNull()
  })

  // SM · States › Keyboard: Esc and Enter close from the panel and give the
  // focus back to the gear; Esc on the gear closes before the view's own Esc.
  it.each(["Escape", "Enter"])("closes on %s in the panel and hands the focus to the gear", async (name) => {
    await renderMenu()
    openByClick()
    expect(key(document.activeElement, name).defaultPrevented).toBe(true)
    expect(isClosed()).toBe(true)
    expect(focused()).toBe("settings-button")
    // A pick before Enter is kept.
    openByClick()
    key(document.activeElement, "ArrowDown")
    key(document.activeElement, name)
    expect(shown()).toBe("Theme: Tron Cyan")
  })

  it("closes on Esc while the focus is on the gear, before the view's own Esc", async () => {
    await renderMenu()
    openByClick()
    gear().focus()
    expect(key(gear(), "Escape").defaultPrevented).toBe(true)
    expect(isClosed()).toBe(true)
    // Closed, the gear leaves Esc to the view.
    expect(key(gear(), "Escape").defaultPrevented).toBe(false)
  })

  // D2: Esc, Enter, a press outside, the gear or Tab past the list closes it.
  it("closes on the gear again and on a press outside, not on a press inside", async () => {
    await renderMenu()
    openByClick()
    click(gear())
    expect(isClosed()).toBe(true)
    expect(focused()).toBe("settings-button")
    openByClick()
    act(() => {
      toElement(byTestId("settings-help")).dispatchEvent(new Event("pointerdown", { bubbles: true }))
    })
    expect(isClosed()).toBe(false)
    act(() => {
      toElement(byTestId("outside")).dispatchEvent(new Event("pointerdown", { bubbles: true }))
    })
    expect(isClosed()).toBe(true)
  })

  it("closes when the focus leaves it (Tab past the list), not when it goes to the gear or nowhere", async () => {
    await renderMenu()
    openByClick()
    const row = toElement(byTestId("settings-theme-arctic-ice"))
    const leave = (to: Element | null) => {
      act(() => {
        row.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: to }))
      })
    }
    // Shift+Tab from the toggle reaches the gear; the panel stays.
    leave(gear())
    expect(panel()).not.toBeNull()
    // The window losing the focus moves it nowhere.
    leave(null)
    expect(panel()).not.toBeNull()
    leave(byTestId("outside"))
    expect(isClosed()).toBe(true)
  })

  // D7: a new scheme while the panel is open keeps the rows (the same
  // elements) and fades their new content in; a focus in the list goes to
  // the new scheme's checked theme. A panel that opens shows at once.
  it("keeps its rows and fades their new content in when the scheme changes while it is open", async () => {
    const os = await renderMenu()
    openByClick()
    const before = themeRows()
    const swapped = () => [...(panel()?.querySelectorAll("[data-swapped]") ?? [])].length
    expect(swapped()).toBe(0)
    click(toElement(byTestId("settings-mode-light")))
    expect(themeRows()).toEqual(before)
    expect(rowsAsRead()).toEqual(["Clean Teal ✓", "Educational Warm", "Sage Editorial"])
    // The label, the help line and the three rows' content.
    expect(swapped()).toBe(5)
    // In System, the OS flipping does the same, and the focus follows the check.
    click(toElement(byTestId("settings-mode-system")))
    act(() => toElement(byTestId("settings-theme-arctic-ice")).focus())
    act(() => os.flip(false))
    expect(rowsAsRead()).toEqual(["Clean Teal ✓", "Educational Warm", "Sage Editorial"])
    expect(byTestId("settings-help")?.textContent).toBe("Your system is light right now.")
    expect(focused()).toBe("settings-theme-clean-teal")
    expect(shown()).toBe("Theme: Clean Teal")
    // Closed and opened again: no fade but the panel's own.
    key(document.activeElement, "Escape")
    openByClick()
    expect(swapped()).toBe(0)
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
    const button = toElement(screen.getByTestId("settings-button"))
    const token = (name: string) => button.parentElement?.style.getPropertyValue(name) ?? ""
    const fadeMs = Number.parseFloat(token("--motion-dur-fast"))
    const enterMs = Number.parseFloat(token("--motion-dur-enter-settle"))
    return {
      button,
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
    expect(token("--motion-dur-overlay-leave")).toBe("200ms")
  })

  // The browser runs the CSS: the panel's own transitions, seeked.
  it.runIf(isBrowser())("runs that motion in the browser", async () => {
    const { button, shownBy, inBy } = await renderMotion()
    click(button)
    const dialog = panel()
    if (dialog === null) {
      throw new Error("the panel did not open")
    }
    expect(getComputedStyle(dialog).opacity).toBe("0")
    const transitions = dialog.getAnimations()
    expect(transitions).toHaveLength(2)
    for (const ms of [50, 100, 150, 200]) {
      for (const transition of transitions) {
        transition.pause()
        transition.currentTime = ms
      }
      const style = getComputedStyle(dialog)
      const shape = new DOMMatrixReadOnly(style.transform)
      expect(Number(style.opacity)).toBeCloseTo(shownBy(ms), 2)
      expect(shape.a).toBeCloseTo(0.9 + 0.1 * inBy(ms), 3)
      expect(shape.f).toBeCloseTo(-8 * (1 - inBy(ms)), 2)
    }
  })

  // The swap's fade in the browser: the rows' new content runs 160 ms,
  // linearly, from transparent; the panel itself doesn't move.
  it.runIf(isBrowser())("fades the new scheme's content in over 160 ms in the browser", async () => {
    await renderMenu()
    vi.stubGlobal("matchMedia", motionMedia(false, { dark: true }))
    openByClick()
    for (const transition of panel()?.getAnimations() ?? []) {
      transition.finish()
    }
    click(toElement(byTestId("settings-mode-light")))
    const content = toElement(byTestId("settings-theme-clean-teal")).firstElementChild as HTMLElement
    const [fade] = content.getAnimations()
    expect(fade?.effect?.getTiming().duration).toBe(160)
    fade?.pause()
    if (fade !== undefined) {
      fade.currentTime = 80
    }
    expect(Number(getComputedStyle(content).opacity)).toBeCloseTo(0.5, 2)
    expect(panel()?.getAnimations()).toHaveLength(0)
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
    expect(css).toContain("opacity var(--motion-dur-overlay-leave) linear")
    expect(css).toContain("transform var(--motion-dur-overlay-leave) linear")
    // From and back to, in @starting-style and [data-closing].
    expect(css.match(/opacity: 0;\s+transform: translateY\(-8px\) scale\(0\.9\);/g)).toHaveLength(2)
    // D7: the swap fades in over dur-fast, linearly, 120 ms under reduced motion.
    expect(css).toContain("animation: settings-swap-in var(--motion-dur-fast) linear;")
    expect(css).toContain("animation-duration: var(--motion-dur-reduced-fade);")
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
    key(document.activeElement, "Escape")
    const dialog = panel()
    expect(dialog?.hasAttribute("data-closing")).toBe(true)
    expect(dialog?.hasAttribute("inert")).toBe(true)
    expect(toElement(screen.getByTestId("settings-button")).getAttribute("aria-expanded")).toBe("false")
    act(() => {
      vi.advanceTimersByTime(ms - 1)
    })
    expect(panel()).not.toBeNull()
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(panel()).toBeNull()
  })
})
