import { useEffect, type RefObject } from "react"
import { useRef } from "react"

import { useDevicePixelRatio } from "#src/components/hooks/useDevicePixelRatio.ts"
import { useHotReload } from "#src/components/hooks/useHotReload.ts"
import { useResizeObserver } from "#src/components/hooks/useResizeObserver.ts"
import { useQueryParam } from "#src/components/router/queryParamAtom.ts"
import { useAppTheme, type ThemeVars } from "#src/state/useAppTheme.ts"

import style from "./CartesianPlain.module.css"
import { drawCartesianPlane } from "./drawCartesianPlane"
import { centerParam, scaleParam } from "./queryParams"
import { useCamera } from "./useCamera"
import { usePan } from "./usePan"

const ctxOptions: CanvasRenderingContext2DSettings = { colorSpace: "display-p3" } as const

const useUpdateCanvas = (
  ref: RefObject<HTMLCanvasElement | null>,
  width: number,
  height: number,
  center: [number, number],
  scale: number,
  theme: ThemeVars,
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

    draw(ctx, width, height, center, scale, theme)
  }, [ref, width, height, dpr, center, scale, theme, draw])
}

export const CartesianPlane = () => {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const { width, height } = useResizeObserver(ref)
  const [center, setCenter, flushCenter] = useQueryParam(centerParam)
  const [scale, setScale, flushScale] = useQueryParam(scaleParam)
  const { themeVars } = useAppTheme()

  // A zoom moves the center too, so both reach the URL when it settles.
  const flushCamera = () => {
    flushCenter()
    flushScale()
  }

  usePan(ref, setCenter, scale, flushCenter)
  useCamera(ref, center, scale, setCenter, setScale, flushCamera)
  useUpdateCanvas(ref, width, height, center, scale, themeVars)

  return <canvas ref={ref} className={style.cartesian_plane} />
}
