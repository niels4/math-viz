import { useLayoutEffect, useState, type RefObject } from "react"

export const useFitScale = (ref: RefObject<HTMLElement | null>, width: number, height: number) => {
  const [fit, setFit] = useState(1)

  useLayoutEffect(() => {
    const el = ref.current
    if (el === null) {
      return
    }
    const measure = () => {
      if (el.clientWidth > 0 && el.clientHeight > 0) {
        setFit(Math.min(1, el.clientWidth / width, el.clientHeight / height))
      }
    }
    measure()
    if (typeof ResizeObserver !== "function") {
      return
    }
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, width, height])

  return fit
}
