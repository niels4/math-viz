import { afterEach, describe, expect, it, vi } from "vitest"

import { act, renderHook } from "#test"

import { useMediaQuery } from "./useMediaQuery.ts"

type FakeList = {
  media: string
  readonly matches: boolean
  addEventListener: (type: "change", listener: () => void) => void
  removeEventListener: (type: "change", listener: () => void) => void
}

// A window whose media query matches while `matching` is true, and tells
// its listeners when that changes.
const fakeWindow = (initial: boolean) => {
  let matching = initial
  const listeners = new Set<() => void>()
  const matchMedia = vi.fn<(query: string) => FakeList>((query) => ({
    media: query,
    get matches() {
      return matching
    },
    addEventListener: (_, listener) => {
      listeners.add(listener)
    },
    removeEventListener: (_, listener) => {
      listeners.delete(listener)
    },
  }))
  return {
    matchMedia,
    listeners,
    set: (next: boolean) => {
      matching = next
      for (const listener of listeners) {
        listener()
      }
    },
  }
}

describe("useMediaQuery", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("follows the query as the window changes", async () => {
    const window = fakeWindow(false)
    vi.stubGlobal("matchMedia", window.matchMedia)
    const { result } = await renderHook(() => useMediaQuery("(max-height: 859px)"))
    expect(result.current).toBe(false)
    expect(window.matchMedia).toHaveBeenCalledWith("(max-height: 859px)")
    act(() => window.set(true))
    expect(result.current).toBe(true)
    act(() => window.set(false))
    expect(result.current).toBe(false)
  })

  it("stops listening when it unmounts", async () => {
    const window = fakeWindow(true)
    vi.stubGlobal("matchMedia", window.matchMedia)
    const { result, unmount } = await renderHook(() => useMediaQuery("(max-height: 859px)"))
    expect(result.current).toBe(true)
    await unmount()
    expect(window.listeners.size).toBe(0)
  })

  it("never matches without matchMedia", async () => {
    vi.stubGlobal("matchMedia", undefined)
    const { result } = await renderHook(() => useMediaQuery("(max-height: 859px)"))
    expect(result.current).toBe(false)
  })
})
