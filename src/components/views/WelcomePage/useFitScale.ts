import { useLayoutEffect, useState, type RefObject } from "react"

export type Size = { width: number; height: number }

export const useFitScale = (ref: RefObject<HTMLElement | null>, wide: Size, stacked: Size) => {
  const [layout, setLayout] = useState({ fit: 1, stacked: false })

  useLayoutEffect(() => {
    const el = ref.current
    if (el === null) {
      return
    }
    const measure = () => {
      const { clientWidth: width, clientHeight: height } = el
      if (width > 0 && height > 0) {
        const isStacked = height > width && width < wide.width
        const design = isStacked ? stacked : wide
        setLayout({ fit: Math.min(1, width / design.width, height / design.height), stacked: isStacked })
      }
    }
    measure()
    if (typeof ResizeObserver !== "function") {
      return
    }
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, wide, stacked])

  return layout
}
