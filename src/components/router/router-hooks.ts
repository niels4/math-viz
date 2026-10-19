import { useCallback, useEffect, useState } from "react"

import { createFullHash, getRouteAndSearchString, trimSlashes } from "./router-util"

let currentRoute = ""
let currentSearchString = ""
let currentSearchParams = new URLSearchParams()

type RouteListener = (route: string) => void
type SearchParamsListener = (searchParams: URLSearchParams) => void

const routeListeners = new Set<RouteListener>()
const searchParamListeners = new Set<SearchParamsListener>()

const updateRoute = (route: string) => {
  const trimmedRoute = trimSlashes(route)
  if (route !== trimmedRoute) {
    window.location.hash = trimmedRoute
  }

  if (currentRoute === trimmedRoute) {
    return
  }

  currentRoute = trimmedRoute

  for (const listener of routeListeners) {
    listener(currentRoute)
  }
}

const updateSearchParams = (searchString: string) => {
  if (searchString === currentSearchString) {
    return
  }

  currentSearchString = searchString
  currentSearchParams = new URLSearchParams(currentSearchString)

  for (const listener of searchParamListeners) {
    listener(currentSearchParams)
  }
}

const onHashChange = () => {
  const { route, search } = getRouteAndSearchString()
  updateRoute(route)
  updateSearchParams(search)
}

onHashChange()
window.addEventListener("hashchange", onHashChange)

export const useRoute = () => {
  const [route, setRoute] = useState(currentRoute)

  useEffect(() => {
    routeListeners.add(setRoute)
    return () => {
      routeListeners.delete(setRoute)
    }
  }, [setRoute])

  return route
}

export const getCurrentSearchParams = () => currentSearchParams

export const subscribeSearchParams = (listener: SearchParamsListener) => {
  searchParamListeners.add(listener)
  return () => {
    searchParamListeners.delete(listener)
  }
}

export const useSearchParams = () => {
  const [searchParams, setSearchParams] = useState(currentSearchParams)

  useEffect(() => {
    searchParamListeners.add(setSearchParams)
    return () => {
      searchParamListeners.delete(setSearchParams)
    }
  }, [setSearchParams])

  return searchParams
}

export type SetSearchParamsObject = Record<string, string | number | null>

export type SetSearchParamsOptions = {
  replaceHistory?: boolean
}

export const useSetSearchParams = () => {
  return useCallback((paramUpdates: SetSearchParamsObject, options?: SetSearchParamsOptions) => {
    const updatedParams = new URLSearchParams(currentSearchParams)
    for (const [key, value] of Object.entries(paramUpdates)) {
      if (value == null) {
        updatedParams.delete(key)
      } else {
        updatedParams.set(key, String(value))
      }
    }
    const searchString = updatedParams.toString().replaceAll(/%2C/gi, ",")
    const newHash = createFullHash(currentRoute, searchString)
    if (options?.replaceHistory === true) {
      history.replaceState(null, "", `#${newHash}`)
    } else {
      window.location.hash = newHash
    }
    onHashChange()
  }, [])
}
