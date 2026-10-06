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
      const natural = inner.getBoundingClientRect().width
      const room = outer.clientWidth - SLACK
      inner.style.setProperty("--fit-scale", natural > room && room > 0 ? String(room / natural) : "1")
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
