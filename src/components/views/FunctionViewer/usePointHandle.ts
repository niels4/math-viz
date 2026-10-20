import { useSetAtom } from "jotai"
import { useRef } from "react"

import { useQueryParam } from "#src/components/router/queryParamAtom.ts"

import type { PlotHandleMouseHandlers } from "../CartesianPlane/draw/drawCartesianPlane"

import { pParam } from "./queryParams"
import { quantize } from "./SideBar/PointsSection/format"
import { pDraggingAtom } from "./state"

export const usePointHandle = (): PlotHandleMouseHandlers => {
  const [p, setP, flushP] = useQueryParam(pParam)
  const setPDragging = useSetAtom(pDraggingAtom)
  const grab = useRef(0)

  return {
    onPointerDown: (_e, point) => {
      grab.current = p - point.x
      setPDragging(true)
    },
    onDrag: (_e, point) => {
      setP(quantize(point.x + grab.current))
    },
    onPointerUp: () => {
      setPDragging(false)
      flushP()
    },
  }
}
