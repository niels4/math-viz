import { afterEach, describe, expect, it, vi } from "vitest"

import { isBrowser, render } from "#test"

import { WelcomePage } from "./WelcomePage"

afterEach(() => {
  vi.restoreAllMocks()
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
})
