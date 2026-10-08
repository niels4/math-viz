import { describe, expect, it } from "vitest"

import { isBrowser, render, toElement } from "#test"

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

  // jsdom draws no CSS: the browser runs it. The page applies the Work Sans
  // module as the views do, or its text falls to the browser's sans-serif.
  it.runIf(isBrowser())("reads in Work Sans, as the views do", async () => {
    const screen = await render(<RootPage />)
    const root = toElement(screen.getByTestId("root-view"))
    for (const el of [root.querySelector("h1"), root.querySelector("p"), root.querySelector("a")]) {
      expect(el).toBeInstanceOf(HTMLElement)
      expect(getComputedStyle(el ?? root).fontFamily).toMatch(/^"Work Sans",/)
    }
  })
})
