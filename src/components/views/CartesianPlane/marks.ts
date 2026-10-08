import type { GlyphDirection } from "#src/components/ui/glyphPaths.ts"

import { formatNumber } from "#src/util/format/number.ts"

import type { ReadoutFaces } from "./faces.ts"
import type { Polyline } from "./placement.ts"
import type { Measure, Plate, PlateRun, PlateStyle } from "./plates.ts"
import type { Rect } from "./rect.ts"
import type {
  AnnotationPlate,
  Ink,
  PlaneAnnotation,
  PlaneHandle,
  PlanePoint,
  PlaneScene,
  PointStyle,
} from "./scene.ts"
import type { Viewport } from "./viewport.ts"

import { DRAG_TAG_FACES, EDGE_LETTER_FACE, LABEL_LETTER_FACE, NOTE_FACES } from "./faces.ts"
import {
  besideXAxis,
  besideYAxis,
  curvePolylines,
  edgeDirection,
  edgeMarkerBox,
  placeAbove,
  placeBeside,
  placeFixed,
  xTagBox,
  yTagBox,
} from "./placement.ts"
import {
  at,
  DRAG_TAG_STYLE,
  EDGE_STYLE,
  filled,
  LABEL_STYLE,
  layoutPlate,
  NOTE_STYLE,
  outlined,
  TAG_STYLE,
} from "./plates.ts"
import { inflate } from "./rect.ts"
import { toScreenX, toScreenY } from "./viewport.ts"

// Everything the plane draws over its curves, laid out in plane pixels
// before anything paints (figma0 fvDrawCanvas): annotations with their
// plates, handles, the pointer guides, drop lines and axis tags, edge
// markers for points off the view, the markers, where a point was, and
// labels, each placed clear of the curve, the chrome, the tags and the labels
// before it, or held up-right of its point (`labelPlace`). The boxes that
// take the pointer come out of the same pass. Mid-motion a mark keeps its
// place: opacities, shifts and a label's rise are paint-time, so the boxes,
// the keep-outs and the hits stay where the marks rest.

/** A drop line from its point (or the edge it comes in from) toward its axis; `alpha` only below 1. */
export type DropLine = { ink: Ink; x1: number; y1: number; x2: number; y2: number; alpha?: number }

/** `alpha` only below 1. */
export type Marker = { x: number; y: number; style: PointStyle; ink: Ink; focus: boolean; alpha?: number }

/** A straight segment in plane pixels. */
export type Segment = { x1: number; y1: number; x2: number; y2: number }

/**
 * Where a point was, while that is in view: a dashed ring in the point's
 * ink, and an arrow to the point when it is in view too and far enough to show.
 */
export type WasMark = { x: number; y: number; ink: Ink; arrow: (Segment & { ink: Ink }) | null }

/** One point's layer, painted in scene order: where it was, its edge marker or its marker, then its label. */
export type PointLayer = {
  id: string
  was: WasMark | null
  marker: Marker | null
  label: Plate | null
  edge: Plate | null
  /** The edge the point lies past, while it has an edge marker. */
  edgeDir: GlyphDirection | null
}

/** An annotation's line in plane pixels, with its px decorations. */
export type AnnotationStroke = Segment & {
  width: number
  dash?: readonly number[]
  alpha?: number
  startTick?: number
  endTicks?: number
  arrow?: boolean
}

export type AnnotationMarks = {
  layer: PlaneAnnotation["layer"]
  ink: Ink
  strokes: readonly AnnotationStroke[]
  plates: readonly Plate[]
}

export type HandleMark = Omit<PlaneHandle, "id" | "halo" | "held" | "alpha"> & {
  halo: boolean
  held: boolean
  /** Only below 1. */
  alpha?: number
}

export type PlaneHit =
  /** A draggable point's 48 px box. */
  | { kind: "point"; id: string; box: Rect }
  /** A handle's 44 px box. */
  | { kind: "handle"; id: string; box: Rect }
  /** An edge marker: a click pans its point into view. */
  | { kind: "edge"; id: string; box: Rect; target: { x: number; y: number } }

export type MarksLayout = {
  annotations: readonly AnnotationMarks[]
  handles: readonly HandleMark[]
  /** Each pointer guide's screen x; `alpha` only below 1. */
  guides: readonly { x: number; alpha?: number }[]
  dropLines: readonly DropLine[]
  tags: readonly Plate[]
  points: readonly PointLayer[]
  /** Topmost first. */
  hits: readonly PlaneHit[]
  /** Tick labels under a tag are skipped (the tag carries that number): the tags, 4 px larger. */
  tickKeepOut: readonly Rect[]
}

export const NO_MARKS: MarksLayout = {
  annotations: [],
  handles: [],
  guides: [],
  dropLines: [],
  tags: [],
  points: [],
  hits: [],
  tickKeepOut: [],
}

export type MarksOptions = {
  measure: Measure
  /** The theme's readout faces: label coordinates, tag values, edge-marker coordinates. */
  readout: ReadoutFaces
  /** The chrome's plates (caption, scale bar, tools): labels and edge markers keep out of them. */
  plates: readonly Rect[]
  /** The chrome's corner brackets: labels keep out of them too. */
  corners: readonly Rect[]
}

/** A draggable point's hit box (point-marker-fv: 48 × 48, centred on the coordinate). */
const HIT_BOX = 48
/** A handle's hit box: 44 px, a touch target (FV 11). */
const HANDLE_HIT = 44
/** Plates keep clear of a handle's box: the anchor's 28 px, the stretch grip's 24 (fvDrawCanvas). */
const HANDLE_CLEAR = { diamond: 28, square: 24 } as const
/** Labels keep clear of every marker's 28 px box. */
const MARK_BOX = 28
/** Point labels sit 22, 48 or 82 px from their point. */
const LABEL_GAP = 22
/** Annotation plates sit 10, 36 or 70 px from their anchor. */
const PLATE_GAP = 10
/** Labels keep this far from the chrome. */
const CHROME_CLEAR = 8
/** Tick labels this close to a tag are skipped. */
const TAG_CLEAR = 4
/** Where a point was: its ring's radius plus 2, where the arrow starts (fvDrawCanvas: P before, Ø22). */
const WAS_START = 13
/** The arrow's tip stops this far from the point: its marker's knock-out plus 2. */
const WAS_TIP = 14
/** Closer than this, the ring and the marker touch and the arrow has no room. */
const WAS_ARROW_MIN = 26
/** A plate keeps clear of where a point was: its ring and its arrow, 14 px around. */
const WAS_CLEAR = 14

const coords = (x: number, y: number): string => `(${formatNumber(x)}, ${formatNumber(y)})`

const centred = (x: number, y: number, size: number): Rect => ({
  x: x - size / 2,
  y: y - size / 2,
  w: size,
  h: size,
})

const within = (v: number, lo: number, hi: number): boolean => v >= lo && v <= hi

const between = (a: { x: number; y: number }, b: { x: number; y: number }, by: number): Rect =>
  inflate(
    { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) },
    by,
  )

/** An opacity worth recording: only below 1, so marks at rest compare as before. */
const faded = (alpha: number): { alpha?: number } => (alpha < 1 ? { alpha: Math.max(0, alpha) } : {})

/** A plate faded and moved at paint time; at rest, the plate as laid out. */
const moved = (plate: Plate, alpha: number, dx: number, dy: number): Plate =>
  alpha >= 1 && dx === 0 && dy === 0 ? plate : { ...plate, motion: { alpha: Math.max(0, alpha), dx, dy } }

const alphaOf = (p: PlanePoint): number => p.alpha ?? 1

export const layoutMarks = (scene: PlaneScene, vp: Viewport, opts: MarksOptions): MarksLayout => {
  const { width, height, originX, originY } = vp
  if (width === 0 || height === 0) {
    return NO_MARKS
  }
  const { measure, readout } = opts
  const plane = { width, height }
  const sx = (x: number) => toScreenX(vp, x)
  const sy = (y: number) => toScreenY(vp, y)
  const plate = (runs: readonly PlateRun[], style: PlateStyle, ink: Ink) =>
    layoutPlate(runs, style, outlined(ink), measure)
  const tagPlate = (text: string, ink: Ink) =>
    plate([{ kind: "text", text, face: readout.small, ink: "foreground" }], TAG_STYLE, ink)

  // Each point on screen, and the edge it lies past (null in view).
  const located = scene.points
    .filter((p) => Number.isFinite(p.x) && !Number.isNaN(p.y))
    .map((p) => {
      const px = sx(p.x)
      const py = sy(p.y)
      return { p, sx: px, sy: py, off: edgeDirection(px, py, width, height) }
    })

  const guides = scene.guides
    .map((g) => ({ x: sx(g.x), ...faded(g.alpha ?? 1) }))
    .filter((g) => within(g.x, 0, width))
  const dropLines: DropLine[] = []
  const tags: Plate[] = []
  const edges = new Map<string, Plate>()
  const hits: PlaneHit[] = []

  for (const { p, sx: px, sy: py, off } of located) {
    const xIn = within(px, 0, width)
    const yIn = within(py, 0, height)
    if (p.axisTags === true) {
      // In view: drop lines to both axes, a tag on each. Off the view one way,
      // only the axis it still crosses: the line comes in from the edge.
      // Mid-motion the lines reach part way and the tags sit shifted toward
      // the point, where they slide in from.
      const reach = Math.min(1, Math.max(0, p.reach ?? 1))
      const shift = p.tagShift ?? 0
      const alpha = faded(alphaOf(p))
      if (xIn) {
        const y1 = yIn ? py : py < 0 ? 0 : height
        dropLines.push({ ink: p.ink, x1: px, y1, x2: px, y2: y1 + (originY - y1) * reach, ...alpha })
        const tag = tagPlate(formatNumber(p.x), p.ink)
        const toward = py < originY ? -shift : shift
        tags.push(moved(at(tag, xTagBox(px, py, originY, tag.box, height)), alphaOf(p), 0, toward))
      }
      if (yIn) {
        const x1 = xIn ? px : px < 0 ? 0 : width
        dropLines.push({ ink: p.ink, x1, y1: py, x2: x1 + (originX - x1) * reach, y2: py, ...alpha })
        const tag = tagPlate(formatNumber(p.y), p.ink)
        const toward = px > originX ? shift : -shift
        tags.push(moved(at(tag, yTagBox(px, py, originX, tag.box, width)), alphaOf(p), toward, 0))
      }
    }
    if (off !== null && p.edgeMarker === true) {
      const marker = plate(
        [
          { kind: "triangle", dir: off, ink: p.ink },
          ...(p.name === undefined
            ? []
            : [{ kind: "text" as const, text: p.name, face: EDGE_LETTER_FACE, ink: "foreground" as const }]),
          { kind: "text", text: coords(p.x, p.y), face: readout.small, ink: "foregroundMuted" },
        ],
        EDGE_STYLE,
        p.ink,
      )
      // Clear of the chrome's plates and of the edge markers before it.
      const taken = [...opts.plates, ...[...edges.values()].map((e) => e.box)]
      const placed = moved(
        at(marker, edgeMarkerBox(off, { x: px, y: py }, marker.box, vp, taken)),
        alphaOf(p),
        0,
        0,
      )
      edges.set(p.id, placed)
      hits.push({ kind: "edge", id: p.id, box: placed.box, target: { x: p.x, y: p.y } })
    }
  }

  const handles = (scene.handles ?? [])
    .filter((h) => Number.isFinite(h.x) && Number.isFinite(h.y))
    .map((h) => ({ h, x: sx(h.x), y: sy(h.y) }))
  const inView = located.filter(({ off }) => off === null)
  const marks = inView.map(({ sx: px, sy: py }) => centred(px, py, MARK_BOX))

  // Where each point was, and the room its ring and arrow take. Off the
  // view there is nothing to mark: the owner's readout says how far it went.
  const was = new Map<string, WasMark>()
  for (const { p, sx: px, sy: py, off } of located) {
    if (p.was === undefined || !Number.isFinite(p.was.x) || !Number.isFinite(p.was.y)) {
      continue
    }
    const wx = sx(p.was.x)
    const wy = sy(p.was.y)
    if (edgeDirection(wx, wy, width, height) !== null) {
      continue
    }
    const dist = off === null ? Math.hypot(px - wx, py - wy) : 0
    const ux = dist === 0 ? 0 : (px - wx) / dist
    const uy = dist === 0 ? 0 : (py - wy) / dist
    was.set(p.id, {
      x: wx,
      y: wy,
      ink: p.ink,
      arrow:
        dist > WAS_ARROW_MIN
          ? {
              x1: wx + ux * WAS_START,
              y1: wy + uy * WAS_START,
              x2: px - ux * WAS_TIP,
              y2: py - uy * WAS_TIP,
              ink: p.was.ink,
            }
          : null,
    })
  }

  // Plates keep clear of the chrome, the tags, the edge markers, the handles,
  // the markers, where points were, and the plates placed before them.
  const chrome = opts.plates.map((r) => inflate(r, CHROME_CLEAR))
  const obstacles: Rect[] = [
    ...chrome,
    ...opts.corners.map((r) => inflate(r, CHROME_CLEAR)),
    ...tags.map((t) => t.box),
    ...[...edges.values()].map((e) => e.box),
    ...handles.map(({ h, x, y }) => centred(x, y, HANDLE_CLEAR[h.shape])),
    ...located.flatMap(({ p, sx: px, sy: py }) => {
      const w = was.get(p.id)
      return w === undefined ? [] : [between(w, w.arrow === null ? w : { x: px, y: py }, WAS_CLEAR)]
    }),
  ]

  // Annotation plates keep clear of every curve, a ghost too (fvDrawCanvas);
  // point labels only of the curves that ask.
  const allCurves: Polyline[] = scene.curves.flatMap((c) => curvePolylines(vp, c.fn))
  const avoided: Polyline[] = scene.curves
    .filter((c) => c.avoid === true)
    .flatMap((c) => curvePolylines(vp, c.fn))

  const axisTagKeepOut: Rect[] = []
  const annotationPlate = (spec: AnnotationPlate, a: PlaneAnnotation): Plate => {
    const faces = spec.size === "md" ? NOTE_FACES : DRAG_TAG_FACES
    const content = layoutPlate(
      spec.runs.map((run) => ({
        kind: "text" as const,
        text: run.text,
        face: run.italic === true ? faces.italic : faces.upright,
        ink: a.onInk,
      })),
      spec.size === "md" ? NOTE_STYLE : DRAG_TAG_STYLE,
      filled(a.ink),
      measure,
    )
    const size = content.box
    const place = spec.place
    let box: Rect
    switch (place.kind) {
      case "beside":
        box = placeBeside(sx(place.at.x), sy(place.at.y), size.w, size.h, {
          gap: PLATE_GAP,
          curves: allCurves,
          obstacles: [...obstacles, ...marks],
          width,
          height,
        })
        break
      case "above":
        box = placeAbove(sx(place.at.x), sy(place.at.y), size, place.gap, plane)
        break
      case "x-axis":
        box = besideXAxis(sx(place.x), originY, size, plane, { x: sx(place.clear.x), y: sy(place.clear.y) })
        axisTagKeepOut.push(box)
        break
      case "y-axis":
        box = besideYAxis(sy(place.y), originX, size, plane, { x: sx(place.clear.x), y: sy(place.clear.y) })
        axisTagKeepOut.push(box)
        break
    }
    obstacles.push(box)
    return at(content, box)
  }

  const annotations: AnnotationMarks[] = (scene.annotations ?? []).map((a) => ({
    layer: a.layer,
    ink: a.ink,
    strokes: a.lines.map(({ from, to, ...rest }) => ({
      x1: sx(from.x),
      y1: sy(from.y),
      x2: sx(to.x),
      y2: sy(to.y),
      ...rest,
    })),
    plates: a.plates.map((spec) => annotationPlate(spec, a)),
  }))

  // Labels keep clear of the same, and of every marker, or hold their place
  // and keep only off the chrome. Either way the labels after them keep clear.
  const layers: PointLayer[] = located.map(({ p, sx: px, sy: py, off }) => {
    let label: Plate | null = null
    if (off === null && p.name !== undefined) {
      const content = plate(
        [
          { kind: "text", text: p.name, face: LABEL_LETTER_FACE, ink: "foreground" },
          { kind: "text", text: coords(p.x, p.y), face: readout.label, ink: "foreground" },
        ],
        LABEL_STYLE,
        p.ink,
      )
      const { w, h } = content.box
      const box =
        p.labelPlace === "fixed"
          ? placeFixed(px, py, w, h, { gap: LABEL_GAP, chrome, width, height })
          : placeBeside(px, py, w, h, {
              gap: LABEL_GAP,
              curves: avoided,
              obstacles: [...obstacles, ...marks],
              width,
              height,
            })
      label = moved(at(content, box), alphaOf(p) * (p.labelAlpha ?? 1), 0, p.labelRise ?? 0)
      obstacles.push(box)
    }
    return {
      id: p.id,
      was: was.get(p.id) ?? null,
      marker:
        off === null
          ? { x: px, y: py, style: p.style, ink: p.ink, focus: p.focus === true, ...faded(alphaOf(p)) }
          : null,
      label,
      edge: edges.get(p.id) ?? null,
      edgeDir: edges.has(p.id) ? off : null,
    }
  })

  // The topmost mark takes the pointer: points over handles, the last painted first.
  for (const { p, sx: px, sy: py } of inView.toReversed()) {
    if (p.draggable === true) {
      hits.push({ kind: "point", id: p.id, box: centred(px, py, HIT_BOX) })
    }
  }
  for (const { h, x, y } of handles.toReversed()) {
    hits.push({ kind: "handle", id: h.id, box: centred(x, y, HANDLE_HIT) })
  }

  return {
    annotations,
    handles: handles.map(({ h, x, y }) => ({
      x,
      y,
      shape: h.shape,
      ink: h.ink,
      halo: h.halo === true,
      held: h.held === true,
      ...faded(h.alpha ?? 1),
    })),
    guides,
    dropLines,
    tags,
    points: layers,
    hits,
    tickKeepOut: [...tags.map((t) => t.box), ...axisTagKeepOut].map((r) => inflate(r, TAG_CLEAR)),
  }
}
