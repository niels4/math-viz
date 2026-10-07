import "#src/style/global.css"
import { describe, expect, it } from "vitest"

import { isBrowser } from "#test"

describe("global.css", () => {
  // jsdom draws no CSS: the browser runs it. transition-behavior isn't
  // inherited, so the default must reach each element itself.
  it.runIf(isBrowser())("lets every element transition its discrete properties", () => {
    const outer = document.createElement("div")
    const inner = document.createElement("span")
    outer.append(inner)
    document.body.append(outer)
    expect(getComputedStyle(document.documentElement).transitionBehavior).toBe("allow-discrete")
    expect(getComputedStyle(inner).transitionBehavior).toBe("allow-discrete")
    expect(getComputedStyle(inner, "::before").transitionBehavior).toBe("allow-discrete")
    outer.remove()
  })
})
