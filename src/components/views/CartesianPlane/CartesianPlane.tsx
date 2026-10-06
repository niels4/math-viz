import type { PointerEvent, ReactNode } from "react"

import { useEffect, useRef, useState } from "react"

import { useDevicePixelRatio } from "#src/components/hooks/useDevicePixelRatio.ts"
import { useResizeObserver } from "#src/components/hooks/useResizeObserver.ts"
import { useAppTheme } from "#src/state/useAppTheme.ts"
import workSansStyles from "#src/style/fonts/work_sans/work_sans.module.css"

import type { Rect } from "./rect.ts"
import type { PlaneScene } from "./scene.ts"
import type { PlaneView } from "./viewport.ts"

import style from "./cartesian-plane.module.css"
import { drawCartesianPlane } from "./drawCartesianPlane"
import { ORIGIN_FACE, TICK_LABEL_FACE } from "./faces.ts"
import { PlaneChrome } from "./PlaneChrome.tsx"
import { usePan } from "./usePan.ts"
import { usePlaneKeys } from "./usePlaneKeys.ts"
import { useZoom } from "./useZoom.ts"
import { defaultZoom, makeViewport, stepZoom, toMathX, toMathY, visibleExtent } from "./viewport.ts"
import { ZoomControl } from "./ZoomControl.tsx"

/** D17: the default zoom keeps y ∈ [−5, 5] in view. */
const DEFAULT_FIT_HALF_RANGE_Y = 5

export type CartesianPlaneProps = {
  scene: PlaneScene
  /** Maths beside the caption's caps label, e.g. y = f(x). */
  caption?: ReactNode
  captionLabel?: string
  /** Controls left of the zoom control, bottom-right. */
  tools?: ReactNode
  /** The default zoom keeps y ∈ [−fitHalfRangeY, fitHalfRangeY] in view (D17). */
  fitHalfRangeY?: number
  onViewChange?: ((view: PlaneView) => void) | undefined
  /** The math point under the pointer, or null when it leaves the plane. */
  onPointer?: ((point: { x: number; y: number } | null) => void) | undefined
}

// Canvas text draws in whatever face has loaded: load the plane's faces, then
// redraw, so a first frame in fallback faces doesn't stay on screen.
const useCanvasFonts = (): number => {
  const [loads, setLoads] = useState(0)
  useEffect(() => {
    if (!("fonts" in document)) {
      return
    }
    let live = true
    void Promise.all([
      document.fonts.load(TICK_LABEL_FACE.font, "−0123456789."),
      document.fonts.load(ORIGIN_FACE.font, "O"),
    ]).then(() => {
      if (live) {
        setLoads((n) => n + 1)
      }
    })
    return () => {
      live = false
    }
  }, [])
  return loads
}

// The chrome's boxes in plane pixels: every overlay part marked data-keep-out.
const measureKeepOut = (root: HTMLElement | null): Rect[] => {
  if (root === null) {
    return []
  }
  const base = root.getBoundingClientRect()
  return [...root.querySelectorAll("[data-keep-out]")].map((el) => {
    const r = el.getBoundingClientRect()
    return { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height }
  })
}

export function CartesianPlane({
  scene,
  caption,
  captionLabel = "Plane",
  tools,
  fitHalfRangeY = DEFAULT_FIT_HALF_RANGE_Y,
  onViewChange,
  onPointer,
}: CartesianPlaneProps) {
  const { themeVars } = useAppTheme()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const { width, height } = useResizeObserver(rootRef)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const dpr = useDevicePixelRatio()
  const fontLoads = useCanvasFonts()

  const pan = usePan()
  const { panX, panY } = pan
  const { zoom, setZoom, onPointerDown, onPointerMove, onPointerUp } = useZoom({ canvasRef, pan })
  const vp = makeViewport({ width, height, dpr }, { zoom, panX, panY })

  // D17: while the view is still the default one, its zoom follows the
  // plane's height (the dock's shorter plane zooms out). Adjusted during
  // render, so no frame draws the old zoom.
  const fit = defaultZoom(height, fitHalfRangeY)
  const [shownDefault, setShownDefault] = useState(fit)
  if (fit !== shownDefault) {
    setShownDefault(fit)
    if (zoom === shownDefault && panX === 0 && panY === 0) {
      setZoom(fit)
    }
  }

  const resetView = () => {
    setZoom(fit)
    pan.setPanX(0)
    pan.setPanY(0)
  }
  const onKeyDown = usePlaneKeys({ zoom, setZoom, pan, resetView })
  const onZoomStep = (direction: 1 | -1) => {
    pan.stopInertia()
    setZoom((z) => stepZoom(z, direction))
  }

  // The zoom handlers run first so gestures keep working.
  const onHoverMove = (e: PointerEvent<HTMLCanvasElement>) => {
    onPointerMove(e)
    const rect = e.currentTarget.getBoundingClientRect()
    onPointer?.({ x: toMathX(vp, e.clientX - rect.left), y: toMathY(vp, e.clientY - rect.top) })
  }
  const onHoverLeave = () => {
    onPointer?.(null)
  }

  // Report the view so the owner can bind ranges to it (the P scrubber). The
  // callback lives in a ref so an inline parent closure never retriggers this
  // effect and loops (the report re-renders the parent).
  const viewRef = useRef<((view: PlaneView) => void) | undefined>(undefined)
  useEffect(() => {
    viewRef.current = onViewChange
  }, [onViewChange])

  useEffect(() => {
    if (width === 0 || height === 0) {
      return
    }
    viewRef.current?.({
      zoom,
      extent: visibleExtent(makeViewport({ width, height, dpr }, { zoom, panX, panY })),
    })
  }, [width, height, dpr, zoom, panX, panY])

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) {
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
    drawCartesianPlane({
      ctx,
      width,
      height,
      themeVars,
      dpr,
      zoom,
      panX,
      panY,
      scene,
      keepOut: measureKeepOut(rootRef.current),
    })
    // HMR: drawCartesianPlane identity changes only on hot reload, intentional redraw.
    // fontLoads: redraw once the canvas faces have loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, dpr, zoom, panX, panY, scene, themeVars, fontLoads, drawCartesianPlane])

  // role="application": the plane takes its own keys (arrows pan, + − zoom),
  // which jsx-a11y doesn't count as interactive.
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      ref={rootRef}
      className={`${style.plane} ${workSansStyles.font}`}
      role="application"
      aria-roledescription="plane"
      aria-label="Plane: arrows pan, + and − zoom, 0 resets the view"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      onKeyDown={onKeyDown}
      data-testid="cartesian-plane"
    >
      <canvas
        ref={canvasRef}
        className={style.canvas}
        data-testid="cartesian-canvas"
        data-zoom={zoom}
        data-origin-x={vp.originX}
        data-origin-y={vp.originY}
        onPointerDown={onPointerDown}
        onPointerMove={onHoverMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onHoverLeave}
      />
      <PlaneChrome width={width} height={height} zoom={zoom} label={captionLabel} caption={caption} />
      <div className={style.tools} data-keep-out>
        {tools}
        <ZoomControl zoom={zoom} onStep={onZoomStep} />
      </div>
    </div>
  )
}
