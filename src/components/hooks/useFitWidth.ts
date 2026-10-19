import { useLayoutEffect, type RefObject } from "react"

// Shrinks an element to fit its container: sets --fit-scale on the element
// for its CSS to scale it by. Scale it with a transform, not its font size:
// a transform leaves the element's layout width alone, so the observer here
// sees only new content or a new container width, never its own fit.
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
      // offsetWidth rounds to whole px, so keep 1 px spare.
      const scale = Math.min(1, (outer.clientWidth - 1) / inner.offsetWidth)
      inner.style.setProperty("--fit-scale", String(scale))
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
