import React, { useEffect, useState, type RefObject } from "react"
import { useRef } from "react"

import { useDevicePixelRatio } from "#src/components/hooks/useDevicePixelRatio.ts"
import { useHotReload } from "#src/components/hooks/useHotReload.ts"
import { useResizeObserver } from "#src/components/hooks/useResizeObserver.ts"
import { useQueryParam } from "#src/components/router/queryParamAtom.ts"
import { useAppTheme, type ThemeVars } from "#src/state/useAppTheme.ts"

import style from "./CartesianPlain.module.css"
import { labelMargin, planeFont } from "./constants"
import {
  drawCartesianPlane,
  fromPx,
  hitTest,
  type PlotCurve,
  type PlotHandle,
  type PlotLine,
} from "./drawCartesianPlane"
import { layoutGrid, type GridLayout } from "./grid"
import { HtmlOverlay } from "./HtmlOverlay"
import { centerParam, scaleParam } from "./queryParams"
import { useCamera } from "./useCamera"

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
  const [center, setCenter, flushCenter] = useQueryParam(centerParam)
  const [scale, setScale, flushScale] = useQueryParam(scaleParam)
  const { themeVars } = useAppTheme()
  const font = useCanvasFont(planeFont)
  const lastHoveredIndex = useRef(-1)

  const flushCamera = () => {
    flushCenter()
    flushScale()
  }

  const panning = useCamera(ref, center, scale, setCenter, setScale, flushCamera, dragging)
  const cursor: Cursor = dragging || panning ? "grab-active" : hovering ? "grab-hover" : "pan"
  const grid = layoutGrid(width, height, center, scale, labelMargin)
  useUpdateCanvas(ref, grid, themeVars, font, curves, handles, lines)

  const plotPoint = (e: PointerEvent) => fromPx(grid, [e.offsetX, e.offsetY])

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const clientX = e.nativeEvent.offsetX
    const clientY = e.nativeEvent.offsetY
    const hoveredHandleIndex = hitTest(grid, handles, [clientX, clientY], "onHover")
    const onHoverHandler = handles[hoveredHandleIndex]?.handlers?.onHover
    if (onHoverHandler != null) {
      onHoverHandler(e.nativeEvent, plotPoint(e.nativeEvent))
    }

    const onHoverEndHandler = handles[lastHoveredIndex.current]?.handlers?.onHoverEnd
    if (onHoverEndHandler && lastHoveredIndex.current !== hoveredHandleIndex) {
      onHoverEndHandler(e.nativeEvent, plotPoint(e.nativeEvent))
    }
    lastHoveredIndex.current = hoveredHandleIndex
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!ref.current) {
      return
    }

    const clientX = e.nativeEvent.offsetX
    const clientY = e.nativeEvent.offsetY
    const pressedHandleIndex = hitTest(grid, handles, [clientX, clientY], "onPointerDown")
    const handle = handles[pressedHandleIndex]
    const pointerDownHandler = handle?.handlers?.onPointerDown
    if (pointerDownHandler == null) {
      return
    }
    pointerDownHandler(e.nativeEvent, plotPoint(e.nativeEvent))
    const onDragHandler = handle?.handlers?.onDrag
    if (onDragHandler == null) {
      return
    }

    const onDrag = (e: PointerEvent) => {
      onDragHandler(e, plotPoint(e))
    }

    const onDragEnd = (e: PointerEvent) => {
      ref.current?.removeEventListener("pointermove", onDrag)
      window.removeEventListener("pointerup", onDragEnd)
      const pointerUpHandler = handle?.handlers?.onPointerUp
      if (pointerUpHandler) {
        pointerUpHandler(e, plotPoint(e))
      }
    }

    ref.current.addEventListener("pointermove", onDrag)
    window.addEventListener("pointerup", onDragEnd)
  }

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
