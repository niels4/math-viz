import type { PointerEvent as ReactPointerEvent, RefObject } from "react"

import { useRef } from "react"

import { fromPx, hitTest, type PlotHandle, type PlotPoint } from "./drawCartesianPlane"
import { type GridLayout } from "./grid"

export const useMouseHandles = (
  ref: RefObject<HTMLCanvasElement | null>,
  grid: GridLayout,
  handles: readonly PlotHandle[],
  onHoverPlane: (point: PlotPoint | null) => void,
) => {
  const lastHoveredIndex = useRef(-1)

  const plotPoint = (e: PointerEvent) => fromPx(grid, [e.offsetX, e.offsetY])

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const clientX = e.nativeEvent.offsetX
    const clientY = e.nativeEvent.offsetY
    const hoveredHandleIndex = hitTest(grid, handles, [clientX, clientY], "onHover")
    const onHoverHandler = handles[hoveredHandleIndex]?.handlers?.onHover
    if (onHoverHandler != null) {
      onHoverHandler(e.nativeEvent, plotPoint(e.nativeEvent))
    }

    const onHoverEndHandler = handles[lastHoveredIndex.current]?.handlers?.onHoverEnd
    if (onHoverEndHandler && lastHoveredIndex.current !== hoveredHandleIndex) {
      onHoverEndHandler(e.nativeEvent, plotPoint(e.nativeEvent))
    }
    lastHoveredIndex.current = hoveredHandleIndex
    onHoverPlane(hoveredHandleIndex === -1 ? plotPoint(e.nativeEvent) : null)
  }

  const onPointerLeave = () => {
    onHoverPlane(null)
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!ref.current) {
      return
    }

    const clientX = e.nativeEvent.offsetX
    const clientY = e.nativeEvent.offsetY
    const pressedHandleIndex = hitTest(grid, handles, [clientX, clientY], "onPointerDown")
    const handle = handles[pressedHandleIndex]
    const pointerDownHandler = handle?.handlers?.onPointerDown
    if (pointerDownHandler == null) {
      return
    }
    pointerDownHandler(e.nativeEvent, plotPoint(e.nativeEvent))
    const onDragHandler = handle?.handlers?.onDrag
    if (onDragHandler == null) {
      return
    }

    const onDrag = (e: PointerEvent) => {
      onDragHandler(e, plotPoint(e))
    }

    const onDragEnd = (e: PointerEvent) => {
      ref.current?.removeEventListener("pointermove", onDrag)
      window.removeEventListener("pointerup", onDragEnd)
      const pointerUpHandler = handle?.handlers?.onPointerUp
      if (pointerUpHandler) {
        pointerUpHandler(e, plotPoint(e))
      }
    }

    ref.current.addEventListener("pointermove", onDrag)
    window.addEventListener("pointerup", onDragEnd)
  }

  return { onPointerMove, onPointerDown, onPointerLeave }
}
