import { expect } from "vitest"
import { render, renderHook } from "vitest-browser-react"

import { _renderSetup, defaultElementLocatorTimeout } from "./includes"

HTMLCanvasElement.prototype.setPointerCapture = () => {}
HTMLCanvasElement.prototype.releasePointerCapture = () => {}
HTMLCanvasElement.prototype.hasPointerCapture = () => false

const _buggedElementFunction = expect.element

expect.element = function (arg, options = { timeout: defaultElementLocatorTimeout }) {
  return _buggedElementFunction(arg, options)
}

_renderSetup({ isBrowser: true, render, renderHook })
