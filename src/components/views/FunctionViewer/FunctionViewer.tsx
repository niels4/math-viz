import { type ReactNode } from "react"

import { useQueryParam } from "#src/components/router/queryParamAtom.ts"

import { CartesianPlane } from "../CartesianPlane/CartesianPlane"
import { usePlotCurves } from "../CartesianPlane/usePlotCurves"
import { TopBar } from "../TopBar/TopBar"
import { baseFunctions } from "./baseFunctions"
import style from "./FunctionViewer.module.css"
import { aParam, bParam, funcParam, hParam, kParam } from "./queryParams"
import { SideBar } from "./SideBar/SideBar"
import { transformCurves } from "./transformCurves"
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

  return <CartesianPlane curves={transformCurves(curves, shown)} />
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
