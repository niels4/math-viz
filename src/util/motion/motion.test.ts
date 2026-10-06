import { afterEach, describe, expect, it, vi } from "vitest"

import { DURATION_MS, motionCssVars, motionLevel, prefersReducedMotion } from "./motion.ts"

const media = (reduce: boolean) => (query: string) =>
  ({ matches: reduce && query === "(prefers-reduced-motion: reduce)", media: query }) as MediaQueryList

describe("motionLevel", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("reads prefers-reduced-motion, and shows none where there is no matchMedia", () => {
    vi.stubGlobal("matchMedia", media(false))
    expect(motionLevel()).toBe("full")
    expect(prefersReducedMotion()).toBe(false)
    vi.stubGlobal("matchMedia", media(true))
    expect(motionLevel()).toBe("reduced")
    vi.stubGlobal("matchMedia", undefined)
    expect(motionLevel()).toBe("none")
    expect(prefersReducedMotion()).toBe(true)
  })

  it("times leaving at 120 ms, for GSAP and CSS alike", () => {
    expect(DURATION_MS.leave).toBe(120)
    expect(motionCssVars).toMatchObject({ "--motion-dur-leave": "120ms" })
  })
})
