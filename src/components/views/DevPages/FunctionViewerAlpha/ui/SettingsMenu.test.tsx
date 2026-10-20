import { getDefaultStore } from "jotai"
import { RESET } from "jotai/utils"
import { afterEach, describe, expect, it } from "vitest"

import {
  selectedDarkThemeAtom,
  selectedLightDarkAtom,
  selectedLightThemeAtom,
} from "#src/state/useAppTheme.ts"
import { render, toElement } from "#test"

import { SettingsMenu } from "./SettingsMenu"

afterEach(() => {
  getDefaultStore().set(selectedLightDarkAtom, RESET)
  getDefaultStore().set(selectedDarkThemeAtom, RESET)
  getDefaultStore().set(selectedLightThemeAtom, RESET)
})

describe("Function Viewer Alpha's settings menu", () => {
  it("switches the app to dark mode when a dark theme is picked in Clean Teal", async () => {
    getDefaultStore().set(selectedLightDarkAtom, "light")
    getDefaultStore().set(selectedLightThemeAtom, "clean-teal")
    const screen = await render(<SettingsMenu />)

    await screen.getByRole("button", { name: "Settings" }).click()
    await expect
      .element(screen.getByRole("menuitemradio", { name: "Clean Teal" }))
      .toHaveAttribute("aria-checked", "true")

    await screen.getByRole("menuitemradio", { name: "Midnight Violet" }).click()
    expect(getDefaultStore().get(selectedLightDarkAtom)).toBe("dark")
    expect(getDefaultStore().get(selectedDarkThemeAtom)).toBe("midnight-violet")

    await screen.getByRole("button", { name: "Settings" }).click()
    await expect
      .element(screen.getByRole("menuitemradio", { name: "Midnight Violet" }))
      .toHaveAttribute("aria-checked", "true")
  })

  it("keeps the system setting when the picked theme matches the scheme on screen", async () => {
    getDefaultStore().set(selectedLightDarkAtom, "system")
    const screen = await render(<SettingsMenu />)

    await screen.getByRole("button", { name: "Settings" }).click()
    const shown = screen.getByRole("menuitemradio", { checked: true })
    const sameScheme = toElement(shown).textContent?.includes("Clean Teal") ? "Sage Editorial" : "Tron Cyan"

    await screen.getByRole("menuitemradio", { name: sameScheme }).click()
    expect(getDefaultStore().get(selectedLightDarkAtom)).toBe("system")
  })
})
