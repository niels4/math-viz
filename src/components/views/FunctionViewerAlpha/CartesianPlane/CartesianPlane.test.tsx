import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest"

import { act, render, toElement } from "#test"

import { CartesianPlane } from "./CartesianPlane"
import { drawCartesianPlane } from "./drawCartesianPlane"

vi.mock("./drawCartesianPlane", () => ({
  drawCartesianPlane: vi.fn<(props: { zoom: number; panX: number; panY: number }) => void>(),
}))

const drawMock = drawCartesianPlane as unknown as Mock
const lastDraw = () => drawMock.mock.calls.at(-1)?.[0] as { zoom: number; panX: number; panY: number }

// Every context call is a no-op.
const stubCtx = new Proxy({}, { get: () => () => {}, set: () => true })

const rectOf = (width: number, height: number) =>
  ({ x: 0, y: 0, width, height, top: 0, left: 0, right: width, bottom: height, toJSON: () => {} }) as DOMRect

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

// The Alpha's plane at 600 × 600 and 50 px per unit, as the main plane's
// tests set it up; no ResizeObserver, so the stubbed rect is its size.
describe("Function Viewer Alpha's plane", () => {
  beforeEach(() => {
    drawMock.mockClear()
    vi.stubGlobal("ResizeObserver", undefined)
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      stubCtx as unknown as CanvasRenderingContext2D,
    )
    HTMLCanvasElement.prototype.setPointerCapture = () => {}
    HTMLCanvasElement.prototype.releasePointerCapture = () => {}
    HTMLCanvasElement.prototype.hasPointerCapture = () => false
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(rectOf(600, 600))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("pans while a button is held", async () => {
    const screen = await render(<CartesianPlane />)
    const canvas = toElement(screen.getByTestId("cartesian-canvas")) as HTMLCanvasElement
    act(() => {
      press(canvas, "pointerdown", 100, 100, 1)
      press(canvas, "pointermove", 150, 100, 1)
      press(canvas, "pointerup", 150, 100, 0)
      press(canvas, "pointermove", 200, 100, 0)
    })
    expect(lastDraw().panX).toBe(1)
  })

  // AGENTS.md › pointer-capture drags, as on the main plane.
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
    const screen = await render(<CartesianPlane />)
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
  })

  it("ends a pan on a move with no button held, whose release went missing", async () => {
    const screen = await render(<CartesianPlane />)
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
  })
})
