import { afterEach, describe, expect, it, vi } from "vitest"

import routes from "#generated/routes.ts"
import { Router } from "#src/components/router/Router.tsx"
import { isBrowser, render, updateLocationHash } from "#test"

import { WelcomePage } from "./WelcomePage"

afterEach(async () => {
  vi.restoreAllMocks()
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

  it("opens the Function Viewer from its button", async () => {
    await updateLocationHash("")
    const screen = await render(<Router routes={routes} />)

    await expect.element(screen.getByRole("heading", { name: "MathViz" })).toBeVisible()

    const button = screen.getByRole("link", { name: "Open the Function Viewer" })

    await button.click()
    await expect.element(screen.getByRole("heading", { name: "Function Viewer" })).toBeVisible()
    expect(window.location.hash).toBe("#function-viewer")
  })
})
