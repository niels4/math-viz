import { useEffect, useRef, type ReactNode } from "react"

import { useDevicePixelRatio } from "#src/components/hooks/useDevicePixelRatio.ts"
import { useHotReload } from "#src/components/hooks/useHotReload.ts"
import { useResizeObserver } from "#src/components/hooks/useResizeObserver.ts"

import { TopBar } from "../TopBar/TopBar"
import style from "./FunctionViewer.module.css"

const Page = ({ children }: { children: ReactNode | ReactNode[] }) => {
  return <div className={style.page}>{children}</div>
}

const SideBar = () => {
  return <div className={style.sidebar}>Sidebar!</div>
}

const drawCartesianPlane = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.strokeStyle = "#fff"
  ctx.lineWidth = 1

  const x0 = Math.floor(width / 2) + 0.5
  const y0 = Math.floor(height / 2) + 0.5

  ctx.beginPath()
  ctx.moveTo(0, y0)
  ctx.lineTo(width, y0)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(x0, 0)
  ctx.lineTo(x0, height)
  ctx.stroke()

  ctx.strokeStyle = "#0ff"
  ctx.fillStyle = "#0ff"
  ctx.beginPath()
  ctx.arc(width / 2 - 120, height / 2 + 89, 50, 0, Math.PI * 2)
  ctx.fill()
}

const CartesianPlane = () => {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const { width, height } = useResizeObserver(ref)
  const draw = useHotReload(drawCartesianPlane)
  const dpr = useDevicePixelRatio()

  console.log("dpr", dpr)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) {
      return
    }

    canvas.width = Math.max(1, Math.round(width * dpr))
    canvas.height = Math.max(1, Math.round(height * dpr))

    if (ctxRef.current == null) {
      ctxRef.current = canvas.getContext("2d", { colorSpace: "display-p3" }) ?? canvas.getContext("2d")
      if (ctxRef.current === null) {
        console.error("Could not create canvas 2d context.")
        return
      }
    }

    const ctx = ctxRef.current

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)

    draw(ctx, width, height)
  }, [width, height, dpr, draw])

  return <canvas ref={ref} className={style.cartesian_plane} />
}

export const FunctionViewer = () => {
  return (
    <Page>
      <TopBar />
      <SideBar />
      <CartesianPlane />
    </Page>
  )
}
