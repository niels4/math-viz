import type { ReactNode } from "react"

import { useAtomValue } from "jotai"

import { useQueryParam } from "#src/components/router/queryParamAtom.ts"
import { useAppTheme, type ThemeSlug, type ThemeVars } from "#src/state/useAppTheme.ts"

import { CartesianPlane } from "../CartesianPlane/CartesianPlane"
import { usePlotCurves } from "../CartesianPlane/usePlotCurves"
import { TopBar } from "../TopBar/TopBar"
import { baseFunctions, unitX } from "./baseFunctions"
import style from "./FunctionViewer.module.css"
import { aParam, bParam, funcParam, hParam, kParam, pParam } from "./queryParams"
import { formatNumber } from "./SideBar/PointsSection/format"
import { SideBar } from "./SideBar/SideBar"
import { litAtom, pDraggingAtom } from "./state"
import { transformCurves, transformed, transformLines } from "./transformCurves"
import { useShownTransform } from "./useShownTransform"
import { useTransformHandles } from "./useTransformHandles"

const Page = ({ children }: { children: ReactNode | ReactNode[] }) => {
  return <div className={style.page}>{children}</div>
}

// Matches --point-p in SideBar.module.css.
const pointPInk = (slug: ThemeSlug): keyof ThemeVars =>
  slug === "midnight-violet" ? "ordinal03" : "ordinal05"

const Plot = () => {
  const [func] = useQueryParam(funcParam)
  const [a] = useQueryParam(aParam)
  const [b] = useQueryParam(bParam)
  const [h] = useQueryParam(hParam)
  const [k] = useQueryParam(kParam)
  const [p] = useQueryParam(pParam)
  const { themeSlug } = useAppTheme()
  const curves = usePlotCurves(baseFunctions[func])
  const shown = useShownTransform({ a, b, h, k })
  const lit = useAtomValue(litAtom)
  const pDragging = useAtomValue(pDraggingAtom)
  const { handles, cursorState } = useTransformHandles(func, shown)
  const pY = transformed(baseFunctions[func], shown)(p)

  return (
    <CartesianPlane
      curves={transformCurves(curves, shown)}
      handles={handles}
      lines={transformLines(lit, baseFunctions[func], unitX[func], shown)}
      markers={[
        {
          point: { x: p, y: pY },
          ink: pointPInk(themeSlug),
          label: { name: "P", coords: `(${formatNumber(p)}, ${formatNumber(pY)})` },
          dropLines: pDragging,
        },
      ]}
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
