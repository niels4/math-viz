import { afterEach, describe, expect, it } from "vitest"

import { wait } from "#src/util/async.ts"
import { act, renderHook, updateLocationHash } from "#test"

import { queryParamAtom, useQueryParam } from "./queryParamAtom"

const numberDef = (key: string, debounceMs = 20) =>
  queryParamAtom<number>(key, {
    parse: (raw) => {
      if (raw == null) {
        return undefined
      }
      const n = Number(raw)
      return Number.isFinite(n) ? n : undefined
    },
    serialize: (v) => v.toFixed(2),
    defaultValue: 0,
    debounceMs,
  })

afterEach(async () => {
  await updateLocationHash("")
})

describe("queryParamAtom", () => {
  describe("initial value", () => {
    it("reads the value from the url", async () => {
      await updateLocationHash("#?qp-init=3.5")
      const def = numberDef("qp-init")
      const { result, unmount } = await renderHook(() => useQueryParam(def))
      expect(result.current[0]).toBe(3.5)
      await unmount()
    })

    it("falls back to the default when the key is missing", async () => {
      await updateLocationHash("")
      const def = numberDef("qp-missing")
      const { result, unmount } = await renderHook(() => useQueryParam(def))
      expect(result.current[0]).toBe(0)
      await unmount()
    })

    it("falls back to the default when the value is invalid", async () => {
      await updateLocationHash("#?qp-invalid=nope")
      const def = numberDef("qp-invalid")
      const { result, unmount } = await renderHook(() => useQueryParam(def))
      expect(result.current[0]).toBe(0)
      await unmount()
    })
  })

  describe("live updates", () => {
    it("updates live immediately without touching the url", async () => {
      await updateLocationHash("")
      const def = numberDef("qp-live")
      const { result, unmount } = await renderHook(() => useQueryParam(def))
      const set = result.current[1]
      act(() => {
        set(5)
      })
      expect(result.current[0]).toBe(5)
      expect(window.location.hash).toBe("")
      await unmount()
    })

    it("supports updater functions", async () => {
      await updateLocationHash("#?qp-updater=2")
      const def = numberDef("qp-updater")
      const { result, unmount } = await renderHook(() => useQueryParam(def))
      const set = result.current[1]
      act(() => {
        set((prev) => prev + 1)
      })
      expect(result.current[0]).toBe(3)
      await unmount()
    })
  })

  describe("url flush", () => {
    it("writes the value to the url after the debounce", async () => {
      await updateLocationHash("")
      const def = numberDef("qp-debounce")
      const { result, unmount } = await renderHook(() => useQueryParam(def))
      result.current[1](5)
      await wait(100)
      expect(window.location.hash).toContain("qp-debounce=5.00")
      await unmount()
    })

    it("writes without adding a history entry", async () => {
      await updateLocationHash("")
      const entries = history.length
      const def = numberDef("qp-history")
      const { result, unmount } = await renderHook(() => useQueryParam(def))
      result.current[1](5, { flush: true })
      await wait(0)
      expect(window.location.hash).toContain("qp-history=5.00")
      expect(history.length).toBe(entries)
      await unmount()
    })

    it("writes immediately with the flush option", async () => {
      await updateLocationHash("")
      const def = numberDef("qp-flush")
      const { result, unmount } = await renderHook(() => useQueryParam(def))
      result.current[1](5, { flush: true })
      expect(window.location.hash).toContain("qp-flush=5.00")
      await unmount()
    })

    it("removes the key when the value equals the default", async () => {
      await updateLocationHash("#?qp-prune=5")
      const def = numberDef("qp-prune")
      const { result, unmount } = await renderHook(() => useQueryParam(def))
      expect(result.current[0]).toBe(5)
      const set = result.current[1]
      act(() => {
        set(0, { flush: true })
      })
      expect(result.current[0]).toBe(0)
      expect(window.location.hash).toBe("")
      await unmount()
    })
  })

  describe("precision", () => {
    it("keeps sub-serialize ticks in live state", async () => {
      await updateLocationHash("")
      const def = numberDef("qp-momentum")
      const { result, unmount } = await renderHook(() => useQueryParam(def))
      const set = result.current[1]
      act(() => {
        for (let i = 0; i < 10; i++) {
          set((prev) => prev + 0.001)
        }
      })
      expect(result.current[0]).toBeCloseTo(0.01, 10)
      await unmount()
    })
  })

  describe("external url changes", () => {
    it("flows a hash edit into the live value", async () => {
      await updateLocationHash("")
      const def = numberDef("qp-external")
      const { result, unmount } = await renderHook(() => useQueryParam(def))
      expect(result.current[0]).toBe(0)
      await updateLocationHash("#?qp-external=7")
      await wait(50)
      expect(result.current[0]).toBe(7)
      await unmount()
    })
  })

  describe("tuple params", () => {
    it("round-trips comma-separated values with literal commas", async () => {
      await updateLocationHash("#?qp-center=1.2325,5")
      const def = queryParamAtom<[number, number]>("qp-center", {
        parse: (raw) => {
          if (raw == null) {
            return undefined
          }
          const parts = raw.split(",")
          if (parts.length !== 2) {
            return undefined
          }
          const x = Number(parts[0])
          const y = Number(parts[1])
          return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : undefined
        },
        serialize: ([x, y]) => `${x.toFixed(4)},${y.toFixed(4)}`,
        defaultValue: [0, 0],
        debounceMs: 20,
      })
      const { result, unmount } = await renderHook(() => useQueryParam(def))
      expect(result.current[0]).toEqual([1.2325, 5])
      result.current[1]([2, 3], { flush: true })
      await wait(0)
      expect(window.location.hash).toContain("qp-center=2.0000,3.0000")
      await unmount()
    })
  })
})
