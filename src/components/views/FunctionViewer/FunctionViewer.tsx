import type { ReactNode } from "react"

import { useAtom, useAtomValue } from "jotai"

import { useQueryParam } from "#src/components/router/queryParamAtom.ts"
import { useAppTheme, type ThemeSlug, type ThemeVars } from "#src/state/useAppTheme.ts"

import type { PlotLabel, PlotPoint } from "../CartesianPlane/draw/drawCartesianPlane"

import { CartesianPlane } from "../CartesianPlane/CartesianPlane"
import { usePlotCurves } from "../CartesianPlane/hooks/usePlotCurves"
import { TopBar } from "../TopBar/TopBar"
import { baseFunctions, unitX } from "./baseFunctions"
import style from "./FunctionViewer.module.css"
import { LandscapeHint } from "./LandscapeHint"
import { aParam, bParam, funcParam, hParam, kParam, pParam } from "./queryParams"
import { formatNumber, quantize } from "./SideBar/PointsSection/format"
import { SideBar } from "./SideBar/SideBar"
import { litAtom, pDraggingAtom, qXAtom } from "./state"
import { transformCurves, transformed, transformLines } from "./transformCurves"
import { usePointHandle } from "./usePointHandle"
import { useShownTransform } from "./useShownTransform"
import { useTransformHandles } from "./useTransformHandles"

const Page = ({ children }: { children: ReactNode | ReactNode[] }) => {
  return <div className={style.page}>{children}</div>
}

// Matches --point-p in SideBar.module.css.
const pointPInk = (slug: ThemeSlug): keyof ThemeVars =>
  slug === "midnight-violet" ? "ordinal03" : "ordinal05"

// Matches --point-q in SideBar.module.css.
const pointQInks: Partial<Record<ThemeSlug, keyof ThemeVars>> = {
  "clean-teal": "ordinal04",
  "educational-warm": "ordinal11",
  "arctic-ice": "ordinal03",
}
const pointQInk = (slug: ThemeSlug): keyof ThemeVars => pointQInks[slug] ?? "ordinal02"

const pointLabel = (name: string, { x, y }: PlotPoint): PlotLabel => ({
  name,
  coords: `(${formatNumber(x)}, ${formatNumber(y)})`,
})

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
  const [qX, setQX] = useAtom(qXAtom)
  const handles = useTransformHandles(func, shown)
  const pHandlers = usePointHandle()
  const f = transformed(baseFunctions[func], shown)
  const pPoint = { x: p, y: f(p) }
  const qPoint = qX === null ? null : { x: qX, y: f(qX) }

  return (
    <CartesianPlane
      curves={transformCurves(curves, shown)}
      handles={handles}
      lines={transformLines(lit, baseFunctions[func], unitX[func], shown)}
      markers={[
        {
          point: pPoint,
          ink: pointPInk(themeSlug),
          label: pointLabel("P", pPoint),
          dropLines: pDragging,
          handlers: pHandlers,
        },
        ...(qPoint === null
          ? []
          : [
              {
                point: qPoint,
                ink: pointQInk(themeSlug),
                shape: "ring" as const,
                label: pointLabel("Q", qPoint),
                dropLines: true,
                guide: true,
              },
            ]),
      ]}
      onHoverPoint={(point) => setQX(point === null ? null : quantize(point.x))}
    />
  )
}

export const FunctionViewer = () => {
  return (
    <Page>
      <div className={style.header}>
        <LandscapeHint />
        <TopBar title="Function Viewer" subtitle="Functions · Transformations" />
      </div>
      <SideBar />
      <Plot />
    </Page>
  )
}
