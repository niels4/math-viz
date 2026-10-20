import { afterEach, describe, expect, it } from "vitest"

import routes from "#generated/routes.ts"
import { Router } from "#src/components/router/Router.tsx"
import { isBrowser, render, updateLocationHash } from "#test"

afterEach(async () => {
  await updateLocationHash("")
})

describe("Developer pages", () => {
  it("opens a phase from its card on the contents page", async () => {
    await updateLocationHash("dev")
    const screen = await render(<Router routes={routes} />)

    await expect.element(screen.getByRole("heading", { name: "How I built MathViz" })).toBeVisible()
    await expect.element(screen.getByRole("heading", { name: "Fonts", level: 2 })).toBeVisible()

    await screen.getByRole("link", { name: /^Choosing the fonts/ }).click()
    await expect.element(screen.getByRole("heading", { name: "Fonts", level: 1 })).toBeVisible()
    expect(window.location.hash).toBe("#dev/fonts")
  })

  it("steps from the first phase to the last, then back to the contents", async () => {
    await updateLocationHash("dev/concept")
    const screen = await render(<Router routes={routes} />)

    await expect.element(screen.getByRole("heading", { name: "Concept", level: 1 })).toBeVisible()

    await screen.getByRole("link", { name: "Phase 2 · Fonts →" }).click()
    await expect.element(screen.getByRole("heading", { name: "Fonts", level: 1 })).toBeVisible()

    await screen.getByRole("link", { name: "Phase 3 · Colors →" }).click()
    await expect.element(screen.getByRole("heading", { name: "Colors", level: 1 })).toBeVisible()

    await screen.getByRole("link", { name: "Phase 4 · Prototype →" }).click()
    await expect.element(screen.getByRole("heading", { name: "Prototype", level: 1 })).toBeVisible()
    await expect.element(screen.getByRole("link", { name: "← Phase 3 · Colors" })).toBeVisible()

    await screen.getByRole("link", { name: "All phases" }).click()
    await expect.element(screen.getByRole("heading", { name: "How I built MathViz" })).toBeVisible()
    expect(window.location.hash).toBe("#dev")
  })

  it("returns to the contents from the Developer pages title on a phase", async () => {
    await updateLocationHash("dev/colors")
    const screen = await render(<Router routes={routes} />)

    await expect.element(screen.getByRole("heading", { name: "Colors", level: 1 })).toBeVisible()

    await screen.getByRole("link", { name: "Developer pages" }).click()
    await expect.element(screen.getByRole("heading", { name: "How I built MathViz" })).toBeVisible()
    expect(window.location.hash).toBe("#dev")
  })

  it("runs the first prototype inside the prototype phase", async () => {
    await updateLocationHash("dev/prototype")
    const screen = await render(<Router routes={routes} />)

    await expect.element(screen.getByRole("heading", { name: "Prototype", level: 1 })).toBeVisible()

    await expect.element(screen.getByRole("heading", { name: "Function Transforms" })).toBeVisible()
    expect(window.location.hash).toBe("#dev/prototype")
  })

  it("opens the Function Viewer from the development phase", async () => {
    await updateLocationHash("dev/development")
    const screen = await render(<Router routes={routes} />)

    await expect.element(screen.getByRole("heading", { name: "Development", level: 1 })).toBeVisible()

    await screen.getByRole("link", { name: "Open the Function Viewer" }).click()
    await expect.element(screen.getByRole("heading", { name: "Function Viewer", level: 1 })).toBeVisible()
    expect(window.location.hash).toBe("#function-viewer")
  })

  it.runIf(isBrowser())("opens a phase at its top from a card low on the contents page", async () => {
    const { page } = await import("vitest/browser")
    await page.viewport(1440, 900)
    await updateLocationHash("dev")
    const screen = await render(<Router routes={routes} />)

    const card = screen.getByRole("link", { name: /^Choosing the colors/ })
    await expect.element(card).toBeVisible()
    card.element().scrollIntoView()
    expect(window.scrollY).toBeGreaterThan(0)

    await card.click()
    await expect.element(screen.getByRole("heading", { name: "Colors", level: 1 })).toBeVisible()
    expect(window.scrollY).toBe(0)
  })
})
