import { formatNumber, formatShort } from "#src/util/format/number.ts"

import type { ReadoutFaces } from "./faces.ts"
import type { Polyline } from "./placement.ts"
import type { Measure, Plate, PlateRun, PlateStyle } from "./plates.ts"
import type { Rect } from "./rect.ts"
import type { Ink, PlaneScene, PointStyle } from "./scene.ts"
import type { Viewport } from "./viewport.ts"

import { EDGE_LETTER_FACE, LABEL_LETTER_FACE } from "./faces.ts"
import { curvePolylines, edgeDirection, edgeMarkerBox, placeBeside, xTagBox, yTagBox } from "./placement.ts"
import { at, EDGE_STYLE, LABEL_STYLE, layoutPlate, TAG_STYLE } from "./plates.ts"
import { inflate } from "./rect.ts"
import { toScreenX, toScreenY } from "./viewport.ts"

// Everything the plane draws for its points, laid out in plane pixels before
// anything paints (figma0 fvDrawCanvas): the pointer guides, drop lines and
// axis tags, edge markers for points off the view, the markers, and labels
// placed clear of the curve, the chrome, the tags and each other. The boxes
// that take the pointer come out of the same pass.

export type DropLine = { ink: Ink; x1: number; y1: number; x2: number; y2: number }

export type Marker = { x: number; y: number; style: PointStyle; ink: Ink; focus: boolean }

/** One point's layer, painted in scene order: its edge marker or its marker, then its label. */
export type PointLayer = { id: string; marker: Marker | null; label: Plate | null; edge: Plate | null }

export type PlaneHit =
  /** A draggable point's 48 px box. */
  | { kind: "point"; id: string; box: Rect }
  /** An edge marker: a click pans its point into view. */
  | { kind: "edge"; id: string; box: Rect; target: { x: number; y: number } }

export type MarksLayout = {
  /** Screen x of each pointer guide. */
  guides: readonly number[]
  dropLines: readonly DropLine[]
  tags: readonly Plate[]
  points: readonly PointLayer[]
  /** Topmost first. */
  hits: readonly PlaneHit[]
  /** Tick labels under a tag are skipped (the tag carries that number): the tags, 4 px larger. */
  tickKeepOut: readonly Rect[]
}

export const NO_MARKS: MarksLayout = {
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
/** Labels keep clear of every marker's 28 px box. */
const MARK_BOX = 28
/** Point labels sit 22, 48 or 82 px from their point. */
const LABEL_GAP = 22
/** Labels keep this far from the chrome. */
const CHROME_CLEAR = 8
/** Tick labels this close to a tag are skipped. */
const TAG_CLEAR = 4

const coords = (x: number, y: number): string => `(${formatNumber(x)}, ${formatShort(y)})`

const centred = (x: number, y: number, size: number): Rect => ({
  x: x - size / 2,
  y: y - size / 2,
  w: size,
  h: size,
})

const within = (v: number, lo: number, hi: number): boolean => v >= lo && v <= hi

export const layoutMarks = (scene: PlaneScene, vp: Viewport, opts: MarksOptions): MarksLayout => {
  const { width, height, originX, originY } = vp
  if (width === 0 || height === 0) {
    return NO_MARKS
  }
  const { measure, readout } = opts
  const plate = (runs: readonly PlateRun[], style: PlateStyle, ink: Ink) =>
    layoutPlate(runs, style, ink, measure)
  const tagPlate = (text: string, ink: Ink) =>
    plate([{ kind: "text", text, face: readout.small, ink: "foreground" }], TAG_STYLE, ink)

  // Each point on screen, and the edge it lies past (null in view).
  const located = scene.points
    .filter((p) => Number.isFinite(p.x) && !Number.isNaN(p.y))
    .map((p) => {
      const sx = toScreenX(vp, p.x)
      const sy = toScreenY(vp, p.y)
      return { p, sx, sy, off: edgeDirection(sx, sy, width, height) }
    })

  const guides = scene.guides.map((g) => toScreenX(vp, g.x)).filter((x) => within(x, 0, width))
  const dropLines: DropLine[] = []
  const tags: Plate[] = []
  const edges = new Map<string, Plate>()
  const hits: PlaneHit[] = []

  for (const { p, sx, sy, off } of located) {
    const xIn = within(sx, 0, width)
    const yIn = within(sy, 0, height)
    if (p.axisTags === true) {
      // In view: drop lines to both axes, a tag on each. Off the view one way,
      // only the axis it still crosses: the line comes in from the edge.
      if (xIn) {
        dropLines.push({ ink: p.ink, x1: sx, y1: yIn ? sy : sy < 0 ? 0 : height, x2: sx, y2: originY })
        const tag = tagPlate(formatNumber(p.x), p.ink)
        tags.push(at(tag, xTagBox(sx, sy, originY, tag.box, height)))
      }
      if (yIn) {
        dropLines.push({ ink: p.ink, x1: xIn ? sx : sx < 0 ? 0 : width, y1: sy, x2: originX, y2: sy })
        const tag = tagPlate(formatShort(p.y), p.ink)
        tags.push(at(tag, yTagBox(sx, sy, originX, tag.box, width)))
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
      const placed = at(marker, edgeMarkerBox(off, { x: sx, y: sy }, marker.box, vp, taken))
      edges.set(p.id, placed)
      hits.push({ kind: "edge", id: p.id, box: placed.box, target: { x: p.x, y: p.y } })
    }
  }

  // Labels keep clear of the curves that ask for it, the chrome, the tags,
  // the edge markers, every marker, and the labels placed before them.
  const curves: Polyline[] = scene.curves
    .filter((c) => c.avoid === true)
    .flatMap((c) => curvePolylines(vp, c.fn))
  const obstacles: Rect[] = [
    ...[...opts.plates, ...opts.corners].map((r) => inflate(r, CHROME_CLEAR)),
    ...tags.map((t) => t.box),
    ...[...edges.values()].map((e) => e.box),
  ]
  const inView = located.filter(({ off }) => off === null)
  const marks = inView.map(({ sx, sy }) => centred(sx, sy, MARK_BOX))

  const layers: PointLayer[] = located.map(({ p, sx, sy, off }) => {
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
      const box = placeBeside(sx, sy, content.box.w, content.box.h, {
        gap: LABEL_GAP,
        curves,
        obstacles: [...obstacles, ...marks],
        width,
        height,
      })
      label = at(content, box)
      obstacles.push(box)
    }
    return {
      id: p.id,
      marker: off === null ? { x: sx, y: sy, style: p.style, ink: p.ink, focus: p.focus === true } : null,
      label,
      edge: edges.get(p.id) ?? null,
    }
  })

  // The topmost point takes the pointer: the last painted first.
  for (const { p, sx, sy } of inView.toReversed()) {
    if (p.draggable === true) {
      hits.push({ kind: "point", id: p.id, box: centred(sx, sy, HIT_BOX) })
    }
  }

  return {
    guides,
    dropLines,
    tags,
    points: layers,
    hits,
    tickKeepOut: tags.map((t) => inflate(t.box, TAG_CLEAR)),
  }
}
