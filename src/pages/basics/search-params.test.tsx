import { beforeEach, describe, expect, it } from "vitest"

import { wait } from "#src/util/async.ts"
import { render, updateLocationHash } from "#test"

import SearchParamsPage from "./search-params.page.tsx"

describe("SearchParamsPage", () => {
  describe("when there are no search params", () => {
    beforeEach(async () => {
      await updateLocationHash("")
    })

    it("Should load the search params page with count of 0", async () => {
      const screen = await render(<SearchParamsPage />)
      const headingText = screen.getByText("Search Params Example")
      expect(headingText).toBeInTheDocument()

      const clickCount = screen.getByTestId("click-count")
      expect(clickCount).toHaveTextContent("0")
    })

    describe("when the click me button is pressed", () => {
      it("Should set the count param to 1", async () => {
        const screen = await render(<SearchParamsPage />)
        const clickCount = screen.getByTestId("click-count")
        expect(clickCount).toHaveTextContent("0")

        const button = screen.getByText("Click me")
        await button.click()
        await wait(0)

        expect(window.location.hash).toEqual("#?count=1")
        expect(clickCount).toHaveTextContent("1")
      })
    })
  })

  describe("when the count is set to 42 in search params", () => {
    beforeEach(async () => {
      await updateLocationHash("#?count=42")
    })

    it("Should load the search params page with count of 42", async () => {
      const screen = await render(<SearchParamsPage />)

      const clickCount = screen.getByTestId("click-count")
      expect(clickCount).toHaveTextContent("42")
    })

    describe("when the click me button is pressed", () => {
      it("Should increase the count param by 1", async () => {
        const screen = await render(<SearchParamsPage />)
        const clickCount = screen.getByTestId("click-count")
        expect(clickCount).toHaveTextContent("42")

        const button = screen.getByText("Click me")
        await button.click()
        await wait(0)

        expect(window.location.hash).toEqual("#?count=43")
        expect(clickCount).toHaveTextContent("43")
      })
    })

    describe("when the reset button is pressed", () => {
      it("Should reset the count param to 0", async () => {
        const screen = await render(<SearchParamsPage />)
        const clickCount = screen.getByTestId("click-count")
        expect(clickCount).toHaveTextContent("42")

        const button = screen.getByText("Reset")
        await button.click()
        await wait(0)

        expect(window.location.hash).toEqual("")
        expect(clickCount).toHaveTextContent("0")
      })
    })
  })
})
