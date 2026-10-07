import { describe, expect, it } from "vitest"

import { readoutSlots } from "./readoutFit.ts"

describe("readoutSlots", () => {
  it("keeps the widest value the visible range prints, minus sign included", () => {
    // R2's plane: 936 × 792 at 50 px per unit; R9's: 1256 × 408 at 40.
    expect(readoutSlots({ minX: -9.36, maxX: 9.36, minY: -7.92, maxY: 7.92 })).toEqual({ x: 5, y: 5 })
    expect(readoutSlots({ minX: -15.7, maxX: 15.7, minY: -5.1, maxY: 5.1 })).toEqual({ x: 6, y: 5 })
  })

  it("follows a panned view to either end", () => {
    expect(readoutSlots({ minX: 0.5, maxX: 19.2, minY: -120.5, maxY: -2 })).toEqual({ x: 5, y: 7 })
  })

  it("waits for the plane's first layout", () => {
    expect(readoutSlots(null)).toBeNull()
  })
})
