import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useQueryParam } from "#src/components/router/queryParamAtom.ts"
import { act, render, toElement, updateLocationHash } from "#test"

import { aParam, hParam } from "./queryParams"
import { TransformRow } from "./SideBar/TransformSection/TransformRow"
import { TransformSection } from "./SideBar/TransformSection/TransformSection"
import { useShownTransform } from "./useShownTransform"

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

const Plane = () => {
  const [a] = useQueryParam(aParam)
  const shown = useShownTransform({ a, b: 1, h: 0, k: 0 })
  return <output aria-label="plane">{`a ${shown.a.toFixed(2)}`}</output>
}

const ShiftedPlane = () => {
  const [a] = useQueryParam(aParam)
  const [h] = useQueryParam(hParam)
  const shown = useShownTransform({ a, b: 1, h, k: 0 })
  return <output aria-label="plane">{`a ${shown.a.toFixed(2)} h ${shown.h.toFixed(2)}`}</output>
}

const renderRowAndPlane = async () => {
  const screen = await render(
    <>
      <TransformRow name="y scale" param="a" />
      <Plane />
    </>,
  )
  return {
    box: toElement(screen.getByLabelText("y scale")) as HTMLInputElement,
    flip: toElement(screen.getByRole("button", { name: "Flip upside down" })),
    plane: toElement(screen.getByLabelText("plane")),
    reset: () => toElement(screen.getByRole("button", { name: "Reset y scale to 1" })),
  }
}

const click = (button: HTMLElement) =>
  act(() => button.dispatchEvent(new MouseEvent("click", { bubbles: true })))

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

afterEach(async () => {
  vi.unstubAllGlobals()
  await updateLocationHash("")
})

describe("the plane during a flip", () => {
  it("flipping a = 2 turns the curve over through flat while the box shows −2 at once", async () => {
    await updateLocationHash("#?a=2")
    const { box, flip, plane } = await renderRowAndPlane()
    await expect.element(plane).toHaveTextContent("a 2.00")

    click(flip)
    expect(box).toHaveValue("-2.00")
    expect(plane).toHaveTextContent("a 2.00")

    runFrames(6)
    expect(plane).toHaveTextContent("a 1.07")

    runFrames(6)
    expect(plane).toHaveTextContent("a -0.19")

    runFrames(31)
    expect(plane).toHaveTextContent("a -1.96")

    runFrames(18)
    expect(plane).toHaveTextContent("a -2.00")
    expect(frames.size).toBe(0)
  })

  it("a value typed while the curve turns over shows at once", async () => {
    await updateLocationHash("#?a=2")
    const { box, flip, plane } = await renderRowAndPlane()
    await expect.element(plane).toHaveTextContent("a 2.00")

    click(flip)
    runFrames(6)
    expect(plane).toHaveTextContent("a 1.07")

    act(() => box.focus())
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(box, "-1")
      box.dispatchEvent(new Event("input", { bubbles: true }))
    })
    act(() => box.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })))
    expect(plane).toHaveTextContent("a -1.00")
  })

  it("with reduced motion, flipping a = 2 shows a = −2 at once", async () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
    }))
    await updateLocationHash("#?a=2")
    const { flip, plane } = await renderRowAndPlane()
    await expect.element(plane).toHaveTextContent("a 2.00")

    click(flip)
    expect(plane).toHaveTextContent("a -2.00")
    expect(frames.size).toBe(0)
  })
})

describe("the plane during a reset", () => {
  it("resetting a = 3 eases the curve back to a = 1 while the box shows 1 at once", async () => {
    await updateLocationHash("#?a=3")
    const { box, plane, reset } = await renderRowAndPlane()
    await expect.element(plane).toHaveTextContent("a 3.00")

    click(reset())
    expect(box).toHaveValue("1.00")
    expect(plane).toHaveTextContent("a 3.00")

    runFrames(6)
    expect(plane).toHaveTextContent("a 2.53")

    runFrames(6)
    expect(plane).toHaveTextContent("a 1.91")

    runFrames(31)
    expect(plane).toHaveTextContent("a 1.02")

    runFrames(18)
    expect(plane).toHaveTextContent("a 1.00")
    expect(frames.size).toBe(0)
  })

  it("Reset all eases a = 3 and h = 2 back together while the boxes show 1 and 0 at once", async () => {
    await updateLocationHash("#?a=3&h=2")
    const screen = await render(
      <>
        <TransformSection />
        <ShiftedPlane />
      </>,
    )
    const a = toElement(screen.getByLabelText("y scale", { exact: true }))
    const h = toElement(screen.getByLabelText("x shift", { exact: true }))
    const plane = toElement(screen.getByLabelText("plane"))
    await expect.element(plane).toHaveTextContent("a 3.00 h 2.00")

    click(toElement(screen.getByRole("button", { name: "Reset all" })))
    expect(a).toHaveValue("1.00")
    expect(h).toHaveValue("0.00")
    expect(plane).toHaveTextContent("a 3.00 h 2.00")

    runFrames(6)
    expect(plane).toHaveTextContent("a 2.53 h 1.53")

    runFrames(6)
    expect(plane).toHaveTextContent("a 1.91 h 0.91")

    runFrames(31)
    expect(plane).toHaveTextContent("a 1.02 h 0.02")

    runFrames(18)
    expect(plane).toHaveTextContent("a 1.00 h 0.00")
    expect(frames.size).toBe(0)
  })
})
