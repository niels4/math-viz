import type { KeyboardEvent, PointerEvent, ReactNode, Ref } from "react"

import { gsap } from "gsap"
import { useCallback, useEffect, useEffectEvent, useImperativeHandle, useRef, useState } from "react"

import { useDevicePixelRatio } from "#src/components/hooks/useDevicePixelRatio.ts"
import { useResizeObserver } from "#src/components/hooks/useResizeObserver.ts"
import { useAppTheme, type ThemeVars } from "#src/state/useAppTheme.ts"
import workSansStyles from "#src/style/fonts/work_sans/work_sans.module.css"
import { motionLevel } from "#src/util/motion/motion.ts"
import { selectNothingUntilRelease } from "#src/util/pointer/selectNothing.ts"

import type { EdgeArrival } from "./arrivals.ts"
import type { MarksLayout } from "./marks.ts"
import type { Rect } from "./rect.ts"
import type { DrawnPlane } from "./region.ts"
import type { PlaneScene } from "./scene.ts"
import type { PlaneView } from "./viewport.ts"

import { arriveEdges } from "./arrivals.ts"
import style from "./cartesian-plane.module.css"
import { drawCartesianPlane } from "./drawCartesianPlane"
import { PLANE_FACES, readoutFaces } from "./faces.ts"
import { hitTest } from "./hitTest.ts"
import { layoutMarks, NO_MARKS } from "./marks.ts"
import { PlaneChrome } from "./PlaneChrome.tsx"
import { regionOf } from "./region.ts"
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

/** What an owner can ask the plane from outside. */
export type CartesianPlaneHandle = {
  /**
   * Where the named curves and points sit on screen as last drawn (client
   * px), with the axis labels beside them (region.ts); null when none shows.
   */
  regionOf: (ids: readonly string[]) => Rect | null
  /**
   * Paints this scene now, and again on every view change, in place of the
   * scene prop, until null hands the canvas back to the prop: an owner's
   * animation frames, so its final scene never flashes before them.
   */
  drawFrame: (scene: PlaneScene | null) => void
}

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
  /**
   * A draggable point or a handle pressed, dragged and let go; `to` is where
   * the pointer has moved it (a handle along one axis while Shift is held).
   */
  onMarkDrag?: ((phase: MarkDragPhase, id: string, to: { x: number; y: number }) => void) | undefined
  /** A key on the focused plane, before its own keys: true when the owner took it. */
  onKeyDown?: ((event: KeyboardEvent<HTMLElement>) => boolean) | undefined
  /**
   * The plane itself took the keyboard's focus (a focus the browser shows,
   * as from Tab; a click's focus doesn't count), or lost the focus.
   */
  onKeyboardFocus?: ((focused: boolean) => void) | undefined
  ref?: Ref<CartesianPlaneHandle>
}

/** Whether the browser shows this focus (Tab, not a click); false where :focus-visible is unknown. */
const focusVisible = (el: Element): boolean => {
  try {
    return el.matches(":focus-visible")
  } catch {
    return false
  }
}

/** The canvas's cursor says what a press will do (FV 07 › pointer modes). */
type Cursor = "probe" | "grab" | "grabbing" | "link"

/**
 * A mark being dragged: the press in maths, and where the mark was. A
 * handle moves freely, Shift locking it to one axis; a point's owner reads
 * what it needs of where the pointer moved it.
 */
type MarkDrag = {
  id: string
  kind: "point" | "handle"
  pointerId: number
  fromX: number
  fromY: number
  markX: number
  markY: number
}

/** Where the pointer has moved a mark: as far as the pointer, or along one axis with Shift on a handle. */
const dragTo = (drag: MarkDrag, x: number, y: number, shift: boolean): { x: number; y: number } => {
  let dx = x - drag.fromX
  let dy = y - drag.fromY
  if (drag.kind === "handle" && shift) {
    if (Math.abs(dx) >= Math.abs(dy)) {
      dy = 0
    } else {
      dx = 0
    }
  }
  return { x: drag.markX + dx, y: drag.markY + dy }
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

/** What a paint reads, as last rendered: the plane paints from outside React's renders too. */
type PaintInputs = {
  width: number
  height: number
  dpr: number
  zoom: number
  panX: number
  panY: number
  scene: PlaneScene
  themeVars: ThemeVars
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
  onKeyboardFocus,
  ref,
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
  const { zoom, setZoom, onPointerDown, onPointerMove, onPointerUp, onLostPointerCapture, pointerCount } =
    useZoom({ canvasRef, pan })
  const vp = makeViewport({ width, height, dpr }, { zoom, panX, panY })

  // D17: while the view is still the default one, its zoom follows the
  // plane's height (a shorter window's plane zooms out). Adjusted during
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
  // The whole frame as last drawn: what the owner can ask about.
  const drawnRef = useRef<DrawnPlane | null>(null)
  // What the next paint reads, the owner's held frame, when each edge
  // marker appeared, and the ticker's paint while one is arriving.
  const inputsRef = useRef<PaintInputs | null>(null)
  const heldRef = useRef<PlaneScene | null>(null)
  const arrivalsRef = useRef(new Map<string, EdgeArrival>())
  const tickRef = useRef<(() => void) | null>(null)

  // One frame from the latest inputs: the held scene if the owner holds
  // one, else the scene prop. Reads refs only, so the owner's frames and the
  // plane's own motion paint through it between React's renders.
  const paint = useCallback(function paintFrame() {
    const inputs = inputsRef.current
    const ctx = ctxRef.current
    if (inputs === null || ctx === null) {
      return
    }
    const { width, height, dpr, zoom, panX, panY, themeVars } = inputs
    const scene = heldRef.current ?? inputs.scene
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    const chrome = measureKeepOut(rootRef.current)
    const frameVp = makeViewport({ width, height, dpr }, { zoom, panX, panY })
    const laid = layoutMarks(scene, frameVp, {
      measure: (face, text) => {
        ctx.font = face.font
        return ctx.measureText(text).width
      },
      readout: readoutFaces(themeVars.readoutFont),
      plates: chrome.plates,
      corners: chrome.corners,
    })
    marksRef.current = laid
    const level = motionLevel()
    const { marks, arriving } =
      level === "none"
        ? { marks: laid, arriving: false }
        : arriveEdges(laid, arrivalsRef.current, performance.now(), level === "reduced")
    const grid = drawCartesianPlane({
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
    drawnRef.current = { vp: frameVp, scene, marks: laid, labels: grid?.labels ?? [] }
    // An edge marker still arriving paints again on the next tick.
    if (arriving && tickRef.current === null) {
      tickRef.current = paintFrame
      gsap.ticker.add(paintFrame)
    } else if (!arriving && tickRef.current !== null) {
      gsap.ticker.remove(tickRef.current)
      tickRef.current = null
    }
  }, [])
  useEffect(
    () => () => {
      if (tickRef.current !== null) {
        gsap.ticker.remove(tickRef.current)
        tickRef.current = null
      }
    },
    [],
  )

  useImperativeHandle(
    ref,
    () => ({
      regionOf: (ids) => {
        const canvas = canvasRef.current
        const region = drawnRef.current === null ? null : regionOf(drawnRef.current, ids)
        if (canvas === null || region === null) {
          return null
        }
        const at = canvas.getBoundingClientRect()
        return { ...region, x: region.x + at.left, y: region.y + at.top }
      },
      drawFrame: (frame) => {
        heldRef.current = frame
        paint()
      },
    }),
    [paint],
  )
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
    report(px, py, hit === null || hit.kind === "edge" ? null : hit.id, false)
  }

  // A draggable mark by id, where it is now.
  const markAt = (id: string): { x: number; y: number } | undefined =>
    scene.points.find((p) => p.id === id) ?? scene.handles?.find((h) => h.id === id)

  const endMarkDrag = () => {
    const drag = markDragRef.current
    if (drag === null) {
      return
    }
    markDragRef.current = null
    setCursor("grab")
    const mark = markAt(drag.id)
    onMarkDrag?.("end", drag.id, { x: mark?.x ?? drag.markX, y: mark?.y ?? drag.markY })
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
    const mark = hit === null ? undefined : markAt(hit.id)
    if (hit !== null && mark !== undefined && e.button === 0) {
      pan.stopInertia()
      e.currentTarget.setPointerCapture(e.pointerId)
      selectNothingUntilRelease(e)
      markDragRef.current = {
        id: hit.id,
        kind: hit.kind,
        pointerId: e.pointerId,
        fromX: toMathX(vp, px),
        fromY: toMathY(vp, py),
        markX: mark.x,
        markY: mark.y,
      }
      setCursor("grabbing")
      onMarkDrag?.("start", hit.id, { x: mark.x, y: mark.y })
      report(px, py, hit.id, false)
      return
    }
    onPointerDown(e)
    setCursor("grabbing")
    report(px, py, null, true)
  }

  // The zoom handlers run first so gestures keep working; a dragged mark
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
      onMarkDrag?.("move", drag.id, dragTo(drag, toMathX(vp, px), toMathY(vp, py), e.shiftKey))
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

  // Letting go anywhere, or the window losing focus, ends a mark's drag.
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
    inputsRef.current = { width, height, dpr, zoom, panX, panY, scene, themeVars }
    paint()
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
      onFocus={(event) => {
        if (event.target === event.currentTarget && focusVisible(event.currentTarget)) {
          onKeyboardFocus?.(true)
        }
      }}
      onBlur={(event) => {
        if (event.target === event.currentTarget) {
          onKeyboardFocus?.(false)
        }
      }}
      data-testid="cartesian-plane"
    >
      <canvas
        ref={canvasRef}
        className={style.canvas}
        data-testid="cartesian-canvas"
        data-cursor={cursor}
        data-handles={scene.handles?.map((h) => h.id).join(" ")}
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
            return
          }
          onLostPointerCapture(e)
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
