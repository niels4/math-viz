import { getDefaultStore } from "jotai"
import { RESET } from "jotai/utils"
import { afterEach, describe, expect, it, vi } from "vitest"

import routes from "#generated/routes.ts"
import { Router } from "#src/components/router/Router.tsx"
import { selectedLightDarkAtom, selectedLightThemeAtom } from "#src/state/useAppTheme.ts"
import "#src/style/global.css"
import { isBrowser, render, updateLocationHash } from "#test"

import { WelcomePage } from "./WelcomePage"

const boxOf = (element: Element | null) => {
  if (element === null) {
    throw new Error("missing element")
  }
  return element.getBoundingClientRect()
}

afterEach(async () => {
  vi.restoreAllMocks()
  getDefaultStore().set(selectedLightDarkAtom, RESET)
  getDefaultStore().set(selectedLightThemeAtom, RESET)
  await updateLocationHash("")
})

describe("WelcomePage", () => {
  it.runIf(isBrowser())(
    "shows a plane numbered −8 to 8 across and −5 to 5 up, with no scale legend",
    async () => {
      const fillText = vi.spyOn(CanvasRenderingContext2D.prototype, "fillText")
      await render(<WelcomePage />)

      const texts = () => fillText.mock.calls.map(([text]) => text)
      await expect.poll(texts).toEqual(expect.arrayContaining(["-8", "-5", "-1", "0", "1", "5", "8"]))
      expect(texts()).not.toContain("0.50 u")
    },
  )

  it.runIf(isBrowser())("shows the whole page, smaller, in a 1024 × 640 window", async () => {
    const { page } = await import("vitest/browser")
    await page.viewport(1024, 640)
    const screen = await render(<WelcomePage />)

    const title = screen.getByRole("heading", { name: "MathViz" }).element()
    await expect.poll(() => boxOf(title).height).toBeCloseTo(67.2, 1)

    const parts = {
      mark: screen.container.querySelector("svg"),
      gear: screen.getByRole("button").element(),
      title,
      button: screen.getByRole("link", { name: "Open the Function Viewer" }).element(),
      hint: screen.getByText(/^Pick a function, then drag/).element(),
      plane: screen.container.querySelector("canvas"),
    }
    for (const [name, part] of Object.entries(parts)) {
      const { left, top, right, bottom } = boxOf(part)
      expect({ name, inside: left >= 0 && top >= 0 && right <= 1024 && bottom <= 640 }).toEqual({
        name,
        inside: true,
      })
    }
    expect(boxOf(parts.plane).width).toBeCloseTo(588, 1)
    expect(boxOf(parts.plane).height).toBeCloseTo(364, 1)
    expect(document.documentElement.scrollWidth).toBe(1024)
    expect(document.documentElement.scrollHeight).toBe(640)
  })

  it.runIf(isBrowser())("lets the width set the size in a 1280 × 1000 window", async () => {
    const { page } = await import("vitest/browser")
    await page.viewport(1280, 1000)
    const screen = await render(<WelcomePage />)

    const plane = screen.container.querySelector("canvas")
    await expect.poll(() => boxOf(plane).width).toBeCloseTo(739.2, 1)
    const { height, top, bottom } = boxOf(plane)
    expect(height).toBeCloseTo(457.6, 1)
    expect((top + bottom) / 2).toBeCloseTo(500, 0)

    const gear = boxOf(screen.getByRole("button").element())
    expect(gear.top).toBeCloseTo(21.12, 1)
    expect(1280 - gear.right).toBeCloseTo(28.16, 1)
  })

  it.runIf(isBrowser())("keeps the graph paper's lines on the plane's in a 1280 × 800 window", async () => {
    const { page } = await import("vitest/browser")
    await page.viewport(1280, 800)
    const screen = await render(<WelcomePage />)

    const plane = screen.container.querySelector("canvas")
    await expect.poll(() => boxOf(plane).width).toBeLessThan(840)
    const screenPixelsPerUnit = (boxOf(plane).width / 840) * 50 * devicePixelRatio
    expect(screenPixelsPerUnit).toBeCloseTo(Math.round(screenPixelsPerUnit), 2)
  })

  it("opens the Function Viewer from its button", async () => {
    await updateLocationHash("")
    const screen = await render(<Router routes={routes} />)

    await expect.element(screen.getByRole("heading", { name: "MathViz" })).toBeVisible()

    const button = screen.getByRole("link", { name: "Open the Function Viewer" })

    await button.click()
    await expect.element(screen.getByRole("heading", { name: "Function Viewer" })).toBeVisible()
    expect(window.location.hash).toBe("#function-viewer")
  })

  it("recolours the page in the theme picked in the settings menu", async () => {
    getDefaultStore().set(selectedLightDarkAtom, "light")
    getDefaultStore().set(selectedLightThemeAtom, "clean-teal")
    const screen = await render(<WelcomePage />)

    const page = screen.getByTestId("root-view")
    await expect.element(page).toHaveAttribute("data-theme", "clean-teal")

    await screen.getByRole("button").click()
    await screen.getByText("Sage Editorial").click()
    await expect.element(page).toHaveAttribute("data-theme", "sage-editorial")
  })
})
