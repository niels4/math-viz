import { atom, getDefaultStore, useAtomValue } from "jotai"
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest"

import { act, render, toElement } from "#test"

import type { PlotFunction, PlotHandle, PlotMarker, PlotPoint } from "./draw/drawCartesianPlane"

import { CartesianPlane } from "./CartesianPlane"
import { planeFont } from "./constants"

const identity: PlotFunction = (x) => x

type Draw = { calls: string[]; texts: { text: string; font: string }[] }
let draws: Draw[]
let finishFontLoad: () => void
let failFontLoad: () => void
let fontLoad: Mock<(font: string) => Promise<FontFace[]>>

const lastDraw = () => draws.at(-1) ?? { calls: [], texts: [] }
const textsOf = (draw: Draw) => draw.texts.map((t) => t.text)

beforeEach(() => {
  draws = []

  const fake = new Proxy<Record<string | symbol, unknown>>(
    {},
    {
      get: (target, key) => {
        if (key === "clearRect") {
          return () => draws.push({ calls: [], texts: [] })
        }
        if (key === "fillText") {
          return (text: string) => draws.at(-1)?.texts.push({ text, font: String(target["font"]) })
        }
        if (key === "measureText") {
          return () => ({ width: 40 })
        }
        return key in target ? target[key] : () => draws.at(-1)?.calls.push(String(key))
      },
    },
  )
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(fake as never)
  vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue(
    DOMRect.fromRect({ width: 400, height: 300 }),
  )

  const fontArrived = new Promise<FontFace[]>((resolve, reject) => {
    finishFontLoad = () => resolve([])
    failFontLoad = () => reject(new Error("NetworkError"))
  })
  fontLoad = vi.fn<(font: string) => Promise<FontFace[]>>(() => fontArrived)
  Object.defineProperty(document, "fonts", { configurable: true, value: { load: fontLoad } })
})

afterEach(() => {
  vi.restoreAllMocks()
  Reflect.deleteProperty(document, "fonts")
})

describe("CartesianPlane", () => {
  it("shows no numbers until Roboto Mono has loaded, then shows them in it", async () => {
    await render(
      <CartesianPlane
        curves={[{ fn: identity, alpha: 1, drawTo: 1 }]}
        handles={[]}
        lines={[]}
        markers={[]}
      />,
    )

    expect(fontLoad).toHaveBeenCalledWith(planeFont)
    expect(draws.length).toBeGreaterThan(0)
    for (const draw of draws) {
      expect(draw.calls).toContain("stroke")
      expect(draw.calls).not.toContain("roundRect")
      expect(draw.texts).toEqual([])
    }

    finishFontLoad()
    await vi.waitFor(() => {
      expect(textsOf(lastDraw())).toEqual(expect.arrayContaining(["1", "-1", "0.50 u"]))
    })
    expect(lastDraw().calls).toContain("roundRect")
    expect(new Set(lastDraw().texts.map((t) => t.font))).toEqual(new Set([planeFont]))
  })

  it("shows the numbers anyway when Roboto Mono fails to load", async () => {
    await render(
      <CartesianPlane
        curves={[{ fn: identity, alpha: 1, drawTo: 1 }]}
        handles={[]}
        lines={[]}
        markers={[]}
      />,
    )
    expect(lastDraw().texts).toEqual([])

    failFontLoad()
    await vi.waitFor(() => {
      expect(textsOf(lastDraw())).toEqual(expect.arrayContaining(["1", "-1", "0.50 u"]))
    })
  })

  it("shows a closed hand while the plane is dragged and the crosshair again once it is let go", async () => {
    await render(
      <CartesianPlane
        curves={[{ fn: identity, alpha: 1, drawTo: 1 }]}
        handles={[]}
        lines={[]}
        markers={[]}
      />,
    )
    const canvas = toElement(document.querySelector("canvas"))
    const pointer = (type: string, clientX: number) =>
      act(() =>
        canvas.dispatchEvent(
          new PointerEvent(type, {
            pointerId: 1,
            pointerType: "mouse",
            button: 0,
            buttons: type === "pointerup" ? 0 : 1,
            clientX,
            clientY: 150,
          }),
        ),
      )
    expect(canvas.dataset["cursor"]).toBe("pan")

    pointer("pointerdown", 200)
    expect(canvas.dataset["cursor"]).toBe("grab-active")

    pointer("pointermove", 240)
    expect(canvas.dataset["cursor"]).toBe("grab-active")

    pointer("pointerup", 240)
    expect(canvas.dataset["cursor"]).toBe("pan")
  })

  it("reports the point under the pointer, and null once the pointer leaves or pans the plane", async () => {
    const onHoverPoint = vi.fn<(point: PlotPoint | null) => void>()
    await render(
      <CartesianPlane curves={[]} handles={[]} lines={[]} markers={[]} onHoverPoint={onHoverPoint} />,
    )
    const canvas = toElement(document.querySelector("canvas"))
    const pointer = (type: string, clientX: number) =>
      act(() =>
        canvas.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            pointerId: 1,
            pointerType: "mouse",
            button: 0,
            buttons: type === "pointerdown" ? 1 : 0,
            clientX,
            clientY: 150,
          }),
        ),
      )
    const reported = () => onHoverPoint.mock.lastCall?.[0]

    pointer("pointermove", 200)
    const first = reported()
    pointer("pointermove", 240)
    const second = reported()
    // The default camera draws 50 px per unit.
    expect(first).not.toBeNull()
    expect((second?.x ?? 0) - (first?.x ?? 0)).toBeCloseTo(0.8)

    // React reads a pointer leaving the canvas from its pointerout.
    pointer("pointerout", 240)
    expect(reported()).toBeNull()

    pointer("pointermove", 240)
    expect(reported()).not.toBeNull()

    pointer("pointerdown", 240)
    pointer("pointermove", 280)
    expect(reported()).toBeNull()
  })

  it("reports null while the pointer rests on a handle", async () => {
    const onHoverPoint = vi.fn<(point: PlotPoint | null) => void>()
    const handlesAtom = atom<PlotHandle[]>([])
    const Plane = () => (
      <CartesianPlane
        curves={[]}
        handles={useAtomValue(handlesAtom)}
        lines={[]}
        markers={[]}
        onHoverPoint={onHoverPoint}
      />
    )
    await render(<Plane />)
    const canvas = toElement(document.querySelector("canvas"))
    const move = () =>
      act(() =>
        canvas.dispatchEvent(
          new PointerEvent("pointermove", {
            bubbles: true,
            pointerType: "mouse",
            clientX: 200,
            clientY: 150,
          }),
        ),
      )

    move()
    const under = onHoverPoint.mock.lastCall?.[0]
    if (under == null) {
      throw new Error("the plane reported no point under the pointer")
    }
    act(() =>
      getDefaultStore().set(handlesAtom, [
        { point: under, shape: "square", handlers: { onHover: () => {} } },
      ]),
    )
    move()
    expect(onHoverPoint.mock.lastCall?.[0]).toBeNull()
  })

  it("drags a point instead of the plane, with an open hand over it and a closed one while held", async () => {
    const onHoverPoint = vi.fn<(point: PlotPoint | null) => void>()
    const onDrag = vi.fn<(e: PointerEvent, point: PlotPoint) => void>()
    const markersAtom = atom<PlotMarker[]>([])
    const Plane = () => (
      <CartesianPlane
        curves={[]}
        handles={[]}
        lines={[]}
        markers={useAtomValue(markersAtom)}
        onHoverPoint={onHoverPoint}
      />
    )
    await render(<Plane />)
    const canvas = toElement(document.querySelector("canvas"))
    const pointer = (type: string, clientX: number, buttons: number) =>
      act(() =>
        canvas.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            pointerId: 1,
            pointerType: "mouse",
            button: 0,
            buttons,
            clientX,
            clientY: 150,
          }),
        ),
      )

    pointer("pointermove", 200, 0)
    const under = onHoverPoint.mock.lastCall?.[0]
    if (under == null) {
      throw new Error("the plane reported no point under the pointer")
    }
    act(() =>
      getDefaultStore().set(markersAtom, [
        { point: under, ink: "primary", handlers: { onPointerDown: () => {}, onDrag } },
      ]),
    )

    pointer("pointermove", 201, 0)
    expect(canvas.dataset["cursor"]).toBe("grab-hover")
    expect(onHoverPoint.mock.lastCall?.[0]).toBeNull()

    pointer("pointerdown", 201, 1)
    expect(canvas.dataset["cursor"]).toBe("grab-active")

    pointer("pointermove", 241, 1)
    expect(onDrag.mock.lastCall?.[1].x).toBeCloseTo(under.x + 0.82)
    expect(onHoverPoint.mock.lastCall?.[0]).toBeNull()

    pointer("pointerup", 241, 0)
    expect(canvas.dataset["cursor"]).toBe("pan")
  })
})
