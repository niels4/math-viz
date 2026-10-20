import { useSetAtom } from "jotai"
import { useEffect, useState, type RefObject } from "react"
import { useRef } from "react"

import { useDevicePixelRatio } from "#src/components/hooks/useDevicePixelRatio.ts"
import { useHotReload } from "#src/components/hooks/useHotReload.ts"
import { useResizeObserver } from "#src/components/hooks/useResizeObserver.ts"
import { useQueryParam } from "#src/components/router/queryParamAtom.ts"
import { useAppTheme, type ThemeVars } from "#src/state/useAppTheme.ts"

import style from "./CartesianPlain.module.css"
import { labelMargin, planeFont } from "./constants"
import { drawCartesianPlane, type PlotCurve, type PlotHandle, type PlotLine } from "./drawCartesianPlane"
import { layoutGrid, type GridLayout } from "./grid"
import { HtmlOverlay } from "./HtmlOverlay"
import { centerParam, scaleParam } from "./queryParams"
import { planeSizeAtom } from "./state"
import { useCamera } from "./useCamera"
import { useMouseHandles } from "./useMouseHandles"

const ctxOptions: CanvasRenderingContext2DSettings = { colorSpace: "display-p3" } as const

type CursorState = {
  hovering: boolean
  dragging: boolean
}

type Cursor = "pan" | "grab-hover" | "grab-active"

const useCanvasFont = (font: string): string | null => {
  const [loaded, setLoaded] = useState<string | null>(null)
  useEffect(() => {
    if (!("fonts" in document)) {
      return
    }
    let mounted = true
    const showText = () => {
      if (mounted) {
        setLoaded(font)
      }
    }
    void document.fonts.load(font).then(showText, showText)
    return () => {
      mounted = false
    }
  }, [font])
  return loaded === font ? font : null
}

const useUpdateCanvas = (
  ref: RefObject<HTMLCanvasElement | null>,
  grid: GridLayout,
  theme: ThemeVars,
  font: string | null,
  curves: readonly PlotCurve[],
  handles: readonly PlotHandle[],
  lines: readonly PlotLine[],
) => {
  const draw = useHotReload(drawCartesianPlane)
  const dpr = useDevicePixelRatio()

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) {
      return
    }

    canvas.width = Math.max(1, Math.round(grid.width * dpr))
    canvas.height = Math.max(1, Math.round(grid.height * dpr))

    const ctx = canvas.getContext("2d", ctxOptions)

    if (ctx === null) {
      console.error("Could not create canvas 2d context.")
      return
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, grid.width, grid.height)

    draw(ctx, grid, theme, font, curves, handles, lines)
  }, [ref, grid, dpr, theme, font, curves, handles, lines, draw])
}

export const CartesianPlane = ({
  curves,
  handles,
  lines,
  cursorState,
}: {
  curves: readonly PlotCurve[]
  handles: readonly PlotHandle[]
  lines: readonly PlotLine[]
  cursorState: CursorState
}) => {
  const { hovering, dragging } = cursorState
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

  const panning = useCamera(ref, center, scale, setCenter, setScale, flushCamera, dragging)
  const cursor: Cursor = dragging || panning ? "grab-active" : hovering ? "grab-hover" : "pan"
  const grid = layoutGrid(width, height, center, scale, labelMargin)
  useUpdateCanvas(ref, grid, themeVars, font, curves, handles, lines)

  const { onPointerMove, onPointerDown } = useMouseHandles(ref, grid, handles)

  return (
    <div className={style.wrapper}>
      <canvas
        ref={ref}
        className={style.cartesian_plane}
        data-cursor={cursor}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
      />
      <HtmlOverlay />
    </div>
  )
}
