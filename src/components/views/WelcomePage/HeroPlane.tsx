import { useRef } from "react"

import { useResizeObserver } from "#src/components/hooks/useResizeObserver.ts"
import { useAppTheme } from "#src/state/useAppTheme.ts"

import { labelMargin, planeFont } from "../CartesianPlane/constants"
import { drawCartesianPlane } from "../CartesianPlane/draw/drawCartesianPlane"
import { layoutGrid } from "../CartesianPlane/draw/grid"
import { usePlotCurves } from "../CartesianPlane/hooks/usePlotCurves"
import { useCanvasFont, useUpdateCanvas } from "../CartesianPlane/hooks/useUpdateCanvas"
import { centerParam, scaleParam } from "../CartesianPlane/queryParams"
import { baseFunctions } from "../FunctionViewer/baseFunctions"
import { transformCurves } from "../FunctionViewer/transformCurves"
import { useWelcomeLoop } from "./useWelcomeLoop"
import style from "./WelcomePage.module.css"

export const HeroPlane = () => {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const { width, height } = useResizeObserver(ref)
  const { themeVars } = useAppTheme()
  const font = useCanvasFont(planeFont)
  const { func, ...transform } = useWelcomeLoop()
  const curves = usePlotCurves(baseFunctions[func])
  const grid = layoutGrid(width, height, centerParam.defaultValue, scaleParam.defaultValue, labelMargin)
  useUpdateCanvas(
    ref,
    drawCartesianPlane,
    grid,
    themeVars,
    font,
    transformCurves(curves, transform),
    [],
    [],
    [],
  )

  return <canvas ref={ref} className={style.hero_plane} />
}
