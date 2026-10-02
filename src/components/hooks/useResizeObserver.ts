import { useEffect, useRef, useState } from "react"

export const useResizeObserver = <T extends HTMLElement = HTMLDivElement>() => {
  const ref = useRef<T | null>(null)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (el === null) return
    const report = (newWidth: number, newHeight: number) => {
      setWidth(newWidth)
      setHeight(newHeight)
    }
    const rect = el.getBoundingClientRect()
    report(rect.width, rect.height)
    if (typeof ResizeObserver !== "function") return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry === undefined) return
      report(entry.contentRect.width, entry.contentRect.height)
    })
    observer.observe(el)
    return () => {
      observer.disconnect()
    }
  }, [])

  return {
    ref,
    width,
    height,
  }
}
