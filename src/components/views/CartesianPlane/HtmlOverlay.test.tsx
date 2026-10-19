import { afterEach, describe, expect, it } from "vitest"

import { act, render, updateLocationHash } from "#test"

import { HtmlOverlay } from "./HtmlOverlay"

afterEach(async () => {
  await updateLocationHash("")
})

const urlValue = (key: string) => new URLSearchParams(window.location.hash.split("?")[1]).get(key)

describe("the plane's Reset view to origin button", () => {
  it("shows only while the view is off its default, and puts the default back", async () => {
    await render(<HtmlOverlay />)
    const resetView = () => document.querySelector("[aria-label='Reset view to origin']")
    expect(resetView()).toBeNull()

    await updateLocationHash("#?scale=1&center=2.0000,3.0000")
    await expect.poll(resetView).not.toBeNull()

    act(() => resetView()?.dispatchEvent(new MouseEvent("click", { bubbles: true })))
    await expect.poll(() => [urlValue("scale"), urlValue("center")]).toEqual([null, null])
    expect(resetView()).toBeNull()
  })
})
