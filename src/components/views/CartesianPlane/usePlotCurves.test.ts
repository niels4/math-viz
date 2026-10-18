import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { act, renderHook } from "#test"

import type { PlotFunction } from "./drawCartesianPlane"

import { usePlotCurves } from "./usePlotCurves"

// Functions from the sidebar's Function picker.
const line: PlotFunction = (x) => x
const square: PlotFunction = (x) => x * x
const cube: PlotFunction = (x) => x * x * x

// Animation frames run only when a test calls runFrames, 1000 / 60 ms apart,
// as on a 60 Hz screen.
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

const renderCurves = () => renderHook((fn: PlotFunction = line) => usePlotCurves(fn), { initialProps: line })

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

describe("usePlotCurves", () => {
  it("picking x² fades y = x out while x² draws on from the left", async () => {
    const { result, rerender } = await renderCurves()
    // y = x shows whole.
    expect(result.current).toEqual([{ fn: line, alpha: 1, drawTo: 1 }])

    // Picking x²: until the next frame, y = x shows whole and none of x² shows.
    await rerender(square)
    expect(result.current).toEqual([
      { fn: line, alpha: 1, drawTo: 1 },
      { fn: square, alpha: 1, drawTo: 0 },
    ])

    // 83 ms in: y = x is about half faded and x² has barely started.
    runFrames(5)
    const [fading, drawing] = result.current
    expect(fading?.fn).toBe(line)
    expect(fading?.alpha).toBeCloseTo(0.48, 2)
    expect(drawing?.fn).toBe(square)
    expect(drawing?.drawTo).toBeGreaterThan(0)
    expect(drawing?.drawTo).toBeLessThan(0.01)

    // 450 ms in: y = x is gone and x² is drawn halfway.
    runFrames(22)
    expect(result.current).toHaveLength(1)
    expect(result.current[0]?.fn).toBe(square)
    expect(result.current[0]?.drawTo).toBeCloseTo(0.5)

    // Just past 900 ms: x² shows whole and the frames stop.
    runFrames(28)
    expect(result.current).toEqual([{ fn: square, alpha: 1, drawTo: 1 }])
    expect(frames.size).toBe(0)
  })

  it("picking x³ while x² draws on fades x² out whole and draws x³ from the start", async () => {
    const { result, rerender } = await renderCurves()
    // Picking x², then waiting 450 ms: x² is drawn halfway.
    await rerender(square)
    runFrames(27)
    expect(result.current[0]?.drawTo).toBeCloseTo(0.5)

    // Picking x³: the half-drawn x² shows whole, to fade, and none of x³ shows.
    await rerender(cube)
    expect(result.current).toEqual([
      { fn: square, alpha: 1, drawTo: 1 },
      { fn: cube, alpha: 1, drawTo: 0 },
    ])

    // 83 ms later: x² is about half faded and x³ has barely started.
    runFrames(5)
    expect(result.current[0]?.alpha).toBeCloseTo(0.48, 2)
    expect(result.current[1]?.drawTo).toBeLessThan(0.01)
  })

  it("with reduced motion, picking x² shows it whole at once", async () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
    }))
    const { result, rerender } = await renderCurves()

    // Picking x²: it replaces y = x with no frames to run.
    await rerender(square)
    expect(result.current).toEqual([{ fn: square, alpha: 1, drawTo: 1 }])
    expect(frames.size).toBe(0)
  })
})
