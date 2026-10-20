import { useAtomValue, useSetAtom } from "jotai"
import { useRef, useState, type ReactNode } from "react"

import { useQueryParam } from "#src/components/router/queryParamAtom.ts"

import type { PlotHandle, PlotPoint } from "../CartesianPlane/drawCartesianPlane"

import { CartesianPlane } from "../CartesianPlane/CartesianPlane"
import { usePlotCurves } from "../CartesianPlane/usePlotCurves"
import { TopBar } from "../TopBar/TopBar"
import { baseFunctions, unitX } from "./baseFunctions"
import style from "./FunctionViewer.module.css"
import { aParam, bParam, funcParam, hParam, kParam } from "./queryParams"
import { SideBar } from "./SideBar/SideBar"
import { hoverAtom, litAtom, scrubModeAtoms, type TransformParam } from "./state"
import { transformCurves, transformLines, unitPoint } from "./transformCurves"
import { useShownTransform } from "./useShownTransform"

const Page = ({ children }: { children: ReactNode | ReactNode[] }) => {
  return <div className={style.page}>{children}</div>
}

const shiftParams: readonly TransformParam[] = ["h", "k"]
const scaleParams: readonly TransformParam[] = ["a", "b"]

const Plot = () => {
  const [func] = useQueryParam(funcParam)
  const [a, setA, flushA] = useQueryParam(aParam)
  const [b, setB, flushB] = useQueryParam(bParam)
  const [h, setH, flushH] = useQueryParam(hParam)
  const [k, setK, flushK] = useQueryParam(kParam)
  const curves = usePlotCurves(baseFunctions[func])
  const shown = useShownTransform({ a, b, h, k })
  const lit = useAtomValue(litAtom)
  const setHover = useSetAtom(hoverAtom)
  const setAMode = useSetAtom(scrubModeAtoms.a)
  const setBMode = useSetAtom(scrubModeAtoms.b)
  const setHMode = useSetAtom(scrubModeAtoms.h)
  const setKMode = useSetAtom(scrubModeAtoms.k)
  const [hovering, setHovering] = useState(false)
  const [dragging, setDragging] = useState(false)
  const grab = useRef<PlotPoint>({ x: 0, y: 0 })

  const onHover = (params: readonly TransformParam[]) => () => {
    setHovering(true)
    setHover(params, true)
  }
  const onHoverEnd = (params: readonly TransformParam[]) => () => {
    setHovering(false)
    setHover(params, false)
  }

  const shiftHandle: PlotHandle = {
    point: { x: h, y: k },
    shape: "diamond",
    handlers: {
      onHover: onHover(shiftParams),
      onHoverEnd: onHoverEnd(shiftParams),
      onPointerDown: (_e, point) => {
        grab.current = { x: h - point.x, y: k - point.y }
        setDragging(true)
        setHMode("coarse")
        setKMode("coarse")
      },
      onDrag: (_e, point) => {
        setH(point.x + grab.current.x)
        setK(point.y + grab.current.y)
      },
      onPointerUp: () => {
        setDragging(false)
        setHMode(null)
        setKMode(null)
        flushH()
        flushK()
      },
    },
  }

  const unit = unitPoint(baseFunctions[func], unitX[func], shown)

  const scaleHandle: PlotHandle = {
    point: unit,
    shape: "square",
    handlers: {
      onHover: onHover(scaleParams),
      onHoverEnd: onHoverEnd(scaleParams),
      onPointerDown: (_e, point) => {
        grab.current = { x: unit.x - point.x, y: unit.y - point.y }
        setDragging(true)
        setAMode("coarse")
        setBMode("coarse")
      },
      onDrag: (_e, point) => {
        setB((point.x + grab.current.x - h) / unitX[func])
        setA((point.y + grab.current.y - k) / baseFunctions[func](unitX[func]))
      },
      onPointerUp: () => {
        setDragging(false)
        setAMode(null)
        setBMode(null)
        flushA()
        flushB()
      },
    },
  }

  const transformHandles = [shiftHandle, scaleHandle] as const

  return (
    <CartesianPlane
      curves={transformCurves(curves, shown)}
      handles={transformHandles}
      lines={transformLines(lit, baseFunctions[func], unitX[func], shown)}
      cursorState={{ hovering, dragging }}
    />
  )
}

export const FunctionViewer = () => {
  return (
    <Page>
      <TopBar />
      <SideBar />
      <Plot />
    </Page>
  )
}
