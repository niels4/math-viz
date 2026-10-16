import { atom, getDefaultStore, useAtom } from "jotai"
import { useCallback, useEffect } from "react"

import { getCurrentSearchParams, subscribeSearchParams, useSetSearchParams } from "./router-hooks"

export type QueryParamOptions<T> = {
  parse: (raw: string | null) => T | undefined
  serialize: (value: T) => string | number | null
  defaultValue: T
  debounceMs?: number
}

export type QueryParamDef<T> = QueryParamOptions<T> & {
  key: string
  atom: ReturnType<typeof atom<T>>
  debounceMs: number
}

// Define once per param at module level. One atom per key matches the single
// URL bar, and nested components share live state without prop drilling.
export const defineQueryParam = <T>(key: string, options: QueryParamOptions<T>): QueryParamDef<T> => {
  const { parse, serialize, defaultValue, debounceMs = 200 } = options
  const initial = parse(getCurrentSearchParams().get(key)) ?? defaultValue
  return { key, parse, serialize, defaultValue, debounceMs, atom: atom<T>(initial) }
}

const sameSerialized = <T>(def: QueryParamDef<T>, a: T, b: T): boolean =>
  String(def.serialize(a)) === String(def.serialize(b))

const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>()

// Defaults stay out of the URL so links stay short. A value equal to the
// default flushes as a deletion, and a missing key parses back to default.
const toUrlValue = <T>(def: QueryParamDef<T>, next: T): string | number | null =>
  sameSerialized(def, next, def.defaultValue) ? null : def.serialize(next)

export const useQueryParam = <T>(def: QueryParamDef<T>) => {
  const [value, setLive] = useAtom(def.atom)
  const setParams = useSetSearchParams()

  // External URL changes (back/forward, manual edit, other writers) flow
  // into the live atom. Own flushes echo back and hit the equality guard.
  useEffect(() => {
    const store = getDefaultStore()
    const syncFromUrl = (params: URLSearchParams) => {
      const next = def.parse(params.get(def.key)) ?? def.defaultValue
      const current = store.get(def.atom)
      if (!sameSerialized(def, current, next)) {
        store.set(def.atom, next)
      }
    }
    syncFromUrl(getCurrentSearchParams())
    return subscribeSearchParams(syncFromUrl)
  }, [def])

  const flush = useCallback(
    (next: T) => {
      const timer = pendingTimers.get(def.key)
      if (timer !== undefined) {
        clearTimeout(timer)
        pendingTimers.delete(def.key)
      }
      setParams({ [def.key]: toUrlValue(def, next) }, { replaceHistory: true })
    },
    [def, setParams],
  )

  const set = useCallback(
    (update: T | ((prev: T) => T), opts?: { flush?: boolean }) => {
      const store = getDefaultStore()
      const current = store.get(def.atom)
      const next = typeof update === "function" ? (update as (prev: T) => T)(current) : update
      if (sameSerialized(def, current, next)) {
        return
      }
      setLive(next)
      if (opts?.flush === true) {
        flush(next)
        return
      }
      const timer = pendingTimers.get(def.key)
      if (timer !== undefined) {
        clearTimeout(timer)
      }
      pendingTimers.set(
        def.key,
        setTimeout(() => {
          pendingTimers.delete(def.key)
          setParams({ [def.key]: toUrlValue(def, next) }, { replaceHistory: true })
        }, def.debounceMs),
      )
    },
    [def, setLive, setParams, flush],
  )

  // Gesture end / unmount path: write the current live value now.
  const flushCurrent = useCallback(() => {
    flush(getDefaultStore().get(def.atom))
  }, [def, flush])

  return [value, set, flushCurrent] as const
}
