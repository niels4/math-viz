import { beforeEach, describe, expect, it, vi, type Mock } from "vitest"

import { act, render, toElement } from "#test"

import type { PlaneScene } from "../CartesianPlane/scene.ts"

import { drawCartesianPlane } from "../CartesianPlane/drawCartesianPlane"
import { FunctionViewer } from "./FunctionViewer.tsx"

vi.mock("../CartesianPlane/drawCartesianPlane", () => ({
  drawCartesianPlane: vi.fn<(props: { scene: PlaneScene }) => void>(),
}))

const drawMock = drawCartesianPlane as unknown as Mock
const lastDraw = () => drawMock.mock.calls.at(-1)?.[0] as { scene: PlaneScene }
const lastScene = () => lastDraw().scene

const stubCtx = new Proxy({}, { get: () => () => {}, set: () => true })

const setInput = (input: HTMLInputElement, next: string) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set
  if (setter === undefined) {
    throw new Error("no native value setter")
  }
  setter.call(input, next)
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

describe("FunctionViewer", () => {
  beforeEach(() => {
    drawMock.mockClear()
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      stubCtx as unknown as CanvasRenderingContext2D,
    )
  })

  it("prints R3's equation and plots its curve, vertex at (−1, 1) (D1)", async () => {
    const screen = await render(<FunctionViewer />)
    const field = (id: string) => toElement(screen.getByTestId(id)) as HTMLInputElement
    act(() => {
      setInput(field("y-scale-input"), "2")
      setInput(field("x-offset-input"), "-1")
      setInput(field("y-offset-input"), "1")
    })
    expect(toElement(screen.getByTestId("func-readout")).getAttribute("aria-label")).toBe(
      "f(x) = 2(x + 1)² + 1",
    )
    const curve = lastScene().curves[0]
    expect(curve?.fn(-1)).toBe(1)
    expect(curve?.fn(0.5)).toBe(5.5)
  })

  it("starts P at x = 2 (D4)", async () => {
    const screen = await render(<FunctionViewer />)
    expect((toElement(screen.getByTestId("p1-input")) as HTMLInputElement).value).toBe("2")
    expect(lastScene().points[0]).toMatchObject({
      id: "p",
      x: 2,
      y: 4,
      style: "bullseye",
      ink: "chartPoint1",
    })
  })
})
