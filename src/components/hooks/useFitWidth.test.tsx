import { afterEach, describe, expect, it, vi } from "vitest"

import { renderHook } from "#test"

import { useFitWidth } from "./useFitWidth.ts"

// An element `scaling` px wide at full size plus `fixed` px that don't
// shrink with its font, in a container `room` px wide (the hook keeps 2 px).
const setUp = (scaling: number, fixed: number, room: number) => {
  const outer = document.createElement("div")
  const inner = document.createElement("span")
  outer.append(inner)
  Object.defineProperty(outer, "clientWidth", { value: room + 2 })
  const scale = () => Number(inner.style.getPropertyValue("--fit-scale") || "1")
  inner.getBoundingClientRect = () => ({ width: scaling * scale() + fixed }) as DOMRect
  return { outer, inner, scale }
}

describe("useFitWidth", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("leaves an element that fits at full size", async () => {
    vi.stubGlobal("ResizeObserver", undefined)
    const { outer, inner, scale } = setUp(100, 20, 300)
    await renderHook(() => useFitWidth({ current: outer }, { current: inner }))
    expect(scale()).toBe(1)
  })

  it("shrinks an element to its container, whole-px parts included", async () => {
    vi.stubGlobal("ResizeObserver", undefined)
    // 200 px that scale and 20 that don't, in 120: the font at half size.
    const { outer, inner, scale } = setUp(200, 20, 120)
    await renderHook(() => useFitWidth({ current: outer }, { current: inner }))
    expect(scale()).toBeCloseTo(0.5)
    expect(inner.getBoundingClientRect().width).toBeCloseTo(120)
  })
})
