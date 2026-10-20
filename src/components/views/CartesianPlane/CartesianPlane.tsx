import { useSetAtom } from "jotai"
import { useEffect } from "react"
import { useRef } from "react"

import { useResizeObserver } from "#src/components/hooks/useResizeObserver.ts"
import { useQueryParam } from "#src/components/router/queryParamAtom.ts"
import { useAppTheme } from "#src/state/useAppTheme.ts"

import style from "./CartesianPlain.module.css"
import { labelMargin, planeFont } from "./constants"
import {
  drawCartesianPlane,
  type PlotCurve,
  type PlotHandle,
  type PlotLine,
  type PlotMarker,
  type PlotPoint,
} from "./draw/drawCartesianPlane"
import { drawScaleLegend } from "./draw/drawScaleLegend"
import { layoutGrid } from "./draw/grid"
import { useCamera } from "./hooks/useCamera"
import { useMouseHandles } from "./hooks/useMouseHandles"
import { useCanvasFont, useUpdateCanvas } from "./hooks/useUpdateCanvas"
import { HtmlOverlay } from "./HtmlOverlay"
import { centerParam, scaleParam } from "./queryParams"
import { planeSizeAtom } from "./state"

type Cursor = "pan" | "grab-hover" | "grab-active"

const drawPlaneWithScale: typeof drawCartesianPlane = (ctx, grid, theme, font, ...rest) => {
  drawCartesianPlane(ctx, grid, theme, font, ...rest)
  if (font !== null) {
    drawScaleLegend(ctx, grid, theme, font)
  }
}

export const CartesianPlane = ({
  curves,
  handles,
  lines,
  markers,
  onHoverPoint,
}: {
  curves: readonly PlotCurve[]
  handles: readonly PlotHandle[]
  lines: readonly PlotLine[]
  markers: readonly PlotMarker[]
  onHoverPoint?: (point: PlotPoint | null) => void
}) => {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const { width, height } = useResizeObserver(ref)
  const setPlaneSize = useSetAtom(planeSizeAtom)
  useEffect(() => {
    setPlaneSize({ width, height })
  }, [width, height, setPlaneSize])
  const [center, setCenter, flushCenter] = useQueryParam(centerParam)
  const [scale, setScale, flushScale] = useQueryParam(scaleParam)
  const { themeVars } = useAppTheme()
  const font = useCanvasFont(planeFont)

  const flushCamera = () => {
    flushCenter()
    flushScale()
  }

  const grid = layoutGrid(width, height, center, scale, labelMargin)
  useUpdateCanvas(ref, drawPlaneWithScale, grid, themeVars, font, curves, handles, lines, markers)

  const { hovering, dragging, onPointerMove, onPointerDown, onPointerLeave } = useMouseHandles(
    ref,
    grid,
    [...handles, ...markers],
    (point) => onHoverPoint?.(panning ? null : point),
  )
  const panning = useCamera(ref, center, scale, setCenter, setScale, flushCamera, dragging)
  const cursor: Cursor = dragging || panning ? "grab-active" : hovering ? "grab-hover" : "pan"

  return (
    <div className={style.wrapper}>
      <canvas
        ref={ref}
        className={style.cartesian_plane}
        data-cursor={cursor}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerLeave={onPointerLeave}
      />
      <HtmlOverlay />
    </div>
  )
}
