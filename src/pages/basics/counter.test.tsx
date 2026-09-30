import { beforeEach, describe, expect, it } from "vitest"

import { wait } from "#src/util/async.ts"
import { render, updateLocationHash } from "#test"

import CounterPage from "./counter.page.tsx"

describe("CounterPage", () => {
  describe("when there are no search params", () => {
    beforeEach(async () => {
      await updateLocationHash("")
    })

    it("Should load the counter page with count of 0", async () => {
      const screen = await render(<CounterPage />)
      const headingText = screen.getByText("Counter")
      expect(headingText).toBeInTheDocument()

      const value = screen.getByTestId("counter-value")
      expect(value).toHaveTextContent("0")
    })

    describe("when the increment button is pressed", () => {
      it("Should set the count param to 1", async () => {
        const screen = await render(<CounterPage />)
        const value = screen.getByTestId("counter-value")
        expect(value).toHaveTextContent("0")

        const button = screen.getByText("Increment")
        await button.click()
        await wait(0)

        expect(window.location.hash).toEqual("#?count=1")
        expect(value).toHaveTextContent("1")
      })
    })
  })

  describe("when the count is set to 42 in search params", () => {
    beforeEach(async () => {
      await updateLocationHash("#?count=42")
    })

    it("Should load the counter page with count of 42", async () => {
      const screen = await render(<CounterPage />)
      const value = screen.getByTestId("counter-value")
      expect(value).toHaveTextContent("42")
    })

    describe("when the increment button is pressed", () => {
      it("Should increase the count param by 1", async () => {
        const screen = await render(<CounterPage />)
        const value = screen.getByTestId("counter-value")
        expect(value).toHaveTextContent("42")

        const button = screen.getByText("Increment")
        await button.click()
        await wait(0)

        expect(window.location.hash).toEqual("#?count=43")
        expect(value).toHaveTextContent("43")
      })
    })
  })
})
