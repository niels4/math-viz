import { expect } from "vitest"
import { render, renderHook } from "vitest-browser-react"

import { _renderSetup, defaultElementLocatorTimeout } from "./includes"

console.log("browser-setup")

// Synthetic PointerEvents use arbitrary pointerIds, so the real
// setPointerCapture would throw NotFoundError. Force no-ops so
// dispatchEvent-based pinch/drag tests work in real Chromium.
HTMLCanvasElement.prototype.setPointerCapture = () => {}
HTMLCanvasElement.prototype.releasePointerCapture = () => {}
HTMLCanvasElement.prototype.hasPointerCapture = () => false

// the expect.element function wasn't respecting the global expect.poll.timeout config
const _buggedElementFunction = expect.element

expect.element = function (arg, options = { timeout: defaultElementLocatorTimeout }) {
  return _buggedElementFunction(arg, options)
}

_renderSetup({ isBrowser: true, render, renderHook })
