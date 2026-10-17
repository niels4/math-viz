import type { RefObject } from "react"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useQueryParam } from "#src/components/router/queryParamAtom.ts"
import { getCurrentSearchParams } from "#src/components/router/router-hooks.ts"
import { act, renderHook, updateLocationHash } from "#test"

import { centerParam, scaleParam } from "./queryParams"
import { useCamera } from "./useCamera"

// The camera wired to the url params the way CartesianPlane wires it.
const usePlaneCamera = (ref: RefObject<HTMLCanvasElement | null>) => {
  const [center, setCenter, flushCenter] = useQueryParam(centerParam)
  const [scale, setScale, flushScale] = useQueryParam(scaleParam)
  useCamera(ref, center, scale, setCenter, setScale, () => {
    flushCenter()
    flushScale()
  })
  return { center, scale }
}

// The canvas is 400 by 300 px at (100, 50), so its center is at (300, 200).
const canvasCenterX = 300
const canvasCenterY = 200

let canvas: HTMLCanvasElement
let ref: RefObject<HTMLCanvasElement | null>

// Animation frames run only when a test calls runFrame, 16 ms apart, and
// the url params' 200 ms debounce runs on the same clock.
let frames = new Map<number, FrameRequestCallback>()
let nextFrameId = 1
let frameTime = 0

const runFrame = () => {
  frameTime += 16
  // Timers due before the frame fire first, and React renders what they
  // did before the frame runs, as it does between two browser frames.
  act(() => {
    vi.advanceTimersByTime(16)
  })
  act(() => {
    const callbacks = [...frames.values()]
    frames.clear()
    for (const callback of callbacks) {
      callback(frameTime)
    }
  })
}

const dispatch = (event: Event) => {
  // Stamped with the test clock, as a real event carries the time it happened.
  Object.defineProperty(event, "timeStamp", { value: frameTime })
  act(() => {
    canvas.dispatchEvent(event)
  })
}
const wheel = (deltaY: number) =>
  dispatch(new WheelEvent("wheel", { deltaY, clientX: canvasCenterX, clientY: canvasCenterY }))
const pointer = (type: string, clientX: number) =>
  dispatch(
    new PointerEvent(type, {
      pointerId: 1,
      pointerType: "mouse",
      button: 0,
      clientX,
      clientY: canvasCenterY,
    }),
  )
const down = (clientX: number) => pointer("pointerdown", clientX)
const move = (clientX: number) => pointer("pointermove", clientX)
const up = (clientX: number) => pointer("pointerup", clientX)

const url = () => Object.fromEntries(getCurrentSearchParams())

// Also returns every scale React rendered, which is every scale the plane
// drew.
const renderPlaneCamera = async (hash: string) => {
  await updateLocationHash(hash)
  const drawnScales: number[] = []
  const hook = await renderHook(() => {
    const camera = usePlaneCamera(ref)
    drawnScales.push(camera.scale)
    return camera
  })
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
  return { ...hook, drawnScales }
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
    DOMRect.fromRect({ x: 100, y: 50, width: 400, height: 300 }),
  )
  ref = { current: canvas }
})

afterEach(async () => {
  vi.useRealTimers()
  canvas.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  await updateLocationHash("")
})

describe("useCamera with the url params", () => {
  it("keeps zooming smoothly when a drag lets go mid-zoom", async () => {
    const { result, drawnScales, unmount } = await renderPlaneCamera("#?center=1.0000,2.0000&scale=1.00")

    // A drag 60 px right at scale 1, where a unit is 25 px wide.
    down(300)
    for (let i = 1; i <= 3; i++) {
      runFrame()
      move(300 + 20 * i)
    }
    runFrame()
    expect(result.current.center[0]).toBeCloseTo(-1.4, 12)
    expect(result.current.center[1]).toBe(2)

    // A wheel notch at the canvas center zooms out toward scale e^0.5, and
    // the pointer rests a moment and lets go while the zoom runs.
    wheel(500)
    for (let i = 0; i < 6; i++) {
      runFrame()
    }
    up(360)

    // The zoom eases on. Its center stopped changing, so the center reaches
    // the url first: for a while the url has the new center and still says
    // scale 1.
    let sawNewCenterWithOldScale = false
    for (let i = 0; i < 1000 && frames.size > 0; i++) {
      runFrame()
      const { center, scale } = url()
      if (center === "-1.4000,2.0000" && scale === "1.00") {
        sawNewCenterWithOldScale = true
      }
    }
    expect(sawNewCenterWithOldScale).toBe(true)

    // The plane drew a growing scale every frame, never a step back to 1.
    for (let i = 1; i < drawnScales.length; i++) {
      expect(drawnScales[i]).toBeGreaterThanOrEqual(drawnScales[i - 1] ?? 0)
    }

    // At rest, the url has both.
    expect(result.current.scale).toBeCloseTo(Math.exp(0.5), 12)
    expect(url()).toEqual({ center: "-1.4000,2.0000", scale: "1.65" })

    vi.useRealTimers()
    await unmount()
  })

  it("keeps the zoom when a drag lets go just after the zoom stops", async () => {
    const { result, unmount } = await renderPlaneCamera("#?center=1.0000,2.0000&scale=1.00")

    // The pointer goes down and a wheel notch at the canvas center zooms
    // out toward scale e^0.5.
    down(300)
    wheel(500)

    // A slow drag, 1 px a frame, goes on until the zoom reaches its target.
    // Center and scale change every frame, so neither has reached the url.
    let x = 300
    for (let i = 0; i < 1000 && frames.size > 0; i++) {
      x += 1
      move(x)
      runFrame()
    }
    expect(result.current.scale).toBe(Math.exp(0.5))
    expect(url()).toEqual({ center: "1.0000,2.0000", scale: "1.00" })

    // The pointer lets go a frame later, while the scale still waits for
    // its url write. The camera comes to rest and writes both.
    up(x)
    runFrame()
    expect(frames.size).toBe(0)

    // The url keeps the new scale, and so does the plane.
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.scale).toBe(Math.exp(0.5))
    expect(url()).toEqual({ center: `${result.current.center[0].toFixed(4)},2.0000`, scale: "1.65" })

    vi.useRealTimers()
    await unmount()
  })
})
