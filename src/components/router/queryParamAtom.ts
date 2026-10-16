import { atom, getDefaultStore, useAtom } from "jotai"
import { useCallback, useEffect } from "react"

import { getCurrentSearchParams, subscribeSearchParams, useSetSearchParams } from "./router-hooks"

export type QueryParamOptions<T> = {
  parse: (raw: string | null) => T | undefined
  serialize: (value: T) => string | number | null
  defaultValue: T
  debounceMs?: number
  equals?: (a: T, b: T) => boolean
}

export type QueryParamDef<T> = QueryParamOptions<T> & {
  key: string
  atom: ReturnType<typeof atom<T>>
  debounceMs: number
  equals: (a: T, b: T) => boolean
}

const defaultEquals = <T>(a: T, b: T): boolean => {
  if (Object.is(a, b)) {
    return true
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => Object.is(v, (b as unknown[])[i]))
  }
  return false
}

export const queryParamAtom = <T>(key: string, options: QueryParamOptions<T>): QueryParamDef<T> => {
  const { parse, serialize, defaultValue, debounceMs = 200, equals = defaultEquals } = options
  const initial = parse(getCurrentSearchParams().get(key)) ?? defaultValue
  return { key, parse, serialize, defaultValue, debounceMs, equals, atom: atom<T>(initial) }
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

  // When something else changes this key in the URL (back/forward, an edit
  // in the address bar, another component), copy the new value into the
  // live atom. When our own flush lands in the URL, the value there already
  // equals the live value, so nothing changes.
  useEffect(() => {
    const store = getDefaultStore()
    let lastRaw: string | null | undefined
    const syncFromUrl = (params: URLSearchParams) => {
      const raw = params.get(def.key)
      // This listener runs when any param is written, not only this one, so
      // skip unless this key's text in the URL changed.
      if (raw === lastRaw) {
        return
      }
      lastRaw = raw
      const next = def.parse(raw) ?? def.defaultValue
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
      if (def.equals(current, next)) {
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
