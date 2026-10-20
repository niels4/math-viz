import { afterEach, describe, expect, it } from "vitest"

import routes from "#generated/routes.ts"
import { Router } from "#src/components/router/Router.tsx"
import { render, updateLocationHash } from "#test"

afterEach(async () => {
  await updateLocationHash("")
})

describe("Developer pages", () => {
  it("opens a phase from its card on the contents page", async () => {
    await updateLocationHash("dev")
    const screen = await render(<Router routes={routes} />)

    await expect.element(screen.getByRole("heading", { name: "How MathViz is designed" })).toBeVisible()
    await expect.element(screen.getByRole("heading", { name: "Fonts", level: 2 })).toBeVisible()

    await screen.getByRole("link", { name: /^The picks and the font lab/ }).click()
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
    await expect.element(screen.getByRole("link", { name: "← Phase 2 · Fonts" })).toBeVisible()

    await screen.getByRole("link", { name: "All phases" }).click()
    await expect.element(screen.getByRole("heading", { name: "How MathViz is designed" })).toBeVisible()
    expect(window.location.hash).toBe("#dev")
  })
})
