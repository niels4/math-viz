import type { PointerEvent as ReactPointerEvent, RefObject } from "react"

import { useRef, useState } from "react"

import { fromPx, hitTest, type PlotHandle, type PlotMarker, type PlotPoint } from "../draw/drawCartesianPlane"
import { type GridLayout } from "../draw/grid"

export const useMouseHandles = (
  ref: RefObject<HTMLCanvasElement | null>,
  grid: GridLayout,
  handles: readonly (PlotHandle | PlotMarker)[],
  onHoverPlane: (point: PlotPoint | null) => void,
) => {
  const lastHoveredIndex = useRef(-1)
  const [hovering, setHovering] = useState(false)
  const [dragging, setDragging] = useState(false)

  const plotPoint = (e: PointerEvent) => fromPx(grid, [e.offsetX, e.offsetY])

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const clientX = e.nativeEvent.offsetX
    const clientY = e.nativeEvent.offsetY
    const hoveredHandleIndex = hitTest(grid, handles, [clientX, clientY])
    const onHoverHandler = handles[hoveredHandleIndex]?.handlers?.onHover
    if (onHoverHandler != null) {
      onHoverHandler(e.nativeEvent, plotPoint(e.nativeEvent))
    }

    const onHoverEndHandler = handles[lastHoveredIndex.current]?.handlers?.onHoverEnd
    if (onHoverEndHandler && lastHoveredIndex.current !== hoveredHandleIndex) {
      onHoverEndHandler(e.nativeEvent, plotPoint(e.nativeEvent))
    }
    lastHoveredIndex.current = hoveredHandleIndex
    setHovering(hoveredHandleIndex !== -1)
    onHoverPlane(dragging || hoveredHandleIndex !== -1 ? null : plotPoint(e.nativeEvent))
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
    const pressedHandleIndex = hitTest(grid, handles, [clientX, clientY])
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
    setDragging(true)

    const onDrag = (e: PointerEvent) => {
      onDragHandler(e, plotPoint(e))
    }

    const onDragEnd = (e: PointerEvent) => {
      ref.current?.removeEventListener("pointermove", onDrag)
      window.removeEventListener("pointerup", onDragEnd)
      setDragging(false)
      const pointerUpHandler = handle?.handlers?.onPointerUp
      if (pointerUpHandler) {
        pointerUpHandler(e, plotPoint(e))
      }
    }

    ref.current.addEventListener("pointermove", onDrag)
    window.addEventListener("pointerup", onDragEnd)
  }

  return { hovering, dragging, onPointerMove, onPointerDown, onPointerLeave }
}
