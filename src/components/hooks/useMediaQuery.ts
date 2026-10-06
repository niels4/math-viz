import { useCallback, useSyncExternalStore } from "react"

const matches = (query: string): boolean => typeof matchMedia === "function" && matchMedia(query).matches

// Whether a media query matches, kept current as the window changes. Where
// there is no matchMedia (jsdom), it never matches.
export const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof matchMedia !== "function") {
        return () => {}
      }
      const list = matchMedia(query)
      list.addEventListener("change", onChange)
      return () => list.removeEventListener("change", onChange)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => matches(query),
    () => false,
  )
}
