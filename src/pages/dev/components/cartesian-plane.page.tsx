import { useEffect, useRef } from "react"

import { useResizeObserver } from "#src/components/hooks/useResizeObserver.ts"

import style from "./cartesian-plane.module.css"

export default function CartesianPlanePage() {
  const { ref, width, height } = useResizeObserver()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) {
      return
    }
    const dpr = window.devicePixelRatio ?? 1
    canvas.width = Math.max(1, Math.round(width * dpr))
    canvas.height = Math.max(1, Math.round(height * dpr))
    const ctx = canvas.getContext("2d")
    if (ctx === null) {
      return
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    ctx.strokeStyle = "#888"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(width / 2, 0)
    ctx.lineTo(width / 2, height)
    ctx.moveTo(0, height / 2)
    ctx.lineTo(width, height / 2)
    ctx.stroke()
  }, [width, height])

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
