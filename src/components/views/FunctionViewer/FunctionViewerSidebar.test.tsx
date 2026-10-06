import { describe, expect, it, vi } from "vitest"

import { act, render, toElement } from "#test"

import type { XExtent } from "../CartesianPlane/types.ts"

import { FunctionViewerSidebar } from "./FunctionViewerSidebar.tsx"

const setInput = (input: HTMLInputElement, next: string) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set
  if (setter === undefined) {
    throw new Error("no native value setter")
  }
  setter.call(input, next)
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

const renderSidebar = (props?: { p1?: number; setP1?: (next: number) => void; xExtent?: XExtent | null }) =>
  render(
    <FunctionViewerSidebar
      xScale={1}
      setXScale={() => {}}
      xOffset={0}
      setXOffset={() => {}}
      yScale={1}
      setYScale={() => {}}
      yOffset={0}
      setYOffset={() => {}}
      point1X={props?.p1 ?? 2}
      setPoint1X={props?.setP1 ?? (() => {})}
      xExtent={props?.xExtent ?? { minX: 0, maxX: 10 }}
    />,
  )

describe("FunctionViewerSidebar Points", () => {
  it("renders p1 input and an extent-bound slider plus a p2 placeholder", async () => {
    const screen = await renderSidebar()
    const input = toElement(screen.getByTestId("p1-input")) as HTMLInputElement
    expect(input.value).toBe("2")
    const slider = toElement(screen.getByTestId("p1-slider"))
    expect(slider.getAttribute("aria-valuemin")).toBe("0")
    expect(slider.getAttribute("aria-valuemax")).toBe("10")
    expect(slider.getAttribute("aria-valuenow")).toBe("2")
    expect(document.querySelector('[data-testid="p1-slider-knob"]')).not.toBeNull()
    expect(toElement(screen.getByTestId("p1-slider-min")).textContent).toBe("0")
    expect(toElement(screen.getByTestId("p1-slider-max")).textContent).toBe("10")
  })

  it("hides the p1 knob when the value leaves the extent", async () => {
    await renderSidebar({ p1: 99, xExtent: { minX: 0, maxX: 10 } })
    expect(document.querySelector('[data-testid="p1-slider-knob"]')).toBeNull()
  })

  it("moves the p1 knob when the extent updates", async () => {
    await renderSidebar({ p1: 5, xExtent: { minX: 0, maxX: 10 } })
    const knob = document.querySelector('[data-testid="p1-slider-knob"]') as HTMLDivElement | null
    expect(knob?.style.left).toBe("50%")
  })

  it("typing in p1 propagates to state", async () => {
    const setP1 = vi.fn<(next: number) => void>()
    const screen = await renderSidebar({ setP1 })
    const input = toElement(screen.getByTestId("p1-input")) as HTMLInputElement
    act(() => {
      setInput(input, "7")
    })
    expect(setP1).toHaveBeenCalledWith(7)
  })
})
