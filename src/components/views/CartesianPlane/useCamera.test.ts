import type { RefObject } from "react"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { renderHook } from "#test"

import { unscaledUnitSize } from "./constants"
import { useCamera } from "./useCamera"

type Center = [number, number]
type Camera = { center: Center; scale: number }

// The canvas sits at (100, 50) on the page and is 400 by 300 px, so the
// point the draw code treats as its center is at (300, 200).
const canvasRect = { left: 100, top: 50, width: 400, height: 300 }
const canvasCenterX = 300
const canvasCenterY = 200

let canvas: HTMLCanvasElement
let ref: RefObject<HTMLCanvasElement | null>

// Animation frames run only when a test calls runFrame, 16 ms apart.
let frames = new Map<number, FrameRequestCallback>()
let nextFrameId = 1
let frameTime = 0

const runFrame = () => {
  frameTime += 16
  const callbacks = [...frames.values()]
  frames.clear()
  for (const callback of callbacks) {
    callback(frameTime)
  }
}

const runUntilStill = () => {
  for (let i = 0; i < 1000 && frames.size > 0; i++) {
    runFrame()
  }
  expect(frames.size).toBe(0)
}

const wheel = (deltaY: number, clientX = canvasCenterX, clientY = canvasCenterY) => {
  canvas.dispatchEvent(new WheelEvent("wheel", { deltaY, clientX, clientY }))
}

// The plane point drawn at a page position, as drawCartesianPlane places it.
const planePointAt = ({ center, scale }: Camera, clientX: number, clientY: number): Center => {
  const unit = unscaledUnitSize / scale
  return [center[0] + (clientX - canvasCenterX) / unit, center[1] - (clientY - canvasCenterY) / unit]
}

const renderCamera = async (start: Camera) => {
  const setCenter = vi.fn<(center: Center) => void>()
  const setScale = vi.fn<(scale: number) => void>()
  const onSettle = vi.fn<() => void>()
  const hook = await renderHook(
    (props: Camera = start) => useCamera(ref, props.center, props.scale, setCenter, setScale, onSettle),
    { initialProps: start },
  )
  // The camera as React was last told it, starting from the props.
  const latest = (): Camera => ({
    center: setCenter.mock.lastCall?.[0] ?? start.center,
    scale: setScale.mock.lastCall?.[0] ?? start.scale,
  })
  return { ...hook, setCenter, setScale, onSettle, latest }
}

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

  canvas = document.createElement("canvas")
  document.body.append(canvas)
  vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue(
    DOMRect.fromRect({
      x: canvasRect.left,
      y: canvasRect.top,
      width: canvasRect.width,
      height: canvasRect.height,
    }),
  )
  ref = { current: canvas }
})

afterEach(() => {
  canvas.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("useCamera zoom", () => {
  it("zooms by the product of a burst of wheel notches", async () => {
    const { setScale, latest, unmount } = await renderCamera({ center: [0, 0], scale: 1 })

    // A fast wheel sends three notches before the next frame.
    wheel(100)
    wheel(100)
    wheel(-50)
    expect(frames.size).toBe(1)

    // The first frame eases part of the way, not the whole zoom at once.
    runFrame()
    const target = Math.exp(0.1) * Math.exp(0.1) * Math.exp(-0.05)
    expect(latest().scale).toBeGreaterThan(1)
    expect(latest().scale).toBeLessThan(target)

    // The zoom comes to rest on the product of the three notches, on one
    // animation the whole way.
    for (let i = 0; i < 1000 && frames.size > 0; i++) {
      expect(frames.size).toBe(1)
      runFrame()
    }
    expect(latest().scale).toBeCloseTo(target, 12)
    expect(setScale).toHaveBeenCalled()

    await unmount()
  })

  it("adds up trackpad scroll steps too small to zoom on their own", async () => {
    const { latest, unmount } = await renderCamera({ center: [0, 0], scale: 1 })

    // A slow trackpad scroll sends ten tiny steps before the next frame.
    // Each one moves the target less than the distance the zoom snaps from.
    for (let i = 0; i < 10; i++) {
      wheel(0.2)
    }

    // The zoom covers all ten, not only the last.
    runUntilStill()
    expect(latest().scale).toBeCloseTo(Math.exp(0.002), 12)

    await unmount()
  })

  it("stops at the scale limits without starting an animation", async () => {
    // Zoomed out near the limit, a big notch outward stops at scale 5.
    const zoomedOut = await renderCamera({ center: [0, 0], scale: 4.9 })
    wheel(1000)
    runUntilStill()
    expect(zoomedOut.latest().scale).toBe(5)
    await zoomedOut.unmount()

    // At scale 5, another notch outward has nothing to animate.
    const atMax = await renderCamera({ center: [0, 0], scale: 5 })
    wheel(100)
    expect(frames.size).toBe(0)
    expect(atMax.setScale).not.toHaveBeenCalled()
    await atMax.unmount()

    // Likewise at scale 0.1 for a notch inward.
    const atMin = await renderCamera({ center: [0, 0], scale: 0.1 })
    wheel(-100)
    expect(frames.size).toBe(0)
    expect(atMin.setScale).not.toHaveBeenCalled()
    await atMin.unmount()
  })

  it("keeps the plane point under the cursor in place while zooming", async () => {
    const start: Camera = { center: [2, -1], scale: 1 }
    const { latest, unmount } = await renderCamera(start)

    // The cursor rests near the top right corner of the canvas and zooms in.
    const [x, y] = [450, 90]
    const underCursor = planePointAt(start, x, y)
    wheel(-300, x, y)

    // Every frame draws the same plane point under the cursor.
    for (let i = 0; i < 1000 && frames.size > 0; i++) {
      runFrame()
      const [px, py] = planePointAt(latest(), x, y)
      expect(px).toBeCloseTo(underCursor[0], 9)
      expect(py).toBeCloseTo(underCursor[1], 9)
    }

    // The zoom happened, and it panned the center toward the cursor.
    expect(latest().scale).toBeCloseTo(Math.exp(-0.3), 12)
    expect(latest().center[0]).toBeGreaterThan(2)
    expect(latest().center[1]).toBeGreaterThan(-1)

    await unmount()
  })

  it("zooms without panning when the cursor is at the canvas center", async () => {
    const { setCenter, latest, unmount } = await renderCamera({ center: [2, -1], scale: 1 })

    wheel(200, canvasCenterX, canvasCenterY)
    runUntilStill()

    expect(latest().scale).toBeCloseTo(Math.exp(0.2), 12)
    expect(setCenter).not.toHaveBeenCalled()

    await unmount()
  })

  it("writes the url once, when the zoom comes to rest", async () => {
    const { setScale, onSettle, unmount } = await renderCamera({ center: [0, 0], scale: 1 })

    // Two frames into a zoom, the scale has changed but the url has not.
    wheel(100, 350, 120)
    runFrame()
    runFrame()
    expect(setScale).toHaveBeenCalledTimes(2)
    expect(onSettle).not.toHaveBeenCalled()

    // Another notch mid-zoom carries the same zoom further.
    wheel(100, 350, 120)
    runUntilStill()

    // One url write, after the last scale change.
    expect(onSettle).toHaveBeenCalledTimes(1)
    const lastScaleWrite = setScale.mock.invocationCallOrder.at(-1) ?? 0
    expect(onSettle.mock.invocationCallOrder[0]).toBeGreaterThan(lastScaleWrite)

    await unmount()
  })

  it("zooms from where back or forward left the camera", async () => {
    const { rerender, latest, unmount } = await renderCamera({ center: [0, 0], scale: 1 })

    // A zoom at the canvas center comes to rest, and React renders it.
    wheel(100)
    runUntilStill()
    expect(latest().scale).toBeCloseTo(Math.exp(0.1), 12)
    await rerender(latest())

    // Back goes to a url with center=3,4 and scale=2.
    const afterBack: Camera = { center: [3, 4], scale: 2 }
    await rerender(afterBack)

    // The next zoom starts from scale 2 and keeps the point under the
    // cursor that url shows, not the one the first zoom left there.
    const [x, y] = [400, 200]
    const underCursor = planePointAt(afterBack, x, y)
    wheel(100, x, y)
    runUntilStill()
    expect(latest().scale).toBeCloseTo(2 * Math.exp(0.1), 12)
    const [px, py] = planePointAt(latest(), x, y)
    expect(px).toBeCloseTo(underCursor[0], 9)
    expect(py).toBeCloseTo(underCursor[1], 9)

    await unmount()
  })

  it("stops zooming when the plane unmounts", async () => {
    const { setCenter, setScale, onSettle, unmount } = await renderCamera({ center: [0, 0], scale: 1 })

    // A zoom is one frame in when the plane goes away.
    wheel(100, 350, 120)
    runFrame()
    await unmount()
    expect(frames.size).toBe(0)
    setCenter.mockClear()
    setScale.mockClear()

    // Nothing moves afterwards, and a late wheel event does nothing.
    wheel(100, 350, 120)
    runFrame()
    expect(frames.size).toBe(0)
    expect(setCenter).not.toHaveBeenCalled()
    expect(setScale).not.toHaveBeenCalled()
    expect(onSettle).not.toHaveBeenCalled()
  })
})
