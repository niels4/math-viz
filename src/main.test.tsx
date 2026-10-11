import { describe, expect, it } from "vitest"

import { render, updateLocationHash } from "#test"

describe("main", () => {
  it("should be able to render the root page and not found page without error", async () => {
    const screen = await render(<div data-testid="root" id="root" />)
    await import("./main.tsx")
    await updateLocationHash("")
    await expect.element(screen.getByTestId("root-view")).toBeVisible()
    await updateLocationHash("__route-that-doesnt-exist__")
    await expect.element(screen.getByTestId("not-found-view")).toBeVisible()
  })
})
