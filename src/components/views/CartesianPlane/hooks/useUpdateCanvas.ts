import { useEffect, useState, type RefObject } from "react"

import type { ThemeVars } from "#src/state/useAppTheme.ts"

import { useDevicePixelRatio } from "#src/components/hooks/useDevicePixelRatio.ts"
import { useHotReload } from "#src/components/hooks/useHotReload.ts"

import type {
  drawCartesianPlane,
  PlotCurve,
  PlotHandle,
  PlotLine,
  PlotMarker,
} from "../draw/drawCartesianPlane"
import type { GridLayout } from "../draw/grid"

import { labelLetterFont, labelNumberFont } from "../constants"

const ctxOptions: CanvasRenderingContext2DSettings = { colorSpace: "display-p3" } as const

export const useCanvasFont = (font: string): string | null => {
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
    void Promise.allSettled([font, labelLetterFont, labelNumberFont].map((f) => document.fonts.load(f))).then(
      showText,
    )
    return () => {
      mounted = false
    }
  }, [font])
  return loaded === font ? font : null
}

export const useUpdateCanvas = (
  ref: RefObject<HTMLCanvasElement | null>,
  drawPlane: typeof drawCartesianPlane,
  grid: GridLayout,
  theme: ThemeVars,
  font: string | null,
  curves: readonly PlotCurve[],
  handles: readonly PlotHandle[],
  lines: readonly PlotLine[],
  markers: readonly PlotMarker[],
) => {
  const draw = useHotReload(drawPlane)
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

    draw(ctx, grid, theme, font, curves, handles, lines, markers)
  }, [ref, grid, dpr, theme, font, curves, handles, lines, markers, draw])
}
