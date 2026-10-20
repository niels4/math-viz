import { useLayoutEffect, useRef, type RefObject } from "react"

/**
 * A value as event handlers must read it between renders: what the last
 * render committed, advanced by each handler that changes it. Events that
 * land before React renders again (wheel notches a trackpad sends within one
 * frame, a pinch's moves for two fingers) then build on each other, where a
 * value read from the render would give them all the same start, so only the
 * last would count. A handler that changes the value sets `current` as it
 * sends it on.
 */
export const useLiveValue = <T>(value: T): RefObject<T> => {
  const live = useRef(value)
  useLayoutEffect(() => {
    live.current = value
  })
  return live
}
