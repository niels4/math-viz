import type { RefObject } from "react"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { renderHook } from "#test"

import { unscaledUnitSize } from "../constants"
import { useCamera } from "./useCamera"

type Center = [number, number]
type Camera = { center: Center; scale: number }

const canvasRect = { left: 100, top: 50, width: 400, height: 300 }
const canvasCenterX = 300
const canvasCenterY = 200

let canvas: HTMLCanvasElement
let ref: RefObject<HTMLCanvasElement | null>

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

const pointer = (type: string, clientX: number, clientY: number) => {
  const event = new PointerEvent(type, { pointerId: 1, pointerType: "mouse", button: 0, clientX, clientY })
  Object.defineProperty(event, "timeStamp", { value: frameTime })
  canvas.dispatchEvent(event)
}
const down = (clientX: number, clientY: number) => pointer("pointerdown", clientX, clientY)
const move = (clientX: number, clientY: number) => pointer("pointermove", clientX, clientY)
const up = (clientX: number, clientY: number) => pointer("pointerup", clientX, clientY)

const flickRight = () => {
  down(canvasCenterX, canvasCenterY)
  for (let i = 1; i <= 5; i++) {
    runFrame()
    move(canvasCenterX + 20 * i, canvasCenterY)
  }
  runFrame()
  up(canvasCenterX + 100, canvasCenterY)
}

const planePointAt = ({ center, scale }: Camera, clientX: number, clientY: number): Center => {
  const unit = unscaledUnitSize / scale
  return [center[0] + (clientX - canvasCenterX) / unit, center[1] - (clientY - canvasCenterY) / unit]
}

const pagePointOf = ({ center, scale }: Camera, [px, py]: Center): Center => {
  const unit = unscaledUnitSize / scale
  return [canvasCenterX + (px - center[0]) * unit, canvasCenterY - (py - center[1]) * unit]
}

const centerXs = (setCenter: { mock: { calls: [Center][] } }) => setCenter.mock.calls.map(([c]) => c[0])

const renderCamera = async (start: Camera) => {
  const setCenter = vi.fn<(center: Center) => void>()
  const setScale = vi.fn<(scale: number) => void>()
  const onSettle = vi.fn<() => void>()
  const hook = await renderHook(
    (props: Camera = start) =>
      useCamera(ref, props.center, props.scale, setCenter, setScale, onSettle, false),
    { initialProps: start },
  )
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

    wheel(100)
    wheel(100)
    wheel(-50)
    expect(frames.size).toBe(1)

    runFrame()
    const target = Math.exp(0.1) * Math.exp(0.1) * Math.exp(-0.05)
    expect(latest().scale).toBeGreaterThan(1)
    expect(latest().scale).toBeLessThan(target)

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

    for (let i = 0; i < 10; i++) {
      wheel(0.2)
    }

    runUntilStill()
    expect(latest().scale).toBeCloseTo(Math.exp(0.002), 12)

    await unmount()
  })

  it("stops at the scale limits without starting an animation", async () => {
    const zoomedOut = await renderCamera({ center: [0, 0], scale: 99 })
    wheel(1000)
    runUntilStill()
    expect(zoomedOut.latest().scale).toBe(100)
    await zoomedOut.unmount()

    const atMax = await renderCamera({ center: [0, 0], scale: 100 })
    wheel(100)
    expect(frames.size).toBe(0)
    expect(atMax.setScale).not.toHaveBeenCalled()
    await atMax.unmount()

    const atMin = await renderCamera({ center: [0, 0], scale: 0.01 })
    wheel(-100)
    expect(frames.size).toBe(0)
    expect(atMin.setScale).not.toHaveBeenCalled()
    await atMin.unmount()
  })

  it("ends a zoom at scale 0.02 without a jump at the edge of the plane", async () => {
    const { setScale, latest, unmount } = await renderCamera({ center: [0, 0], scale: 0.02 })
    wheel(-100)
    runUntilStill()
    expect(latest().scale).toBe(0.02 * Math.exp(-0.1))

    const scales = [0.02, ...setScale.mock.calls.map(([s]) => s)]
    const edgeShift = (i: number) => 200 * Math.abs((scales[i - 1] ?? 0) / (scales[i] ?? 1) - 1)
    expect(scales.length).toBeGreaterThan(5)
    expect(edgeShift(scales.length - 1)).toBeLessThan(1)

    await unmount()
  })

  it("keeps the plane point under the cursor in place while zooming", async () => {
    const start: Camera = { center: [2, -1], scale: 1 }
    const { latest, unmount } = await renderCamera(start)

    const [x, y] = [450, 90]
    const underCursor = planePointAt(start, x, y)
    wheel(-300, x, y)

    for (let i = 0; i < 1000 && frames.size > 0; i++) {
      runFrame()
      const [px, py] = planePointAt(latest(), x, y)
      expect(px).toBeCloseTo(underCursor[0], 9)
      expect(py).toBeCloseTo(underCursor[1], 9)
    }

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

    wheel(100, 350, 120)
    runFrame()
    runFrame()
    expect(setScale).toHaveBeenCalledTimes(2)
    expect(onSettle).not.toHaveBeenCalled()

    wheel(100, 350, 120)
    runUntilStill()

    expect(onSettle).toHaveBeenCalledTimes(1)
    const lastScaleWrite = setScale.mock.invocationCallOrder.at(-1) ?? 0
    expect(onSettle.mock.invocationCallOrder[0]).toBeGreaterThan(lastScaleWrite)

    await unmount()
  })

  it("zooms from where back or forward left the camera", async () => {
    const { rerender, latest, unmount } = await renderCamera({ center: [0, 0], scale: 1 })

    wheel(100)
    runUntilStill()
    expect(latest().scale).toBeCloseTo(Math.exp(0.1), 12)
    await rerender(latest())

    const afterBack: Camera = { center: [3, 4], scale: 2 }
    await rerender(afterBack)

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

    wheel(100, 350, 120)
    runFrame()
    await unmount()
    expect(frames.size).toBe(0)
    setCenter.mockClear()
    setScale.mockClear()

    wheel(100, 350, 120)
    runFrame()
    expect(frames.size).toBe(0)
    expect(setCenter).not.toHaveBeenCalled()
    expect(setScale).not.toHaveBeenCalled()
    expect(onSettle).not.toHaveBeenCalled()
  })
})

describe("useCamera pan and glide", () => {
  it("moves the plane with a drag, one write per frame however many moves land in it", async () => {
    const { setCenter, latest, unmount } = await renderCamera({ center: [0, 0], scale: 1 })

    down(300, 200)
    move(310, 200)
    move(325, 210)
    expect(setCenter).not.toHaveBeenCalled()

    runFrame()
    expect(setCenter).toHaveBeenCalledTimes(1)
    expect(latest().center[0]).toBeCloseTo(-1, 12)
    expect(latest().center[1]).toBeCloseTo(0.4, 12)

    expect(frames.size).toBe(0)

    await unmount()
  })

  it("stops without a glide when the pointer is held still before letting go", async () => {
    const { onSettle, latest, unmount } = await renderCamera({ center: [0, 0], scale: 1 })

    down(300, 200)
    for (let i = 1; i <= 5; i++) {
      runFrame()
      move(300 + 20 * i, 200)
    }
    runFrame()
    expect(latest().center[0]).toBeCloseTo(-4, 12)

    for (let i = 0; i < 6; i++) {
      runFrame()
    }
    up(400, 200)

    runUntilStill()
    expect(latest().center[0]).toBeCloseTo(-4, 12)
    expect(onSettle).toHaveBeenCalledTimes(1)

    await unmount()
  })

  it("stops without a glide when the mouse twitches as it lets go after a pause", async () => {
    const { onSettle, latest, unmount } = await renderCamera({ center: [0, 0], scale: 1 })

    down(300, 200)
    for (let i = 1; i <= 5; i++) {
      runFrame()
      move(300 + 20 * i, 200)
    }
    runFrame()
    expect(latest().center[0]).toBeCloseTo(-4, 12)

    for (let i = 0; i < 30; i++) {
      runFrame()
    }

    move(401, 200)
    up(401, 200)

    runUntilStill()
    expect(latest().center[0]).toBeCloseTo(-4.04, 12)
    expect(onSettle).toHaveBeenCalledTimes(1)

    await unmount()
  })

  it("drags at the scale a zoom has reached and never jumps back", async () => {
    const { setCenter, latest, unmount } = await renderCamera({ center: [0, 0], scale: 1 })

    wheel(500)
    runFrame()
    runFrame()
    const midZoom = latest()
    expect(midZoom.scale).toBeGreaterThan(1)
    expect(midZoom.scale).toBeLessThan(Math.exp(0.5))

    down(300, 200)
    move(325, 200)
    runFrame()
    expect(latest().center[0]).toBeCloseTo(-midZoom.scale, 12)

    runFrame()
    move(350, 200)
    runFrame()
    up(350, 200)
    runUntilStill()

    const xs = centerXs(setCenter)
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i]).toBeLessThan(xs[i - 1] ?? 0)
    }
    expect(latest().scale).toBeCloseTo(Math.exp(0.5), 12)

    await unmount()
  })

  it("glides and zooms together on one animation until both stop", async () => {
    const { setCenter, onSettle, latest, unmount } = await renderCamera({ center: [0, 0], scale: 1 })

    flickRight()
    wheel(300)

    for (let i = 0; i < 1000 && frames.size > 0; i++) {
      expect(frames.size).toBe(1)
      runFrame()
    }
    expect(frames.size).toBe(0)

    const xs = centerXs(setCenter)
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i]).toBeLessThan(xs[i - 1] ?? 0)
    }
    expect(latest().center[1]).toBe(0)
    expect(latest().scale).toBeCloseTo(Math.exp(0.3), 12)
    expect(onSettle).toHaveBeenCalledTimes(1)

    await unmount()
  })

  it("zooms about the cursor during a glide and lets the glide carry on", async () => {
    const glideOnly = await renderCamera({ center: [0, 0], scale: 1 })
    flickRight()
    const glideSteps: number[] = []
    for (let i = 0; i < 1000 && frames.size > 0; i++) {
      const before = glideOnly.latest()
      runFrame()
      glideSteps.push((before.center[0] - glideOnly.latest().center[0]) * unscaledUnitSize)
    }
    expect(glideSteps.length).toBeGreaterThan(20)
    await glideOnly.unmount()

    const { latest, unmount } = await renderCamera({ center: [0, 0], scale: 1 })
    flickRight()
    const [x, y] = [450, 90]
    wheel(-300, x, y)

    for (let i = 0; i < 1000 && frames.size > 0; i++) {
      const underCursor = planePointAt(latest(), x, y)
      runFrame()
      const [sx, sy] = pagePointOf(latest(), underCursor)
      expect(sx - x).toBeCloseTo(glideSteps[i] ?? 0, 9)
      expect(sy).toBeCloseTo(y, 9)
    }
    expect(latest().scale).toBeCloseTo(Math.exp(-0.3), 12)

    await unmount()
  })

  it("stops a glide when the plane is caught, and lets a zoom finish", async () => {
    const { onSettle, latest, unmount } = await renderCamera({ center: [0, 0], scale: 1 })

    flickRight()
    wheel(300)
    runFrame()
    runFrame()

    down(300, 200)
    const caught = latest().center
    runUntilStill()
    expect(latest().center).toEqual(caught)
    expect(latest().scale).toBeCloseTo(Math.exp(0.3), 12)

    expect(onSettle).not.toHaveBeenCalled()
    up(300, 200)
    runUntilStill()
    expect(onSettle).toHaveBeenCalledTimes(1)

    await unmount()
  })

  it("writes the url once, after a drag, zoom and glide have all stopped", async () => {
    const { setCenter, onSettle, latest, unmount } = await renderCamera({ center: [0, 0], scale: 1 })

    down(300, 200)
    runFrame()
    move(320, 200)
    runFrame()
    wheel(200)
    runUntilStill()
    expect(latest().scale).toBeCloseTo(Math.exp(0.2), 12)
    expect(onSettle).not.toHaveBeenCalled()

    for (let i = 1; i <= 3; i++) {
      runFrame()
      move(320 + 20 * i, 200)
    }
    runFrame()
    up(380, 200)
    expect(onSettle).not.toHaveBeenCalled()

    runUntilStill()
    expect(onSettle).toHaveBeenCalledTimes(1)
    const lastCenterWrite = setCenter.mock.invocationCallOrder.at(-1) ?? 0
    expect(onSettle.mock.invocationCallOrder[0]).toBeGreaterThan(lastCenterWrite)

    await unmount()
  })

  it("stops gliding when the plane unmounts", async () => {
    const { setCenter, onSettle, unmount } = await renderCamera({ center: [0, 0], scale: 1 })

    flickRight()
    runFrame()
    await unmount()
    expect(frames.size).toBe(0)
    setCenter.mockClear()

    runFrame()
    down(300, 200)
    move(340, 200)
    runFrame()
    expect(frames.size).toBe(0)
    expect(setCenter).not.toHaveBeenCalled()
    expect(onSettle).not.toHaveBeenCalled()
  })
})
