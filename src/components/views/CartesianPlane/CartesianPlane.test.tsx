import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest"

import { render } from "#test"

import type { PlotFunction } from "./drawCartesianPlane"

import { CartesianPlane } from "./CartesianPlane"
import { planeFont } from "./constants"

// The plane graphs y = x.
const identity: PlotFunction = (x) => x

// Every draw of the canvas: the context calls it made, and each piece of its
// text with the font it was drawn in.
type Draw = { calls: string[]; texts: { text: string; font: string }[] }
let draws: Draw[]
let finishFontLoad: () => void
let failFontLoad: () => void
let fontLoad: Mock<(font: string) => Promise<FontFace[]>>

const lastDraw = () => draws.at(-1) ?? { calls: [], texts: [] }
const textsOf = (draw: Draw) => draw.texts.map((t) => t.text)

beforeEach(() => {
  draws = []

  // jsdom has no canvas: a context that records each draw.
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
  // jsdom lays nothing out: the canvas is 400 by 300 px, so it shows x = -1 and 1.
  vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue(
    DOMRect.fromRect({ width: 400, height: 300 }),
  )

  // jsdom has no document.fonts either: Roboto Mono arrives, or fails to,
  // when the test says, as it does over the network on a reload with an
  // empty cache.
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
    await render(<CartesianPlane plotFunction={identity} />)

    // Before the font arrives, the plane draws its grid and axes, but no axis
    // numbers and no scale legend.
    expect(fontLoad).toHaveBeenCalledWith(planeFont)
    expect(draws.length).toBeGreaterThan(0)
    for (const draw of draws) {
      expect(draw.calls).toContain("stroke")
      expect(draw.calls).not.toContain("roundRect")
      expect(draw.texts).toEqual([])
    }

    // The font arrives, and the plane draws the numbers and the legend in it.
    // #test's act can't await an async callback, so wait for the draw instead.
    finishFontLoad()
    await vi.waitFor(() => {
      expect(textsOf(lastDraw())).toEqual(expect.arrayContaining(["1", "-1", "0.50 u"]))
    })
    expect(lastDraw().calls).toContain("roundRect")
    expect(new Set(lastDraw().texts.map((t) => t.font))).toEqual(new Set([planeFont]))
  })

  it("shows the numbers anyway when Roboto Mono fails to load", async () => {
    await render(<CartesianPlane plotFunction={identity} />)
    expect(lastDraw().texts).toEqual([])

    // The font file doesn't arrive, so the numbers and the legend show in the
    // browser's fallback face rather than not at all.
    failFontLoad()
    await vi.waitFor(() => {
      expect(textsOf(lastDraw())).toEqual(expect.arrayContaining(["1", "-1", "0.50 u"]))
    })
  })
})
