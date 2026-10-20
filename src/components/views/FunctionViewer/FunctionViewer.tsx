import type { ReactNode } from "react"

import { useAtomValue } from "jotai"

import { useQueryParam } from "#src/components/router/queryParamAtom.ts"

import { CartesianPlane } from "../CartesianPlane/CartesianPlane"
import { usePlotCurves } from "../CartesianPlane/usePlotCurves"
import { TopBar } from "../TopBar/TopBar"
import { baseFunctions, unitX } from "./baseFunctions"
import style from "./FunctionViewer.module.css"
import { aParam, bParam, funcParam, hParam, kParam } from "./queryParams"
import { SideBar } from "./SideBar/SideBar"
import { litAtom } from "./state"
import { transformCurves, transformLines } from "./transformCurves"
import { useShownTransform } from "./useShownTransform"
import { useTransformHandles } from "./useTransformHandles"

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
  const { handles, cursorState } = useTransformHandles(func, shown)

  return (
    <CartesianPlane
      curves={transformCurves(curves, shown)}
      handles={handles}
      lines={transformLines(lit, baseFunctions[func], unitX[func], shown)}
      cursorState={cursorState}
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
