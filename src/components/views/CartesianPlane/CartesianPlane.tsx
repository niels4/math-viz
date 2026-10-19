import { useEffect, useState, type PointerEvent, type RefObject } from "react"
import { useRef } from "react"

import { useDevicePixelRatio } from "#src/components/hooks/useDevicePixelRatio.ts"
import { useHotReload } from "#src/components/hooks/useHotReload.ts"
import { useResizeObserver } from "#src/components/hooks/useResizeObserver.ts"
import { useQueryParam } from "#src/components/router/queryParamAtom.ts"
import { useAppTheme, type ThemeVars } from "#src/state/useAppTheme.ts"

import style from "./CartesianPlain.module.css"
import { planeFont } from "./constants"
import {
  drawCartesianPlane,
  hitTest,
  type PlotCurve,
  type PlotHandle,
  type PlotLine,
} from "./drawCartesianPlane"
import { HtmlOverlay } from "./HtmlOverlay"
import { centerParam, scaleParam } from "./queryParams"
import { useCamera } from "./useCamera"

const ctxOptions: CanvasRenderingContext2DSettings = { colorSpace: "display-p3" } as const

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
  width: number,
  height: number,
  center: [number, number],
  scale: number,
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

    canvas.width = Math.max(1, Math.round(width * dpr))
    canvas.height = Math.max(1, Math.round(height * dpr))

    const ctx = canvas.getContext("2d", ctxOptions)

    if (ctx === null) {
      console.error("Could not create canvas 2d context.")
      return
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)

    draw(ctx, width, height, center, scale, theme, font, curves, handles, lines)
  }, [ref, width, height, dpr, center, scale, theme, font, curves, handles, lines, draw])
}

export const CartesianPlane = ({
  curves,
  handles,
  lines,
}: {
  curves: readonly PlotCurve[]
  handles: readonly PlotHandle[]
  lines: readonly PlotLine[]
}) => {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const { width, height } = useResizeObserver(ref)
  const [center, setCenter, flushCenter] = useQueryParam(centerParam)
  const [scale, setScale, flushScale] = useQueryParam(scaleParam)
  const { themeVars } = useAppTheme()
  const font = useCanvasFont(planeFont)

  const flushCamera = () => {
    flushCenter()
    flushScale()
  }

  const panning = useCamera(ref, center, scale, setCenter, setScale, flushCamera)
  const cursor: Cursor = panning ? "grab-active" : "pan"
  useUpdateCanvas(ref, width, height, center, scale, themeVars, font, curves, handles, lines)

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const clientX = e.nativeEvent.offsetX
    const clientY = e.nativeEvent.offsetY
    const hoveredHandle = hitTest(handles, [clientX, clientY], "onHover", width, height, center, scale)
    console.log("got hovered hit", hoveredHandle)
  }

  return (
    <div className={style.wrapper}>
      <canvas
        ref={ref}
        className={style.cartesian_plane}
        data-cursor={cursor}
        onPointerMove={onPointerMove}
      />
      <HtmlOverlay />
    </div>
  )
}
