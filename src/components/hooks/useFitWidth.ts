import { useLayoutEffect, type RefObject } from "react"

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
