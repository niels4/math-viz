import type { render as vitestRender, renderHook as vitestRenderHook } from "vitest-browser-react"

import { StrictMode } from "react"

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
