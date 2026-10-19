import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest"

import { render } from "#test"

import type { PlotFunction } from "./drawCartesianPlane"

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
    await render(<CartesianPlane curves={[{ fn: identity, alpha: 1, drawTo: 1 }]} handles={[]} arrows={[]} />)

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
    await render(<CartesianPlane curves={[{ fn: identity, alpha: 1, drawTo: 1 }]} handles={[]} arrows={[]} />)
    expect(lastDraw().texts).toEqual([])

    failFontLoad()
    await vi.waitFor(() => {
      expect(textsOf(lastDraw())).toEqual(expect.arrayContaining(["1", "-1", "0.50 u"]))
    })
  })
})
