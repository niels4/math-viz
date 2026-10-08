import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest"

import { act, render, toElement } from "#test"

import { CartesianPlane } from "./CartesianPlane"
import { drawCartesianPlane } from "./drawCartesianPlane"
import { wheelView } from "./util.ts"

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

  it("zooms one notch per wheel event, however many land before a render", async () => {
    const screen = await render(<CartesianPlane />)
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
})
