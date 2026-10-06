import { useLayoutEffect, type RefObject } from "react"

/** Rounding to whole px can add a pixel per run; the fit keeps this much room. */
const SLACK = 2

// Keeps an element no wider than its container: sets --fit-scale on the
// element to the container's width over the element's own (at most 1), for
// its CSS to scale its font by. It measures again whenever either resizes,
// so new content refits before it paints; nothing renders for it.
export const useFitWidth = (
  container: RefObject<HTMLElement | null>,
  element: RefObject<HTMLElement | null>,
) => {
  useLayoutEffect(() => {
    const outer = container.current
    const inner = element.current
    if (outer === null || inner === null) {
      return
    }
    const fit = () => {
      inner.style.setProperty("--fit-scale", "1")
      const room = outer.clientWidth - SLACK
      const natural = inner.getBoundingClientRect().width
      if (room <= 0 || natural <= room) {
        return
      }
      const first = room / natural
      inner.style.setProperty("--fit-scale", String(first))
      // Whole-px parts (a fraction's padding, rounded margins) don't shrink
      // with the font: the width is a part that scales plus a fixed part.
      // A second look tells the two apart and solves for the room.
      const width = inner.getBoundingClientRect().width
      if (width > room) {
        const scaling = (natural - width) / (1 - first)
        const solved = (room - (natural - scaling)) / scaling
        inner.style.setProperty("--fit-scale", String(solved > 0 ? solved : first))
      }
    }
    fit()
    if (typeof ResizeObserver !== "function") {
      return
    }
    const observer = new ResizeObserver(fit)
    observer.observe(outer)
    observer.observe(inner)
    return () => observer.disconnect()
  }, [container, element])
}
