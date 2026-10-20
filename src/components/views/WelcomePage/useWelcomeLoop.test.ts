import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { act, renderHook } from "#test"

import { useWelcomeLoop } from "./useWelcomeLoop"
import { welcomeStill } from "./welcomeLoop"

let frames = new Map<number, FrameRequestCallback>()
let nextFrameId = 1
let frameTime = 0

const runFrames = (count: number) => {
  for (let i = 0; i < count; i++) {
    act(() => {
      frameTime += 1000 / 60
      const callbacks = [...frames.values()]
      frames.clear()
      for (const callback of callbacks) {
        callback(frameTime)
      }
    })
  }
}

const atRest = { func: "x2", a: 1, k: 0, b: 1, h: 0 }

beforeEach(() => {
  frames = new Map()
  nextFrameId = 1
  frameTime = 0
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrameId++
    frames.set(id, callback)
    return id
  })
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    frames.delete(id)
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("useWelcomeLoop", () => {
  it("rests on x² for 1.2 s, then moves it down", async () => {
    const { result } = await renderHook(() => useWelcomeLoop())
    expect(result.current).toEqual(atRest)

    runFrames(72)
    expect(result.current).toEqual(atRest)

    runFrames(38)
    expect(result.current).toEqual({ ...atRest, k: -1.19 })

    runFrames(35)
    expect(result.current).toEqual({ ...atRest, k: -1.5 })
  })

  it("with reduced motion, shows the still and requests no frames", async () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
    }))
    const { result } = await renderHook(() => useWelcomeLoop())
    expect(result.current).toEqual(welcomeStill)
    expect(frames.size).toBe(0)
  })
})
