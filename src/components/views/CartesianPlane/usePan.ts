import type { Dispatch, RefObject, SetStateAction } from "react"

import { useEffect, useRef } from "react"

import { unscaledUnitSize } from "./constants"

export const usePan = (
  ref: RefObject<HTMLCanvasElement | null>,
  setCenter: Dispatch<SetStateAction<[number, number]>>,
  zoom: number,
) => {
  const prevMouse = useRef<[number, number]>([0, 0])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) {
      return
    }

    const onPanUpdate = (e: MouseEvent) => {
      const ctxUnit = unscaledUnitSize / zoom
      const xDiff = e.clientX - prevMouse.current[0]
      const yDiff = e.clientY - prevMouse.current[1]
      prevMouse.current[0] = e.clientX
      prevMouse.current[1] = e.clientY
      setCenter(([x, y]) => [x - xDiff / ctxUnit, y + yDiff / ctxUnit])
    }

    const onPanEnd = () => {
      window.removeEventListener("mouseup", onPanEnd)
      window.removeEventListener("mousemove", onPanUpdate)
    }

    const onPanStart = (e: MouseEvent) => {
      prevMouse.current[0] = e.clientX
      prevMouse.current[1] = e.clientY
      window.addEventListener("mouseup", onPanEnd)
      window.addEventListener("mousemove", onPanUpdate)
    }

    canvas.addEventListener("mousedown", onPanStart)

    return () => {
      canvas.removeEventListener("mousedown", onPanStart)
      window.removeEventListener("mouseup", onPanEnd)
      window.removeEventListener("mousemove", onPanUpdate)
    }
  }, [ref, zoom, setCenter])
}
