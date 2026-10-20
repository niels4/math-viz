import { useAtomValue } from "jotai"
import { useState, type ReactNode } from "react"

import { useQueryParam } from "#src/components/router/queryParamAtom.ts"

import type { PlotHandle } from "../CartesianPlane/drawCartesianPlane"

import { CartesianPlane } from "../CartesianPlane/CartesianPlane"
import { usePlotCurves } from "../CartesianPlane/usePlotCurves"
import { TopBar } from "../TopBar/TopBar"
import { baseFunctions, unitX } from "./baseFunctions"
import style from "./FunctionViewer.module.css"
import { aParam, bParam, funcParam, hParam, kParam } from "./queryParams"
import { SideBar } from "./SideBar/SideBar"
import { litAtom } from "./state"
import { transformCurves, transformLines, unitPoint } from "./transformCurves"
import { useShownTransform } from "./useShownTransform"

const Page = ({ children }: { children: ReactNode | ReactNode[] }) => {
  return <div className={style.page}>{children}</div>
}

const Plot = () => {
  const [func] = useQueryParam(funcParam)
  const [a] = useQueryParam(aParam)
  const [b] = useQueryParam(bParam)
  const [h] = useQueryParam(hParam)
  const [k] = useQueryParam(kParam)
  const curves = usePlotCurves(baseFunctions[func])
  const shown = useShownTransform({ a, b, h, k })
  const lit = useAtomValue(litAtom)
  const [hovering, setHovering] = useState(false)

  const onHover = () => setHovering(true)

  const shiftHandle: PlotHandle = {
    point: { x: h, y: k },
    shape: "diamond",
    handlers: {
      onHover,
      onPointerDown: () => {
        console.log("shift handle clicked")
      },
    },
  }

  const scaleHandle: PlotHandle = {
    point: unitPoint(baseFunctions[func], unitX[func], shown),
    shape: "square",
    handlers: {
      onHover,
      onPointerDown: () => {
        console.log("scale handle clicked")
      },
    },
  }

  const transformHandles = [shiftHandle, scaleHandle] as const

  return (
    <CartesianPlane
      curves={transformCurves(curves, shown)}
      handles={transformHandles}
      lines={transformLines(lit, baseFunctions[func], unitX[func], shown)}
      cursorState={{ hovering, setHovering }}
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
