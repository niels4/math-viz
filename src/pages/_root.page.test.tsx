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

  // The two Function Viewers side by side, so one can be opened after the other.
  it("links today's Function Viewer and v2", async () => {
    const screen = await render(<RootPage />)
    const links = [...toElement(screen.getByTestId("root-view")).querySelectorAll("a")].map((a) =>
      a.getAttribute("href"),
    )
    expect(links).toContain("#demos/function-viewer")
    expect(links).toContain("#demos/function-viewer-v2")
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
