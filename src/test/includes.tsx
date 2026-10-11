import type { render as vitestRender, renderHook as vitestRenderHook } from "vitest-browser-react"

import { StrictMode, act as reactAct } from "react"

import { wait } from "#src/util/async.ts"

export const defaultElementLocatorTimeout = 1000

export type RenderFunc = typeof vitestRender
export type RenderHookFunc = typeof vitestRenderHook

let _isBrowser: boolean

export const isBrowser = () => _isBrowser

export const updateLocationHash = async (newHash: string) => {
  window.location.hash = newHash
  await wait(0)
}

let _render: RenderFunc

export const render: RenderFunc = (element, options) => _render(<StrictMode>{element}</StrictMode>, options)

let _renderHook: RenderHookFunc

export const renderHook: RenderHookFunc = (hook, options) => _renderHook(hook, options)

type RenderSetupParams = {
  isBrowser: boolean
  render: RenderFunc
  renderHook: RenderHookFunc
}

export const _renderSetup = ({ isBrowser, render, renderHook }: RenderSetupParams) => {
  _isBrowser = isBrowser
  _render = render
  _renderHook = renderHook
}

// Cross-env act: `import { act } from "react"` warns in browser mode because
// vitest-browser-react only enables IS_REACT_ACT_ENVIRONMENT inside its own
// render calls. Setting the flag around React's act makes pointer-event
// batching (`act(() => { down(); move(); ... })`) work in both jsdom and
// real Chromium with the same sync semantics.
export const act = (callback: () => unknown): unknown => {
  const g = globalThis as unknown as Record<string, unknown>
  const prev = g["IS_REACT_ACT_ENVIRONMENT"]
  g["IS_REACT_ACT_ENVIRONMENT"] = true
  try {
    const result = (reactAct as (cb: () => unknown) => unknown)(callback)
    if (result !== null && typeof result === "object" && "then" in result) {
      const thenable = result as PromiseLike<unknown>
      return thenable.then(
        (value) => {
          g["IS_REACT_ACT_ENVIRONMENT"] = prev
          return value
        },
        (error) => {
          g["IS_REACT_ACT_ENVIRONMENT"] = prev
          throw error
        },
      )
    }
    g["IS_REACT_ACT_ENVIRONMENT"] = prev
    return result
  } catch (error) {
    g["IS_REACT_ACT_ENVIRONMENT"] = prev
    throw error
  }
}

type WithElementMethod = {
  element: () => HTMLElement
}

const hasElementMethod = (node: unknown): node is WithElementMethod => {
  return (
    node !== null &&
    typeof node === "object" &&
    "element" in node &&
    typeof (node as Record<string, unknown>)["element"] === "function"
  )
}

// Cross-env element resolver: jsdom `getByTestId` returns a real element,
// browser mode returns a Locator. Unwrap Locators via `.element()` so
// `dispatchEvent(new PointerEvent(...))` works in both environments.
// Callers narrow via `as`, e.g. `toElement(screen.getByTestId("x")) as HTMLCanvasElement`.
export const toElement = (node: unknown): HTMLElement => {
  if (hasElementMethod(node)) {
    return node.element()
  }
  return node as HTMLElement
}

// Whether a text selection may start: a selectstart on the page goes
// uncancelled. A pointer drag holds it off until it is let go
// (#src/util/pointer/selectNothing.ts).
export const selectionMayStart = () =>
  document.body.dispatchEvent(new Event("selectstart", { bubbles: true, cancelable: true }))
