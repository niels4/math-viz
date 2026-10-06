import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest"

import { act, render, toElement } from "#test"

import type { PlaneScene } from "./scene.ts"

import { CartesianPlane } from "./CartesianPlane"
import { drawCartesianPlane } from "./drawCartesianPlane"

vi.mock("./drawCartesianPlane", () => ({
  drawCartesianPlane: vi.fn<(props: { zoom: number; panX: number; panY: number }) => void>(),
}))

const EMPTY_SCENE: PlaneScene = { curves: [], points: [] }

const drawMock = drawCartesianPlane as unknown as Mock
const lastDraw = () => drawMock.mock.calls.at(-1)?.[0] as { zoom: number; panX: number; panY: number }

const stubCtx = new Proxy(
  {},
  {
    get: () => () => {},
    set: () => true,
  },
)

const pointer = (type: string, init: { pointerId: number; clientX: number; clientY: number }) =>
  new PointerEvent(type, { bubbles: true, ...init })

const down = (canvas: HTMLCanvasElement, pointerId: number, x: number, y: number) => {
  canvas.dispatchEvent(pointer("pointerdown", { pointerId, clientX: x, clientY: y }))
}

const move = (canvas: HTMLCanvasElement, pointerId: number, x: number, y: number) => {
  canvas.dispatchEvent(pointer("pointermove", { pointerId, clientX: x, clientY: y }))
}

const up = (canvas: HTMLCanvasElement, pointerId: number, x: number, y: number) => {
  canvas.dispatchEvent(pointer("pointerup", { pointerId, clientX: x, clientY: y }))
}

const rectOf = (width: number, height: number) =>
  ({
    x: 0,
    y: 0,
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    toJSON: () => {},
  }) as unknown as DOMRect

const zeroRect = () => rectOf(0, 0)

describe("CartesianPlane pinch zoom", () => {
  beforeEach(() => {
    drawMock.mockClear()
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      stubCtx as unknown as CanvasRenderingContext2D,
    )
    // Unconditional: real Chromium implements these but throws for synthetic
    // pointerIds, and `??=` would keep the throwing version in browsers.
    HTMLCanvasElement.prototype.setPointerCapture = () => {}
    HTMLCanvasElement.prototype.releasePointerCapture = () => {}
    HTMLCanvasElement.prototype.hasPointerCapture = () => false
    // jsdom rects are zero; stub the same in real Chromium so the origin
    // doubles as the view center and pan math stays layout-independent.
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(zeroRect())
  })

  it("applies the exact finger-distance ratio when moves share one closure", async () => {
    const screen = await render(<CartesianPlane scene={EMPTY_SCENE} />)
    const canvas = toElement(screen.getByTestId("cartesian-canvas")) as HTMLCanvasElement
    // jsdom rects are zero, so the origin doubles as the view center: spread
    // symmetrically about it and pan must stay put while zoom telescopes.
    // Everything inside one act shares a single render closure, like rapid
    // touch input that batches before React commits.
    act(() => {
      down(canvas, 1, -100, 0)
      down(canvas, 2, 100, 0)
      for (let s = 110; s <= 150; s += 10) {
        move(canvas, 1, -s, 0)
        move(canvas, 2, s, 0)
      }
    })
    // Spread 200px to 300px stays clear of the min/max clamp.
    expect(lastDraw().zoom).toBeCloseTo(50 * (300 / 200), 8)
    expect(lastDraw().panX).toBeCloseTo(0, 8)
    expect(lastDraw().panY).toBeCloseTo(0, 8)
  })

  it("returns to the starting frame after an exact reverse", async () => {
    const screen = await render(<CartesianPlane scene={EMPTY_SCENE} />)
    const canvas = toElement(screen.getByTestId("cartesian-canvas")) as HTMLCanvasElement
    act(() => {
      down(canvas, 1, -100, 0)
      down(canvas, 2, 100, 0)
      for (let s = 110; s <= 150; s += 10) {
        move(canvas, 1, -s, 0)
        move(canvas, 2, s, 0)
      }
    })
    act(() => {
      for (let s = 140; s >= 100; s -= 10) {
        move(canvas, 1, -s, 0)
        move(canvas, 2, s, 0)
      }
      up(canvas, 1, -100, 0)
      up(canvas, 2, 100, 0)
    })
    expect(lastDraw().zoom).toBeCloseTo(50, 8)
    expect(lastDraw().panX).toBeCloseTo(0, 8)
    expect(lastDraw().panY).toBeCloseTo(0, 8)
  })

  describe("CartesianPlane release inertia", () => {
    let now = 0
    let raf = vi.fn<(callback: FrameRequestCallback) => number>()

    beforeEach(() => {
      now = 1000
      vi.spyOn(performance, "now").mockImplementation(() => now)
      raf = vi.fn<(callback: FrameRequestCallback) => number>()
      vi.stubGlobal("requestAnimationFrame", raf)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
      vi.restoreAllMocks()
    })

    it("quick pinch release schedules no inertia", async () => {
      const screen = await render(<CartesianPlane scene={EMPTY_SCENE} />)
      const canvas = toElement(screen.getByTestId("cartesian-canvas")) as HTMLCanvasElement
      // Fast spread with both fingers still traveling at lift-off: the
      // few-ms release window would otherwise read pinch speed as fling.
      act(() => {
        down(canvas, 1, -100, 0)
        down(canvas, 2, 100, 0)
        now += 10
        move(canvas, 1, -150, 0)
        now += 10
        move(canvas, 2, 150, 0)
        now += 10
        up(canvas, 1, -160, 0)
        now += 5
        up(canvas, 2, 170, 0)
      })
      expect(raf).not.toHaveBeenCalled()
    })

    it("fast single-finger flick still schedules inertia", async () => {
      const screen = await render(<CartesianPlane scene={EMPTY_SCENE} />)
      const canvas = toElement(screen.getByTestId("cartesian-canvas")) as HTMLCanvasElement
      act(() => {
        down(canvas, 1, 0, 0)
        now += 30
        move(canvas, 1, 90, 0)
        now += 30
        move(canvas, 1, 180, 0)
        now += 30
        up(canvas, 1, 180, 0)
      })
      expect(raf).toHaveBeenCalled()
    })
  })

  it("single-finger drag still pans", async () => {
    const screen = await render(<CartesianPlane scene={EMPTY_SCENE} />)
    const canvas = toElement(screen.getByTestId("cartesian-canvas")) as HTMLCanvasElement
    act(() => {
      down(canvas, 1, 100, 100)
      move(canvas, 1, 120, 110)
      move(canvas, 1, 140, 120)
      up(canvas, 1, 140, 120)
    })
    // Dragged right 40px and down 20px at zoom 50 (screen y grows downward).
    expect(lastDraw().panX).toBeCloseTo(40 / 50, 8)
    expect(lastDraw().panY).toBeCloseTo(-20 / 50, 8)
  })
})

describe("CartesianPlane pointer", () => {
  beforeEach(() => {
    drawMock.mockClear()
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      stubCtx as unknown as CanvasRenderingContext2D,
    )
    HTMLCanvasElement.prototype.setPointerCapture = () => {}
    HTMLCanvasElement.prototype.releasePointerCapture = () => {}
    HTMLCanvasElement.prototype.hasPointerCapture = () => false
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(zeroRect())
  })

  it("reports the math point under the cursor and clears it on leave", async () => {
    const onPointer = vi.fn<(point: { x: number; y: number } | null) => void>()
    const screen = await render(<CartesianPlane scene={EMPTY_SCENE} onPointer={onPointer} />)
    const canvas = toElement(screen.getByTestId("cartesian-canvas")) as HTMLCanvasElement
    act(() => {
      // No pointerdown: the zoom handlers ignore it, hover still reports.
      move(canvas, 9, 100, 40)
    })
    // Zero rect + zoom 50: the origin sits at (0, 0), screen y grows down.
    expect(onPointer).toHaveBeenLastCalledWith({ x: 2, y: -0.8 })
    act(() => {
      // React derives onPointerLeave from pointerout, not pointerleave.
      canvas.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, relatedTarget: document.body }))
    })
    expect(onPointer).toHaveBeenLastCalledWith(null)
  })
})

describe("CartesianPlane view controls", () => {
  beforeEach(() => {
    drawMock.mockClear()
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      stubCtx as unknown as CanvasRenderingContext2D,
    )
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(zeroRect())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const key = (el: Element, k: string) => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }))
  }

  it("pans one grid square per arrow, zooms through the stops, 0 resets", async () => {
    const screen = await render(<CartesianPlane scene={EMPTY_SCENE} />)
    const plane = toElement(screen.getByTestId("cartesian-plane"))
    act(() => {
      key(plane, "ArrowRight")
      key(plane, "ArrowUp")
    })
    // One minor square (0.5 at 50 px per unit): the view moves right and up.
    expect(lastDraw().panX).toBeCloseTo(-0.5, 8)
    expect(lastDraw().panY).toBeCloseTo(-0.5, 8)
    act(() => {
      key(plane, "+")
    })
    expect(lastDraw().zoom).toBe(62.5)
    act(() => {
      key(plane, "-")
      key(plane, "-")
    })
    expect(lastDraw().zoom).toBe(40)
    act(() => {
      key(plane, "0")
    })
    expect(lastDraw()).toMatchObject({ zoom: 50, panX: 0, panY: 0 })
  })

  it("steps the zoom from its control and prints it", async () => {
    const screen = await render(<CartesianPlane scene={EMPTY_SCENE} />)
    const readout = () => toElement(screen.getByTestId("plane-zoom")).textContent
    expect(readout()).toBe("100%")
    act(() => {
      ;(toElement(screen.getByTestId("plane-zoom-out")) as HTMLButtonElement).click()
    })
    expect(lastDraw().zoom).toBe(40)
    expect(readout()).toBe("80%")
  })

  it("defaults to the zoom that keeps y ∈ [−5, 5] in view (D17)", async () => {
    // R9's dock plane: 1256 × 408 → 40 px per unit.
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(rectOf(1256, 408))
    const screen = await render(<CartesianPlane scene={EMPTY_SCENE} />)
    expect(lastDraw().zoom).toBe(40)
    expect(toElement(screen.getByTestId("plane-zoom")).textContent).toBe("80%")
  })
})
