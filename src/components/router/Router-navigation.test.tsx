import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"

import { render, updateLocationHash } from "#test"

import { Router } from "./Router"

const CustomNotFound = () => <div data-testid="custom-not-found-view">Page not Found</div>
const RootView = () => <div data-testid="root-view">Root view</div>
const Page1 = () => (
  <div data-testid="page-1">
    Page 1 <a href="#page-2">page 2</a>
  </div>
)
const Page2 = () => <div data-testid="page-2">Page 2</div>
const Page3 = () => <div data-testid="page-3">Page 3</div>

describe("Router Navigation", () => {
  describe("When there are no routes defined", () => {
    const routes = {}
    it("should render the placeholder error", async () => {
      const screen = await render(<Router routes={routes} />)
      await expect.element(screen.getByTestId("placeholder-error-view")).toBeVisible()
    })
  })

  describe("When custom not found route is defined", () => {
    const routes = { _not_found: CustomNotFound }

    it("should render the custom error", async () => {
      const screen = await render(<Router routes={routes} />)
      await expect.element(screen.getByTestId("custom-not-found-view")).toBeVisible()
    })
  })

  describe("when a root route is defined", () => {
    const routes = { "": RootView }

    it("should render the root view", async () => {
      const screen = await render(<Router routes={routes} />)
      await expect.element(screen.getByTestId("root-view")).toBeVisible()
    })
  })

  describe("when another route is defined and we navigate to it first", () => {
    beforeEach(async () => {
      await updateLocationHash("#page-1")
    })

    afterEach(async () => {
      await updateLocationHash("")
    })

    const routes = { "page-1": Page1 }

    it("should render the correct view", async () => {
      const screen = await render(<Router routes={routes} />)
      await expect.element(screen.getByTestId("page-1")).toBeVisible()
    })
  })

  describe("when we click on a link", () => {
    beforeEach(async () => {
      await updateLocationHash("#page-1")
    })

    afterEach(async () => {
      await updateLocationHash("")
    })

    const routes = { "page-1": Page1, "page-2": Page2 }

    it("should load the first page and then load the view that the link points to", async () => {
      const screen = await render(<Router routes={routes} />)
      await expect.element(screen.getByTestId("page-1")).toBeVisible()
      const link = screen.getByText("page 2")
      await link.click()
      await expect.element(screen.getByTestId("page-2")).toBeVisible()
    })
  })

  describe("when we update the hash in javascript", () => {
    beforeEach(async () => {
      await updateLocationHash("#page-1")
    })

    afterEach(async () => {
      await updateLocationHash("")
    })

    const routes = { "page-1": Page1, "page-2": Page2 }

    it("should load the first page and then load the view that the hash updates to", async () => {
      const screen = await render(<Router routes={routes} />)
      await expect.element(screen.getByTestId("page-1")).toBeVisible()
      await updateLocationHash("#page-2")
      await expect.element(screen.getByTestId("page-2"), { timeout: 1000 }).toBeVisible()
    })
  })

  describe("when the user enters a url with too many slashes", () => {
    afterAll(async () => {
      await updateLocationHash("")
    })

    const routes = { "": RootView, "page-1": Page1, "sub-dir/page-3": Page3 }

    describe("when there are extra slashes in the root route", () => {
      beforeAll(async () => {
        await updateLocationHash("#/")
      })

      it("should load ignore the extra slashes and render the correct view", async () => {
        const screen = await render(<Router routes={routes} />)
        await expect.element(screen.getByTestId("root-view")).toBeVisible()
      })

      it("should normalize the route in window.location.hash", async () => {
        expect(window.location.hash).toBe("")
      })
    })

    describe("when there are extra slashes in the root route", () => {
      beforeAll(async () => {
        await updateLocationHash("#/page-1/")
      })

      it("should load ignore the extra slashes and render the correct view", async () => {
        const screen = await render(<Router routes={routes} />)
        await expect.element(screen.getByTestId("page-1")).toBeVisible()
      })

      it("should normalize the route in window.location.hash", async () => {
        expect(window.location.hash).toBe("#page-1")
      })
    })

    describe("when there are extra slashes anywhere", () => {
      beforeAll(async () => {
        await updateLocationHash("#///sub-dir///page-3////")
      })

      it("should load ignore the extra slashes and render the correct view", async () => {
        const screen = await render(<Router routes={routes} />)
        await expect.element(screen.getByTestId("page-3")).toBeVisible()
      })

      it("should normalize the route in window.location.hash", async () => {
        expect(window.location.hash).toBe("#sub-dir/page-3")
      })
    })
  })
})
