import { useEffect, useState, type RefObject } from "react"
import { useRef } from "react"

import { useDevicePixelRatio } from "#src/components/hooks/useDevicePixelRatio.ts"
import { useHotReload } from "#src/components/hooks/useHotReload.ts"
import { useResizeObserver } from "#src/components/hooks/useResizeObserver.ts"
import { useQueryParam } from "#src/components/router/queryParamAtom.ts"
import { useAppTheme, type ThemeVars } from "#src/state/useAppTheme.ts"

import style from "./CartesianPlain.module.css"
import { planeFallbackFont, planeFont } from "./constants"
import { drawCartesianPlane } from "./drawCartesianPlane"
import { centerParam, scaleParam } from "./queryParams"
import { useCamera } from "./useCamera"

const ctxOptions: CanvasRenderingContext2DSettings = { colorSpace: "display-p3" } as const

// The font to draw canvas text in: fallback until font has loaded, then
// font. The browser fetches a global.css font only when something uses it,
// so load it here. Canvas text drawn before the font arrives would stay in a
// fallback face until the next draw; the font this returns changes when it
// arrives, and useUpdateCanvas draws again with it.
const useCanvasFont = (font: string, fallback: string): string => {
  const [loaded, setLoaded] = useState<string | null>(null)
  useEffect(() => {
    // jsdom has no document.fonts.
    if (!("fonts" in document)) {
      return
    }
    let mounted = true
    void document.fonts.load(font).then(() => {
      if (mounted) {
        setLoaded(font)
      }
    })
    return () => {
      mounted = false
    }
  }, [font])
  return loaded === font ? font : fallback
}

const useUpdateCanvas = (
  ref: RefObject<HTMLCanvasElement | null>,
  width: number,
  height: number,
  center: [number, number],
  scale: number,
  theme: ThemeVars,
  font: string,
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

    draw(ctx, width, height, center, scale, theme, font)
  }, [ref, width, height, dpr, center, scale, theme, font, draw])
}

export const CartesianPlane = () => {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const { width, height } = useResizeObserver(ref)
  const [center, setCenter, flushCenter] = useQueryParam(centerParam)
  const [scale, setScale, flushScale] = useQueryParam(scaleParam)
  const { themeVars } = useAppTheme()
  const font = useCanvasFont(planeFont, planeFallbackFont)

  // The URL gets the camera's center and scale together, once it stops
  // after a drag, a glide or a zoom.
  const flushCamera = () => {
    flushCenter()
    flushScale()
  }

  useCamera(ref, center, scale, setCenter, setScale, flushCamera)
  useUpdateCanvas(ref, width, height, center, scale, themeVars, font)

  return <canvas ref={ref} className={style.cartesian_plane} />
}
