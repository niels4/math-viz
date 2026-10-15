import { useEffect } from "react"
import { useRef } from "react"

import { useDevicePixelRatio } from "#src/components/hooks/useDevicePixelRatio.ts"
import { useHotReload } from "#src/components/hooks/useHotReload.ts"
import { useResizeObserver } from "#src/components/hooks/useResizeObserver.ts"

import style from "./CartesianPlain.module.css"
import { drawCartesianPlane } from "./drawCartesianPlane"

const ctxOptions: CanvasRenderingContext2DSettings = { colorSpace: "display-p3" } as const

export const CartesianPlane = () => {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const { width, height } = useResizeObserver(ref)
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

    draw(ctx, width, height)
  }, [width, height, dpr, draw])

  return <canvas ref={ref} className={style.cartesian_plane} />
}
