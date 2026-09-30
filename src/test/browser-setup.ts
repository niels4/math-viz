import { expect } from "vitest"
import { render, renderHook } from "vitest-browser-react"

import { _renderSetup, defaultElementLocatorTimeout } from "./includes"

console.log("browser-setup")

// the expect.element function wasn't respecting the global expect.poll.timeout config
const _buggedElementFunction = expect.element

expect.element = function (arg, options = { timeout: defaultElementLocatorTimeout }) {
  return _buggedElementFunction(arg, options)
}

_renderSetup({ isBrowser: true, render, renderHook })
