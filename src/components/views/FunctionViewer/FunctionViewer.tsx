import { useEffect, useRef, type ReactNode } from "react"

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

  const x0 = Math.floor(width / 2)
  const y0 = Math.floor(height / 2)

  ctx.moveTo(0, y0)
  ctx.lineTo(width, y0)
  ctx.stroke()

  ctx.moveTo(x0, 0)
  ctx.lineTo(x0, height)
  ctx.stroke()
}

const CartesianPlane = () => {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const { width, height } = useResizeObserver(ref)
  const draw = useHotReload(drawCartesianPlane)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) {
      return
    }
    canvas.width = width
    canvas.height = height

    if (ctxRef.current == null) {
      ctxRef.current = canvas.getContext("2d", { colorSpace: "display-p3" }) ?? canvas.getContext("2d")
      if (ctxRef.current === null) {
        console.error("Could not create canvas 2d context.")
        return
      }
    }

    const ctx = ctxRef.current

    const dpr = 1
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)

    draw(ctx, width, height)
  }, [width, height, draw])

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
