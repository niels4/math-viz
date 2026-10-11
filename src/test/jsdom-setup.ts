import "@testing-library/jest-dom/vitest"
import { cleanup, render as jsdomRender, renderHook as jsdomRenderHook, screen } from "@testing-library/react"
import { afterEach, expect } from "vitest"

import {
  _renderSetup,
  defaultElementLocatorTimeout,
  updateLocationHash,
  type RenderFunc,
  type RenderHookFunc,
} from "./includes.tsx"

console.log("jsdom-setup")

// Mirror browser-setup: synthetic pointerIds never had capture, so keep
// these as no-ops in jsdom too (jsdom lacks them entirely).
HTMLCanvasElement.prototype.setPointerCapture = () => {}
HTMLCanvasElement.prototype.releasePointerCapture = () => {}
HTMLCanvasElement.prototype.hasPointerCapture = () => false

// make sure we clean up the screen after every test
afterEach(() => {
  cleanup()
})

// @ts-expect-error - pretending this function is the same as the one from Vitest browser mode
expect.element = (element, options = { defaultElementLocatorTimeout: defaultElementLocatorTimeout }) => {
  return expect.poll(() => element, options)
}

// clicking a tags that update the hash will cause the location.hash to update
const _oldClick = HTMLElement.prototype.click as () => Promise<void>
HTMLElement.prototype.click = async function () {
  await _oldClick.call(this)
  const key = Object.keys(this).find((k) => k.includes("Fiber"))!
  // @ts-expect-error - this is a little hack to fix clicking on links in jsdom
  const element = this[key]
  if (element.elementType === "a" && element.pendingProps.href?.startsWith("#")) {
    await updateLocationHash(element.pendingProps.href)
  }
}

const render: RenderFunc = async (element, options) => {
  jsdomRender(element, options)
  // @ts-expect-error - pretending this screen is the same as the one from Vitest browser mode
  return screen as unknown as RenderResult
}

const renderHook = jsdomRenderHook as unknown as RenderHookFunc

_renderSetup({ isBrowser: false, render, renderHook })
