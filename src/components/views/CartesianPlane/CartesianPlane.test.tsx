import { createRef, useState, type Ref } from "react"
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest"

import { act, render, selectionMayStart, toElement } from "#test"

import type { PlaneScene } from "./scene.ts"

import { CartesianPlane, type CartesianPlaneHandle, type PlanePointer } from "./CartesianPlane"
import { drawCartesianPlane } from "./drawCartesianPlane"
import { wheelView } from "./util.ts"

vi.mock("./drawCartesianPlane", () => ({
  drawCartesianPlane: vi.fn<(props: { zoom: number; panX: number; panY: number }) => void>(),
}))

const EMPTY_SCENE: PlaneScene = { curves: [], points: [], guides: [] }

const drawMock = drawCartesianPlane as unknown as Mock
const lastDraw = () => drawMock.mock.calls.at(-1)?.[0] as { zoom: number; panX: number; panY: number }

// Every context call is a no-op; text measures 0 px wide.
const stubCtx = new Proxy(
  {},
  {
    get: (_, key) => (key === "measureText" ? () => ({ width: 0 }) : () => {}),
    set: () => true,
  },
)

// A finger stays down from pointerdown to pointerup: its moves hold a button, as real ones do.
const pointer = (type: string, init: { pointerId: number; clientX: number; clientY: number }) =>
  new PointerEvent(type, { bubbles: true, buttons: type === "pointerup" ? 0 : 1, ...init })

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

// The tests set the plane's size through getBoundingClientRect. In real
// Chromium a ResizeObserver would then report the element's laid-out size
// over it, a race the browser project loses now and then: no observer here.
beforeEach(() => {
  vi.stubGlobal("ResizeObserver", undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

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
    const onPointer = vi.fn<(pointer: PlanePointer | null) => void>()
    const screen = await render(<CartesianPlane scene={EMPTY_SCENE} onPointer={onPointer} />)
    const canvas = toElement(screen.getByTestId("cartesian-canvas")) as HTMLCanvasElement
    act(() => {
      // No pointerdown: the zoom handlers ignore it, hover still reports.
      move(canvas, 9, 100, 40)
    })
    // Zero rect + zoom 50: the origin sits at (0, 0), screen y grows down.
    expect(onPointer).toHaveBeenLastCalledWith({ x: 2, y: -0.8, over: null, panning: false })
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

  it("stacks + over − and shows no number; the zoom stays with screen readers (the user's ruling)", async () => {
    const screen = await render(<CartesianPlane scene={EMPTY_SCENE} />)
    const control = toElement(screen.getByTestId("plane-zoom-control"))
    expect([...control.querySelectorAll("button")].map((b) => b.getAttribute("aria-label"))).toEqual([
      "Zoom in",
      "Zoom out",
    ])
    act(() => {
      ;(toElement(screen.getByTestId("plane-zoom-out")) as HTMLButtonElement).click()
    })
    expect(lastDraw().zoom).toBe(40)
    expect(control.getAttribute("aria-valuetext")).toBe("80%")
    const status = toElement(screen.getByTestId("plane-zoom"))
    expect(status.textContent).toBe("80%")
    // Unseen: 1 px, clipped (jsdom lays out nothing; the browser project measures it).
    expect(status.getBoundingClientRect().width).toBeLessThanOrEqual(1)
  })

  it("returns to the origin from its button, keeping the zoom (the user's ruling)", async () => {
    const screen = await render(<CartesianPlane scene={EMPTY_SCENE} />)
    const plane = toElement(screen.getByTestId("cartesian-plane"))
    act(() => {
      key(plane, "ArrowRight")
      key(plane, "ArrowDown")
      key(plane, "+")
    })
    expect(lastDraw()).toMatchObject({ zoom: 62.5 })
    expect(lastDraw().panX).not.toBe(0)
    const origin = toElement(screen.getByTestId("plane-origin")) as HTMLButtonElement
    expect(origin.getAttribute("aria-label")).toBe("Return to origin")
    act(() => {
      origin.click()
    })
    expect(lastDraw()).toMatchObject({ zoom: 62.5, panX: 0, panY: 0 })
  })

  it("takes one tab stop for the origin, then one for its zoom control, a spin button over the stops (FV 07)", async () => {
    const screen = await render(<CartesianPlane scene={EMPTY_SCENE} />)
    const control = toElement(screen.getByTestId("plane-zoom-control"))
    const origin = toElement(screen.getByTestId("plane-origin"))
    expect(origin.tabIndex).toBe(0)
    expect(origin.compareDocumentPosition(control) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(control.getAttribute("role")).toBe("spinbutton")
    expect(control.tabIndex).toBe(0)
    expect(toElement(screen.getByTestId("plane-zoom-out")).tabIndex).toBe(-1)
    expect(toElement(screen.getByTestId("plane-zoom-in")).tabIndex).toBe(-1)
    expect(control.getAttribute("aria-valuetext")).toBe("100%")
    act(() => {
      key(control, "ArrowUp")
    })
    expect(lastDraw().zoom).toBe(62.5)
    expect(control.getAttribute("aria-valuenow")).toBe("125")
    act(() => {
      key(control, "ArrowLeft")
      key(control, "-")
    })
    expect(lastDraw().zoom).toBe(40)
    expect(control.getAttribute("aria-valuetext")).toBe("80%")
    // A key with Ctrl stays the browser's (page zoom).
    const event = new KeyboardEvent("keydown", { key: "+", ctrlKey: true, bubbles: true, cancelable: true })
    act(() => {
      control.dispatchEvent(event)
    })
    expect(event.defaultPrevented).toBe(false)
    expect(lastDraw().zoom).toBe(40)
  })

  it("defaults to the zoom that keeps y ∈ [−5, 5] in view (D17)", async () => {
    // R9's plane: 1256 × 408 → 40 px per unit.
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(rectOf(1256, 408))
    const screen = await render(<CartesianPlane scene={EMPTY_SCENE} />)
    expect(lastDraw().zoom).toBe(40)
    expect(toElement(screen.getByTestId("plane-zoom")).textContent).toBe("80%")
  })
})

describe("CartesianPlane marks", () => {
  // A 600 × 600 plane at 100 % (D17 keeps 50 px per unit): the origin at
  // (300, 300). The chrome measures empty, so nothing keeps marks away.
  beforeEach(() => {
    drawMock.mockClear()
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      stubCtx as unknown as CanvasRenderingContext2D,
    )
    HTMLCanvasElement.prototype.setPointerCapture = () => {}
    HTMLCanvasElement.prototype.releasePointerCapture = () => {}
    HTMLCanvasElement.prototype.hasPointerCapture = () => false
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
      return this.closest("[data-keep-out]") === null ? rectOf(600, 600) : zeroRect()
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const press = (canvas: HTMLCanvasElement, type: string, x: number, y: number, buttons: number) =>
    canvas.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        pointerId: 1,
        isPrimary: true,
        button: 0,
        buttons,
        clientX: x,
        clientY: y,
      }),
    )

  const POINT_SCENE: PlaneScene = {
    curves: [],
    points: [{ id: "m", x: 1, y: 1, style: "bullseye", ink: "chartPoint1", draggable: true }],
    guides: [],
  }

  it("drags a draggable point instead of panning, and says where the pointer moved it", async () => {
    const onMarkDrag = vi.fn<(phase: string, id: string, to: { x: number; y: number }) => void>()
    const onPointer = vi.fn<(pointer: PlanePointer | null) => void>()
    const screen = await render(
      <CartesianPlane scene={POINT_SCENE} onMarkDrag={onMarkDrag} onPointer={onPointer} />,
    )
    const canvas = toElement(screen.getByTestId("cartesian-canvas")) as HTMLCanvasElement
    act(() => {
      // Over the point, 4 px off its centre (350, 250): its 48 px box takes the pointer.
      press(canvas, "pointermove", 354, 246, 0)
    })
    expect(onPointer).toHaveBeenLastCalledWith({ x: 1.08, y: 1.08, over: "m", panning: false })
    expect(canvas.dataset["cursor"]).toBe("grab")
    act(() => {
      press(canvas, "pointerdown", 354, 246, 1)
    })
    expect(onMarkDrag).toHaveBeenLastCalledWith("start", "m", { x: 1, y: 1 })
    expect(canvas.dataset["cursor"]).toBe("grabbing")
    act(() => {
      press(canvas, "pointermove", 404, 246, 1)
    })
    // The grab's 4 px offset stays: the point moves as far as the pointer.
    expect(onMarkDrag).toHaveBeenLastCalledWith("move", "m", { x: 2, y: 1 })
    expect(lastDraw().panX).toBe(0)
    act(() => {
      press(canvas, "pointerup", 404, 246, 0)
    })
    expect(onMarkDrag.mock.calls.at(-1)?.[0]).toBe("end")
  })

  it("drags a handle freely, Shift locking it to the axis it moved along most (FV 11)", async () => {
    const scene: PlaneScene = {
      curves: [],
      points: [],
      guides: [],
      handles: [{ id: "grip", x: 1, y: 1, shape: "square", ink: "primary" }],
    }
    const onMarkDrag = vi.fn<(phase: string, id: string, to: { x: number; y: number }) => void>()
    const onPointer = vi.fn<(pointer: PlanePointer | null) => void>()
    const screen = await render(
      <CartesianPlane scene={scene} onMarkDrag={onMarkDrag} onPointer={onPointer} />,
    )
    const canvas = toElement(screen.getByTestId("cartesian-canvas")) as HTMLCanvasElement
    expect(canvas.dataset["handles"]).toBe("grip")
    const at = (type: string, x: number, y: number, buttons: number, shiftKey = false) =>
      canvas.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          pointerId: 1,
          isPrimary: true,
          button: 0,
          buttons,
          clientX: x,
          clientY: y,
          shiftKey,
        }),
      )
    act(() => {
      // 20 px off the grip's centre (350, 250) is still inside its 44 px box.
      at("pointermove", 370, 250, 0)
    })
    expect(onPointer).toHaveBeenLastCalledWith(expect.objectContaining({ over: "grip" }))
    expect(canvas.dataset["cursor"]).toBe("grab")
    act(() => {
      at("pointerdown", 370, 250, 1)
      at("pointermove", 395, 225, 1)
    })
    expect(onMarkDrag).toHaveBeenLastCalledWith("move", "grip", { x: 1.5, y: 1.5 })
    act(() => {
      at("pointermove", 420, 240, 1, true)
    })
    // Shift: x moved 1, y 0.2 since the press, so only x follows.
    expect(onMarkDrag).toHaveBeenLastCalledWith("move", "grip", { x: 2, y: 1 })
    act(() => {
      at("pointerup", 420, 240, 0)
    })
    expect(onMarkDrag.mock.calls.at(-1)?.slice(0, 2)).toEqual(["end", "grip"])
  })

  it("ends a point's drag on a move with no button held", async () => {
    const onMarkDrag = vi.fn<(phase: string, id: string, to: { x: number; y: number }) => void>()
    const screen = await render(<CartesianPlane scene={POINT_SCENE} onMarkDrag={onMarkDrag} />)
    const canvas = toElement(screen.getByTestId("cartesian-canvas")) as HTMLCanvasElement
    act(() => {
      press(canvas, "pointerdown", 350, 250, 1)
      press(canvas, "pointermove", 360, 250, 0)
    })
    expect(onMarkDrag.mock.calls.map(([phase]) => phase)).toEqual(["start", "end"])
  })

  it("pans from the empty plane and says so while it does (a probe hides)", async () => {
    const onPointer = vi.fn<(pointer: PlanePointer | null) => void>()
    const screen = await render(<CartesianPlane scene={POINT_SCENE} onPointer={onPointer} />)
    const canvas = toElement(screen.getByTestId("cartesian-canvas")) as HTMLCanvasElement
    act(() => {
      press(canvas, "pointermove", 100, 100, 0)
    })
    expect(canvas.dataset["cursor"]).toBe("probe")
    act(() => {
      press(canvas, "pointerdown", 100, 100, 1)
      press(canvas, "pointermove", 150, 100, 1)
    })
    expect(onPointer).toHaveBeenLastCalledWith(expect.objectContaining({ over: null, panning: true }))
    expect(lastDraw().panX).toBe(1)
    act(() => {
      press(canvas, "pointerup", 150, 100, 0)
    })
    expect(onPointer).toHaveBeenLastCalledWith(expect.objectContaining({ panning: false }))
  })

  // AGENTS.md › pointer-capture drags: the canvas misses a release outside
  // the window or after its capture is lost, and hears nothing when the
  // window loses focus mid-pan. The pan ends all the same: a move after it,
  // even one still holding a button, reads the plane instead of panning it.
  it.each([
    ["the window loses focus", () => window.dispatchEvent(new Event("blur"))],
    [
      "the release lands outside the plane",
      () =>
        document.body.dispatchEvent(
          new PointerEvent("pointerup", {
            bubbles: true,
            pointerId: 1,
            buttons: 0,
            clientX: 900,
            clientY: 100,
          }),
        ),
    ],
    [
      "the plane loses its pointer capture",
      (canvas: HTMLCanvasElement) =>
        canvas.dispatchEvent(new PointerEvent("lostpointercapture", { bubbles: true, pointerId: 1 })),
    ],
  ])("ends a pan when %s", async (_, lose: (canvas: HTMLCanvasElement) => void) => {
    const onPointer = vi.fn<(pointer: PlanePointer | null) => void>()
    const screen = await render(<CartesianPlane scene={POINT_SCENE} onPointer={onPointer} />)
    const canvas = toElement(screen.getByTestId("cartesian-canvas")) as HTMLCanvasElement
    act(() => {
      press(canvas, "pointerdown", 100, 100, 1)
      press(canvas, "pointermove", 150, 100, 1)
    })
    expect(lastDraw().panX).toBe(1)
    act(() => lose(canvas))
    act(() => {
      press(canvas, "pointermove", 200, 100, 1)
    })
    expect(lastDraw().panX).toBe(1)
    expect(onPointer).toHaveBeenLastCalledWith(expect.objectContaining({ panning: false }))
  })

  it("ends a pan on a move with no button held, whose release went missing", async () => {
    const onPointer = vi.fn<(pointer: PlanePointer | null) => void>()
    const screen = await render(<CartesianPlane scene={POINT_SCENE} onPointer={onPointer} />)
    const canvas = toElement(screen.getByTestId("cartesian-canvas")) as HTMLCanvasElement
    act(() => {
      press(canvas, "pointerdown", 100, 100, 1)
      press(canvas, "pointermove", 150, 100, 1)
    })
    act(() => {
      press(canvas, "pointermove", 200, 100, 0)
      press(canvas, "pointermove", 250, 100, 0)
    })
    expect(lastDraw().panX).toBe(1)
    expect(onPointer).toHaveBeenLastCalledWith(expect.objectContaining({ panning: false }))
  })

  // A trackpad can send wheel events faster than React renders: each notch
  // zooms from where the last one left the view, as one render apart.
  it("zooms one notch per wheel event, however many land before a render", async () => {
    const screen = await render(<CartesianPlane scene={EMPTY_SCENE} />)
    const canvas = toElement(screen.getByTestId("cartesian-canvas")) as HTMLCanvasElement
    act(() => {
      for (let i = 0; i < 3; i++) {
        canvas.dispatchEvent(
          new WheelEvent("wheel", {
            bubbles: true,
            cancelable: true,
            deltaY: -100,
            clientX: 450,
            clientY: 150,
          }),
        )
      }
    })
    let view = { zoom: 50, panX: 0, panY: 0 }
    for (let i = 0; i < 3; i++) {
      view =
        wheelView({ ...view, delta: -100, cursorX: 450, cursorY: 150, centerX: 300, centerY: 300 }) ?? view
    }
    expect(lastDraw().zoom).toBeCloseTo(view.zoom, 9)
    expect(lastDraw().panX).toBeCloseTo(view.panX, 9)
    expect(lastDraw().panY).toBeCloseTo(view.panY, 9)
  })

  it("selects no text while a point drags or the plane pans, until the pointer lets go", async () => {
    const onMarkDrag = vi.fn<(phase: string, id: string, to: { x: number; y: number }) => void>()
    const screen = await render(<CartesianPlane scene={POINT_SCENE} onMarkDrag={onMarkDrag} />)
    const canvas = toElement(screen.getByTestId("cartesian-canvas")) as HTMLCanvasElement
    act(() => {
      press(canvas, "pointerdown", 350, 250, 1)
      press(canvas, "pointermove", 900, 250, 1)
    })
    expect(onMarkDrag.mock.calls[0]?.[0]).toBe("start")
    expect(selectionMayStart()).toBe(false)
    act(() => {
      press(canvas, "pointerup", 900, 250, 0)
    })
    expect(selectionMayStart()).toBe(true)
    act(() => {
      press(canvas, "pointerdown", 100, 100, 1)
      press(canvas, "pointermove", -400, 100, 1)
    })
    expect(lastDraw().panX).toBe(-10)
    expect(selectionMayStart()).toBe(false)
    act(() => {
      press(canvas, "pointerup", -400, 100, 0)
    })
    expect(selectionMayStart()).toBe(true)
  })

  it("pans a point off the view into it when its edge marker is clicked", async () => {
    const scene: PlaneScene = {
      curves: [],
      points: [{ id: "far", x: 0, y: 100, style: "ring", ink: "chartPoint2", name: "F", edgeMarker: true }],
      guides: [],
    }
    const screen = await render(<CartesianPlane scene={scene} />)
    const canvas = toElement(screen.getByTestId("cartesian-canvas")) as HTMLCanvasElement
    act(() => {
      // The marker sits on the top edge, centred on x = 0, 22 px down.
      press(canvas, "pointermove", 300, 40, 0)
    })
    expect(canvas.dataset["cursor"]).toBe("link")
    act(() => {
      press(canvas, "pointerdown", 300, 40, 1)
      press(canvas, "pointerup", 300, 40, 0)
    })
    // y = 100 lands a quarter of the plane below the top: 150 px.
    expect(lastDraw().panY).toBe(-(150 + 4700) / 50)
    expect(lastDraw().panX).toBe(0)
  })

  it("hands the owner the plane's keys first, and names them", async () => {
    const onKeyDown = vi.fn<(e: { key: string }) => boolean>((e) => e.key === "[")
    const screen = await render(
      <CartesianPlane scene={EMPTY_SCENE} keyHelp="[ and ] move P" onKeyDown={onKeyDown} />,
    )
    const plane = toElement(screen.getByTestId("cartesian-plane"))
    expect(plane.getAttribute("aria-label")).toBe(
      "Plane: arrows pan, + and − zoom, 0 resets the view, [ and ] move P",
    )
    act(() => {
      plane.dispatchEvent(new KeyboardEvent("keydown", { key: "[", bubbles: true, cancelable: true }))
      plane.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }),
      )
    })
    expect(onKeyDown.mock.calls.map(([e]) => e.key)).toEqual(["[", "ArrowRight"])
    expect(lastDraw().panX).toBeCloseTo(-0.5, 9)
  })
})

describe("CartesianPlane frames", () => {
  beforeEach(() => {
    drawMock.mockClear()
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      stubCtx as unknown as CanvasRenderingContext2D,
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const REST: PlaneScene = { curves: [], points: [], guides: [] }
  const FRAME: PlaneScene = { ...REST, gridAlpha: 0.5 }
  const NEXT: PlaneScene = { ...REST, gridAlpha: 0.25 }
  const drawnScene = () => (drawMock.mock.calls.at(-1)?.[0] as { scene: PlaneScene } | undefined)?.scene

  // The owner's scene prop changes on a click, as a state change would.
  function Owner({ handle }: { handle: Ref<CartesianPlaneHandle> }) {
    const [scene, setScene] = useState(REST)
    return (
      <>
        <button type="button" data-testid="next" onClick={() => setScene(NEXT)} />
        <CartesianPlane ref={handle} scene={scene} />
      </>
    )
  }

  it("paints an owner's frame in place of the scene prop until the owner lets go", async () => {
    const handle = createRef<CartesianPlaneHandle>()
    const screen = await render(<Owner handle={handle} />)
    expect(drawnScene()).toBe(REST)
    act(() => handle.current?.drawFrame(FRAME))
    expect(drawnScene()).toBe(FRAME)
    // A new scene prop waits while the frame is held: the view changes, the frame stays.
    act(() => {
      toElement(screen.getByTestId("next")).dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    expect(drawnScene()).toBe(FRAME)
    act(() => handle.current?.drawFrame(null))
    expect(drawnScene()).toBe(NEXT)
  })
})
