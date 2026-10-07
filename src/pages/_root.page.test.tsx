import { describe, expect, it } from "vitest"

import { render, toElement } from "#test"

import RootPage from "./_root.page.tsx"

describe("the home page", () => {
  // The README's words for what the app is built with, and each page as it
  // is: the bare plane draws a curve and pans and zooms.
  it("says what the app is built with", async () => {
    const screen = await render(<RootPage />)
    const text = toElement(screen.getByTestId("root-view")).textContent
    expect(text).toContain(
      "Interactive math visualizations for the browser, built with React, TypeScript and Vite.",
    )
    expect(text).not.toContain("placeholder")
  })
})
