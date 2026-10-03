import { useEffect, useRef, useState } from "react"

import { useResizeObserver } from "#src/components/hooks/useResizeObserver.ts"
import { useAppTheme } from "#src/state/useAppTheme.ts"

import { drawCartesianPlane } from "./cartesian-plane-util"
import style from "./cartesian-plane.module.css"

const useDevicePixelRatio = () => {
  const [dpr, setDpr] = useState(() => window.devicePixelRatio ?? 1)

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return
    }
    const query = window.matchMedia(`(resolution: ${dpr}dppx)`)
    const update = () => {
      setDpr(window.devicePixelRatio ?? 1)
    }
    query.addEventListener("change", update)
    return () => {
      query.removeEventListener("change", update)
    }
  }, [dpr])

  return dpr
}

export default function CartesianPlanePage() {
  const { themeVars } = useAppTheme()
  const { ref, width, height } = useResizeObserver()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const dpr = useDevicePixelRatio()

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) {
      return
    }
    canvas.width = Math.max(1, Math.round(width * dpr))
    canvas.height = Math.max(1, Math.round(height * dpr))
    const ctx = canvas.getContext("2d", { colorSpace: "display-p3" }) ?? canvas.getContext("2d")
    if (ctx === null) {
      return
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    drawCartesianPlane(ctx, width, height, themeVars)
    // HMR: drawCartesianPlane identity changes only on hot reload, intentional redraw
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keeps the HMR redraw
  }, [width, height, dpr, drawCartesianPlane])

  return (
    <div ref={ref} className={style.page}>
      <canvas
        ref={canvasRef}
        className={style.canvas}
        style={{ width, height }}
        data-testid="cartesian-canvas"
      />
      <p className={style.readout}>
        {width} X {height}
      </p>
    </div>
  )
}
