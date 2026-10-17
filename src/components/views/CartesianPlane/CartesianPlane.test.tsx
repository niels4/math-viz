import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest"

import { render } from "#test"

import { CartesianPlane } from "./CartesianPlane"
import { planeFallbackFont, planeFont } from "./constants"

// Every draw of the canvas, as the font of each piece of its text.
let draws: string[][]
let finishFontLoad: () => void
let fontLoad: Mock<(font: string) => Promise<FontFace[]>>

beforeEach(() => {
  draws = []

  // jsdom has no canvas: a context that records each draw's text and ignores
  // everything else.
  const fake = new Proxy<Record<string | symbol, unknown>>(
    {},
    {
      get: (target, key) => {
        if (key === "clearRect") {
          return () => draws.push([])
        }
        if (key === "fillText") {
          return () => draws.at(-1)?.push(String(target["font"]))
        }
        if (key === "measureText") {
          return () => ({ width: 40 })
        }
        return key in target ? target[key] : () => {}
      },
    },
  )
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(fake as never)

  // jsdom has no document.fonts either: Roboto Mono arrives when the test
  // calls finishFontLoad, as it does over the network on a reload with an
  // empty cache.
  const fontArrived = new Promise<FontFace[]>((resolve) => {
    finishFontLoad = () => resolve([])
  })
  fontLoad = vi.fn<(font: string) => Promise<FontFace[]>>(() => fontArrived)
  Object.defineProperty(document, "fonts", { configurable: true, value: { load: fontLoad } })
})

afterEach(() => {
  vi.restoreAllMocks()
  Reflect.deleteProperty(document, "fonts")
})

describe("CartesianPlane", () => {
  it("shows the labels in Roboto Mono, not a fallback face, after a reload with an empty cache", async () => {
    await render(<CartesianPlane />)

    // The plane draws its labels before Roboto Mono has arrived, in the
    // system's monospace face.
    expect(fontLoad).toHaveBeenCalledWith(planeFont)
    expect(draws.length).toBeGreaterThan(0)
    expect(new Set(draws.flat())).toEqual(new Set([planeFallbackFont]))

    // The font arrives, and the plane draws its labels again in it. #test's
    // act can't await an async callback, so wait for the draw instead.
    finishFontLoad()
    await vi.waitFor(() => {
      expect(draws.at(-1)?.length).toBeGreaterThan(0)
      expect(new Set(draws.at(-1))).toEqual(new Set([planeFont]))
    })
  })
})
