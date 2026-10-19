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

export const toElement = (node: unknown): HTMLElement => {
  if (hasElementMethod(node)) {
    return node.element()
  }
  return node as HTMLElement
}

export const selectionMayStart = () =>
  document.body.dispatchEvent(new Event("selectstart", { bubbles: true, cancelable: true }))
