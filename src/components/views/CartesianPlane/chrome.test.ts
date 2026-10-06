import { describe, expect, it } from "vitest"

import { hudTicks } from "./chrome.ts"

type Tick = { x: number; y: number; length: number; across: boolean }

// Each tick: where it starts, how long it is, and whether it runs across
// (h, the side edges' ticks) or down (v, the top and bottom edges').
const ticks = (path: string): Tick[] =>
  [...path.matchAll(/M(\d+) (\d+)([hv])(\d+)/g)].map((m) => ({
    x: Number(m[1]),
    y: Number(m[2]),
    length: Number(m[4]),
    across: m[3] === "h",
  }))
const sideYs = (all: Tick[]) => [...new Set(all.filter((t) => t.across).map((t) => t.y))]
const edgeXs = (all: Tick[]) => [...new Set(all.filter((t) => !t.across).map((t) => t.x))]

describe("hudTicks", () => {
  it("keeps every corner as clear as the first tick keeps its own (R3's 936 × 792 plane)", () => {
    const all = ticks(hudTicks(936, 792))
    expect(Math.min(...sideYs(all))).toBe(40)
    // 760 would sit 32 px from the bottom, against the bottom brackets (12 px in, 24 px arms).
    expect(Math.max(...sideYs(all))).toBe(720)
    expect(Math.min(...edgeXs(all))).toBe(40)
    expect(Math.max(...edgeXs(all))).toBe(880)
  })

  it("gives figma0's 1064 × 664 component the ticks it draws", () => {
    const all = ticks(hudTicks(1064, 664))
    expect(sideYs(all)).toEqual([40, 80, 120, 160, 200, 240, 280, 320, 360, 400, 440, 480, 520, 560, 600])
    expect(Math.max(...edgeXs(all))).toBe(1000)
  })

  it("draws 12 px ticks every 200 px and 6 px ones between, 4 px in from each edge", () => {
    const left = ticks(hudTicks(936, 792)).filter((t) => t.across && t.x === 4)
    expect(left.find((t) => t.y === 200)?.length).toBe(12)
    expect(left.find((t) => t.y === 240)?.length).toBe(6)
  })
})
