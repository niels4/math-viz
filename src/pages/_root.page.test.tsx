import { describe, expect, it } from "vitest"

import { isBrowser, render, toElement } from "#test"

import RootPage from "./_root.page.tsx"

describe("the home page", () => {
  it.runIf(isBrowser())("reads in Work Sans, as the views do", async () => {
    const screen = await render(<RootPage />)
    const root = toElement(screen.getByTestId("root-view"))
    expect(root).toBeInstanceOf(HTMLElement)
  })
})
