import { formatShort } from "#src/util/format/number.ts"

import type { Rect } from "./rect.ts"
import type { Viewport } from "./viewport.ts"

import { lineBox, ORIGIN_FACE, TICK_LABEL_FACE } from "./faces.ts"
import { insideBox, intersects } from "./rect.ts"
import { toScreenX, toScreenY, visibleExtent } from "./viewport.ts"

// The plane's grid as figma0's drawPlane draws it (prelude-v2): minor lines on
// the 1-2-5 step at least 20 px apart (the plane's gridStep before v2), majors
// on the next 1-2-5 step, ticks and labels on the majors, the origin as an
// italic O. Pure: the painter draws what this lays out.

/** Minor lines stay at least this far apart. */
export const MIN_GRID_PX = 20

/** Ticks cross the axis by this much each side. */
export const TICK_HALF = 5

/** x labels' tops sit this far below the x-axis. */
const LABEL_GAP_X = 9
/** y labels' right edges sit this far left of the y-axis. */
const LABEL_GAP_Y = 10
/** x label centres keep this far from the left and right edges. */
const LABEL_EDGE_X = 16
/** y label centres keep this far from the top and bottom edges. */
const LABEL_EDGE_Y = 14
/** O's right edge sits this far left of the y-axis, its top this far below the x-axis. */
const ORIGIN_GAP_X = 8
const ORIGIN_GAP_Y = 5
/** With its axis out of view, a label row or column stays this far inside the nearest edge. */
const EDGE_PAD = 8

const EPS = 1e-9

export type GridSteps = {
  minor: number
  major: number
}

export type GridLabel = {
  axis: "x" | "y"
  text: string
  box: Rect
}

/** A grid's lines in screen px: the axes are drawn apart, so no line sits on one. */
export type GridLines = {
  /** Screen x of the vertical lines, screen y of the horizontal ones. */
  minorX: number[]
  majorX: number[]
  minorY: number[]
  majorY: number[]
  /** Screen y of the x-axis and screen x of the y-axis, while in view. */
  axisX: number | null
  axisY: number | null
}

export type GridLayout = GridLines & {
  steps: GridSteps
  /** Tick positions along each axis (the majors). */
  ticksX: number[]
  ticksY: number[]
  labels: GridLabel[]
  /** The O's box, while the origin is in view. */
  origin: Rect | null
}

const clean = (v: number): number => Number(v.toPrecision(12))

/** The smallest 1, 2 or 5 × 10ⁿ at or above `min`. */
const step125 = (min: number): number => {
  const magnitude = 10 ** Math.floor(Math.log10(min))
  const m = min / magnitude
  const factor = m <= 1 + EPS ? 1 : m <= 2 + EPS ? 2 : m <= 5 + EPS ? 5 : 10
  return clean(factor * magnitude)
}

/** 0.5 and 1 at 50 px per unit; 10 and 20 at 2 px per unit (FV 10 X2). */
export const gridSteps = (zoom: number): GridSteps => {
  const minor = step125(MIN_GRID_PX / zoom)
  return { minor, major: step125(minor * 1.5) }
}

/** Multiples of `step` in [min, max]. */
const multiples = (min: number, max: number, step: number): number[] => {
  const out: number[] = []
  for (let n = Math.ceil(min / step - EPS); n * step <= max + step * EPS; n++) {
    out.push(clean(n * step))
  }
  return out
}

const onStep = (u: number, step: number): boolean => Math.abs(u / step - Math.round(u / step)) < 1e-6

const between = (v: number, lo: number, hi: number): boolean => v >= lo && v <= hi

export type GridOptions = {
  /** Width of a tick label in TICK_LABEL_FACE. */
  labelWidth: (text: string) => number
  /** Width of the O in ORIGIN_FACE. */
  originWidth: number
  /** Boxes labels must stay out of: chrome now, point tags later. */
  keepOut?: readonly Rect[]
}

/** The grid's values in view, in math units: every minor step but 0, and the majors among them. */
const lattice = (vp: Viewport, steps: GridSteps) => {
  const extent = visibleExtent(vp)
  const xs = multiples(extent.minX, extent.maxX, steps.minor).filter((u) => u !== 0)
  const ys = multiples(extent.minY, extent.maxY, steps.minor).filter((u) => u !== 0)
  return {
    xs,
    ys,
    majorXs: xs.filter((u) => onStep(u, steps.major)),
    majorYs: ys.filter((u) => onStep(u, steps.major)),
  }
}

/** The lines of a grid on the given steps: the plane's, or a mini plot's fixed ones (1 and 5 u). */
export const gridLines = (vp: Viewport, steps: GridSteps): GridLines => {
  const { xs, ys } = lattice(vp, steps)
  const minor = (u: number) => !onStep(u, steps.major)
  const major = (u: number) => onStep(u, steps.major)
  return {
    minorX: xs.filter(minor).map((u) => toScreenX(vp, u)),
    majorX: xs.filter(major).map((u) => toScreenX(vp, u)),
    minorY: ys.filter(minor).map((u) => toScreenY(vp, u)),
    majorY: ys.filter(major).map((u) => toScreenY(vp, u)),
    axisX: between(vp.originY, 0, vp.height) ? vp.originY : null,
    axisY: between(vp.originX, 0, vp.width) ? vp.originX : null,
  }
}

export const layoutGrid = (
  vp: Viewport,
  { labelWidth, originWidth, keepOut = [] }: GridOptions,
): GridLayout => {
  const { width, height, originX, originY } = vp
  const steps = gridSteps(vp.zoom)
  const { majorXs, majorYs } = lattice(vp, steps)
  const lines = gridLines(vp, steps)
  const { axisX, axisY } = lines
  const clear = (box: Rect) => !keepOut.some((r) => intersects(box, r))

  // x labels: below the x-axis, above it when there is no room below, and
  // along the nearest edge while the axis is out of view.
  const boxH = lineBox(TICK_LABEL_FACE)
  const below = originY + LABEL_GAP_X
  const top =
    originY < 0
      ? EDGE_PAD
      : originY > height
        ? height - EDGE_PAD - boxH
        : below + boxH <= height - EDGE_PAD
          ? below
          : originY - LABEL_GAP_X - boxH
  const xLabels: GridLabel[] = []
  for (const u of majorXs) {
    const cx = toScreenX(vp, u)
    if (!between(cx, LABEL_EDGE_X, width - LABEL_EDGE_X)) {
      continue
    }
    const text = formatShort(u)
    const w = labelWidth(text)
    const label: GridLabel = { axis: "x", text, box: { x: cx - w / 2, y: top, w, h: boxH } }
    if (clear(label.box)) {
      xLabels.push(label)
    }
  }

  // y labels: right-aligned left of the y-axis, left-aligned right of it when
  // there is no room, and along the nearest edge while the axis is out of view.
  const yTexts = majorYs
    .filter((u) => between(toScreenY(vp, u), LABEL_EDGE_Y, height - LABEL_EDGE_Y))
    .map((u) => ({ u, text: formatShort(u) }))
  const widths = yTexts.map(({ text }) => labelWidth(text))
  const widest = Math.max(0, ...widths)
  const leftAligned = originX < 0 || (originX <= width && originX - LABEL_GAP_Y - widest < EDGE_PAD)
  const anchor =
    originX < 0
      ? EDGE_PAD
      : originX > width
        ? width - EDGE_PAD
        : originX + (leftAligned ? LABEL_GAP_Y : -LABEL_GAP_Y)
  const yLabels: GridLabel[] = []
  yTexts.forEach(({ u, text }, i) => {
    const w = widths[i] ?? 0
    const box = { x: leftAligned ? anchor : anchor - w, y: toScreenY(vp, u) - boxH / 2, w, h: boxH }
    if (clear(box) && !xLabels.some((l) => intersects(l.box, box))) {
      yLabels.push({ axis: "y", text, box })
    }
  })

  let origin: Rect | null = null
  if (axisX !== null && axisY !== null) {
    const box = {
      x: originX - ORIGIN_GAP_X - originWidth,
      y: originY + ORIGIN_GAP_Y,
      w: originWidth,
      h: lineBox(ORIGIN_FACE),
    }
    origin = insideBox(box, width, height) && clear(box) ? box : null
  }

  return {
    ...lines,
    steps,
    ticksX: axisX === null ? [] : majorXs.map((u) => toScreenX(vp, u)),
    ticksY: axisY === null ? [] : majorYs.map((u) => toScreenY(vp, u)),
    labels: [...xLabels, ...yLabels],
    origin,
  }
}
