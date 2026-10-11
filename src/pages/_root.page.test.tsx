import { describe, expect, it } from "vitest"

import { isBrowser, render, toElement } from "#test"

import RootPage from "./_root.page.tsx"

describe("the home page", () => {
  it.runIf(isBrowser())("reads in Work Sans, as the views do", async () => {
    const screen = await render(<RootPage />)
    const root = toElement(screen.getByTestId("root-view"))
    for (const el of [root.querySelector("h1"), root.querySelector("p"), root.querySelector("a")]) {
      expect(el).toBeInstanceOf(HTMLElement)
      expect(getComputedStyle(el ?? root).fontFamily).toMatch(/^"Work Sans",/)
    }
  })
})
