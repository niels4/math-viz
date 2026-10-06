import type { KeyboardEvent, PointerEvent, ReactNode } from "react"

import { useEffect, useEffectEvent, useRef, useState } from "react"

import { useDevicePixelRatio } from "#src/components/hooks/useDevicePixelRatio.ts"
import { useResizeObserver } from "#src/components/hooks/useResizeObserver.ts"
import { useAppTheme } from "#src/state/useAppTheme.ts"
import workSansStyles from "#src/style/fonts/work_sans/work_sans.module.css"

import type { MarksLayout } from "./marks.ts"
import type { Rect } from "./rect.ts"
import type { PlaneScene } from "./scene.ts"
import type { PlaneView } from "./viewport.ts"

import style from "./cartesian-plane.module.css"
import { drawCartesianPlane } from "./drawCartesianPlane"
import { PLANE_FACES, readoutFaces } from "./faces.ts"
import { hitTest } from "./hitTest.ts"
import { layoutMarks, NO_MARKS } from "./marks.ts"
import { PlaneChrome } from "./PlaneChrome.tsx"
import { usePan } from "./usePan.ts"
import { usePlaneKeys } from "./usePlaneKeys.ts"
import { useZoom } from "./useZoom.ts"
import {
  defaultZoom,
  makeViewport,
  panIntoView,
  stepZoom,
  toMathX,
  toMathY,
  visibleExtent,
} from "./viewport.ts"
import { ZoomControl } from "./ZoomControl.tsx"

/** D17: the default zoom keeps y ∈ [−5, 5] in view. */
const DEFAULT_FIT_HALF_RANGE_Y = 5

const KEY_HELP = "arrows pan, + and − zoom, 0 resets the view"

/** Where the pointer is, as the owner hears it after every move. */
export type PlanePointer = {
  /** The math point under the pointer. */
  x: number
  y: number
  /** The draggable point under the pointer, or being dragged, by id; null over the empty plane. */
  over: string | null
  /** The pointer is moving the view, not reading it (FV 07: a probe hides). */
  panning: boolean
}

export type MarkDragPhase = "start" | "move" | "end"

export type CartesianPlaneProps = {
  scene: PlaneScene
  /** Maths beside the caption's caps label, e.g. y = f(x). */
  caption?: ReactNode
  captionLabel?: string
  /** Controls left of the zoom control, bottom-right. */
  tools?: ReactNode
  /** The default zoom keeps y ∈ [−fitHalfRangeY, fitHalfRangeY] in view (D17). */
  fitHalfRangeY?: number
  /** Keys the owner adds to the plane's own, as read aloud: "[ and ] move P". */
  keyHelp?: string
  onViewChange?: ((view: PlaneView) => void) | undefined
  /** The pointer on the plane after every move, or null when it leaves. */
  onPointer?: ((pointer: PlanePointer | null) => void) | undefined
  /** A draggable point pressed, dragged and let go; `to` is where the pointer has moved it. */
  onMarkDrag?: ((phase: MarkDragPhase, id: string, to: { x: number; y: number }) => void) | undefined
  /** A key on the focused plane, before its own keys: true when the owner took it. */
  onKeyDown?: ((event: KeyboardEvent<HTMLElement>) => boolean) | undefined
}

/** The canvas's cursor says what a press will do (FV 07 › pointer modes). */
type Cursor = "probe" | "grab" | "grabbing" | "link"

/** A point being dragged: the press in maths, and where the point was. */
type MarkDrag = { id: string; pointerId: number; fromX: number; fromY: number; markX: number; markY: number }

// Canvas text draws in whatever face has loaded: load the plane's faces, then
// redraw, so a first frame in fallback faces doesn't stay on screen.
const useCanvasFonts = (): number => {
  const [loads, setLoads] = useState(0)
  useEffect(() => {
    if (!("fonts" in document)) {
      return
    }
    let live = true
    void Promise.all(PLANE_FACES.map(({ face, text }) => document.fonts.load(face.font, text))).then(() => {
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

// The chrome's boxes in plane pixels: every overlay part marked data-keep-out,
// the corner brackets apart from the plates.
const measureKeepOut = (root: HTMLElement | null): { plates: Rect[]; corners: Rect[] } => {
  const plates: Rect[] = []
  const corners: Rect[] = []
  if (root === null) {
    return { plates, corners }
  }
  const base = root.getBoundingClientRect()
  for (const el of root.querySelectorAll<HTMLElement | SVGElement>("[data-keep-out]")) {
    const r = el.getBoundingClientRect()
    const box = { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height }
    ;(el.dataset["keepOut"] === "corner" ? corners : plates).push(box)
  }
  return { plates, corners }
}

export function CartesianPlane({
  scene,
  caption,
  captionLabel = "Plane",
  tools,
  fitHalfRangeY = DEFAULT_FIT_HALF_RANGE_Y,
  keyHelp,
  onViewChange,
  onPointer,
  onMarkDrag,
  onKeyDown,
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
  const { zoom, setZoom, onPointerDown, onPointerMove, onPointerUp, pointerCount } = useZoom({
    canvasRef,
    pan,
  })
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
  const planeKeys = usePlaneKeys({ zoom, setZoom, pan, resetView })
  const onPlaneKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.target === e.currentTarget && onKeyDown?.(e) === true) {
      e.preventDefault()
      return
    }
    planeKeys(e)
  }
  const onZoomStep = (direction: 1 | -1) => {
    pan.stopInertia()
    setZoom((z) => stepZoom(z, direction))
  }

  // The marks as last drawn: what the pointer can take.
  const marksRef = useRef<MarksLayout>(NO_MARKS)
  const markDragRef = useRef<MarkDrag | null>(null)
  const [cursor, setCursor] = useState<Cursor>("probe")

  const local = (e: PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { px: e.clientX - rect.left, py: e.clientY - rect.top }
  }
  const report = (px: number, py: number, over: string | null, panning: boolean) => {
    onPointer?.({ x: toMathX(vp, px), y: toMathY(vp, py), over, panning })
  }
  // The pointer at rest on the plane: the cursor shows what a press would
  // take, and the owner hears which point it is over.
  const hoverAt = (px: number, py: number) => {
    const hit = hitTest(marksRef.current, px, py)
    setCursor(hit === null ? "probe" : hit.kind === "edge" ? "link" : "grab")
    report(px, py, hit?.kind === "point" ? hit.id : null, false)
  }

  const endMarkDrag = () => {
    const drag = markDragRef.current
    if (drag === null) {
      return
    }
    markDragRef.current = null
    setCursor("grab")
    const point = scene.points.find((p) => p.id === drag.id)
    onMarkDrag?.("end", drag.id, { x: point?.x ?? drag.markX, y: point?.y ?? drag.markY })
  }

  const onCanvasPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (markDragRef.current !== null) {
      return
    }
    const { px, py } = local(e)
    // Only a gesture's first pointer takes a mark; a second finger pinches.
    const hit = e.isPrimary && pointerCount() === 0 ? hitTest(marksRef.current, px, py) : null
    if (hit?.kind === "edge") {
      pan.stopInertia()
      const next = panIntoView(vp, { panX, panY }, hit.target)
      pan.setPanX(next.panX)
      pan.setPanY(next.panY)
      return
    }
    const point = hit?.kind === "point" ? scene.points.find((p) => p.id === hit.id) : undefined
    if (point !== undefined && e.button === 0) {
      pan.stopInertia()
      e.currentTarget.setPointerCapture(e.pointerId)
      markDragRef.current = {
        id: point.id,
        pointerId: e.pointerId,
        fromX: toMathX(vp, px),
        fromY: toMathY(vp, py),
        markX: point.x,
        markY: point.y,
      }
      setCursor("grabbing")
      onMarkDrag?.("start", point.id, { x: point.x, y: point.y })
      report(px, py, point.id, false)
      return
    }
    onPointerDown(e)
    setCursor("grabbing")
    report(px, py, null, true)
  }

  // The zoom handlers run first so gestures keep working; a dragged point
  // takes its pointer's moves instead. A move with no button held ends a
  // drag whose release was missed (AGENTS.md › pointer-capture drags).
  const onCanvasPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const { px, py } = local(e)
    const drag = markDragRef.current
    if (drag !== null && drag.pointerId === e.pointerId) {
      if (e.buttons === 0) {
        endMarkDrag()
        return
      }
      const x = toMathX(vp, px)
      const y = toMathY(vp, py)
      onMarkDrag?.("move", drag.id, { x: drag.markX + (x - drag.fromX), y: drag.markY + (y - drag.fromY) })
      report(px, py, drag.id, false)
      return
    }
    onPointerMove(e)
    if (pointerCount() > 0) {
      report(px, py, null, true)
      return
    }
    hoverAt(px, py)
  }

  const onCanvasPointerUp = (e: PointerEvent<HTMLCanvasElement>) => {
    if (markDragRef.current?.pointerId === e.pointerId) {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
      endMarkDrag()
      return
    }
    onPointerUp(e)
    if (pointerCount() === 0) {
      // The pan is over: the pointer reads again where it is.
      const { px, py } = local(e)
      hoverAt(px, py)
    }
  }

  const onHoverLeave = () => {
    if (markDragRef.current === null) {
      onPointer?.(null)
    }
  }

  // Letting go anywhere, or the window losing focus, ends a point's drag.
  const onWindowRelease = useEffectEvent(() => {
    endMarkDrag()
  })
  useEffect(() => {
    const release = () => onWindowRelease()
    window.addEventListener("pointerup", release)
    window.addEventListener("pointercancel", release)
    window.addEventListener("blur", release)
    return () => {
      window.removeEventListener("pointerup", release)
      window.removeEventListener("pointercancel", release)
      window.removeEventListener("blur", release)
    }
  }, [])

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
    const chrome = measureKeepOut(rootRef.current)
    const marks = layoutMarks(scene, makeViewport({ width, height, dpr }, { zoom, panX, panY }), {
      measure: (face, text) => {
        ctx.font = face.font
        return ctx.measureText(text).width
      },
      readout: readoutFaces(themeVars.readoutFont),
      plates: chrome.plates,
      corners: chrome.corners,
    })
    marksRef.current = marks
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
      marks,
      keepOut: [...chrome.plates, ...chrome.corners],
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
      aria-label={`Plane: ${KEY_HELP}${keyHelp === undefined ? "" : `, ${keyHelp}`}`}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      onKeyDown={onPlaneKeyDown}
      data-testid="cartesian-plane"
    >
      <canvas
        ref={canvasRef}
        className={style.canvas}
        data-testid="cartesian-canvas"
        data-cursor={cursor}
        data-zoom={zoom}
        data-origin-x={vp.originX}
        data-origin-y={vp.originY}
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onCanvasPointerMove}
        onPointerUp={onCanvasPointerUp}
        onPointerCancel={onCanvasPointerUp}
        onLostPointerCapture={(e) => {
          if (markDragRef.current?.pointerId === e.pointerId) {
            endMarkDrag()
          }
        }}
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
