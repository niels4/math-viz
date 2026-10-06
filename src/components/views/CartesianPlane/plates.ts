import type { GlyphDirection } from "#src/components/ui/glyphPaths.ts"

import type { CanvasFace } from "./faces.ts"
import type { Rect } from "./rect.ts"
import type { Ink } from "./scene.ts"

import { baselineBelowTop, textBoxHeight } from "./faces.ts"

// The plane's plates: a row of runs on a box (figma0 FV · Recommended ›
// Components). Outlined: card fill and a 2 px border in a point's ink
// (point-label-fv, axis-tag-fv, edge-marker-fv). Filled: an annotation's ink
// with no border (the k, h, a, b plates and tags). Sizes follow Figma's auto
// layout: the border counts in the layout, every text box is its advance
// rounded up to whole px, and runs centre their boxes on the row.

export type PlateRun =
  | { kind: "text"; text: string; face: CanvasFace; ink: Ink }
  /** A drawn ▲ ▼ ◀ ▶ (the fonts lack them): a 10 px triangle in a 12 px box. */
  | { kind: "triangle"; dir: GlyphDirection; ink: Ink }

/** A run in place, from the plate's top-left: text at its baseline, a triangle's box at its top. */
export type PlacedRun = PlateRun & { x: number; y: number }

/** A plate's paint: its fill, and the ink of its border, if it has one. */
export type PlateInk = { fill: Ink; border: Ink | null }

/** Card fill, a border in `ink`: a point's label, tag or edge marker. */
export const outlined = (ink: Ink): PlateInk => ({ fill: "card", border: ink })

/** Filled with `ink`, no border: an annotation's plate. */
export const filled = (ink: Ink): PlateInk => ({ fill: ink, border: null })

/** A plate mid-motion: painted at this opacity, this far from its box (layout and hits keep the box). */
export type PlateMotion = { alpha: number; dx: number; dy: number }

export type Plate = {
  box: Rect
  radius: number
  fill: Ink
  /** Inside the box, as Figma's INSIDE stroke. */
  border: { ink: Ink; width: number } | null
  runs: readonly PlacedRun[]
  motion?: PlateMotion
}

export type PlateStyle = {
  /** Top, right, bottom, left, inside the border. */
  pad: readonly [number, number, number, number]
  gap: number
  /** Corner radius, or a stadium's (half the height). */
  radius: number | "pill"
  /** The border's width, counted in the layout; 0 for a filled plate. */
  border: number
}

/** The outlined plates' border. */
const OUTLINE = 2
const TRIANGLE_BOX = 12
export const TRIANGLE_INSET = 1

/** point-label-fv: "P (2, 4)" beside the point. */
export const LABEL_STYLE: PlateStyle = { pad: [6, 12, 6, 12], gap: 6, radius: "pill", border: OUTLINE }
/** axis-tag-fv: a value on an axis. */
export const TAG_STYLE: PlateStyle = { pad: [2, 8, 2, 8], gap: 0, radius: 6, border: OUTLINE }
/** edge-marker-fv: "▲ P (−3, 10.56)" on the edge an off-view point lies past. */
export const EDGE_STYLE: PlateStyle = { pad: [6, 12, 6, 8], gap: 8, radius: "pill", border: OUTLINE }
/** An annotation's plate (fvDrawCanvas: "k = 1" beside its dimension line): maths 19. */
export const NOTE_STYLE: PlateStyle = { pad: [3, 9, 3, 9], gap: 6, radius: 6, border: 0 }
/** A tag while a handle drags (fvDrawCanvas: "h = 1.5" on an axis, "b = 2" beside the unit box): maths 17. */
export const DRAG_TAG_STYLE: PlateStyle = { pad: [2, 8, 2, 8], gap: 4, radius: 6, border: 0 }

export type Measure = (face: CanvasFace, text: string) => number

const runSize = (run: PlateRun, measure: Measure): { w: number; h: number } =>
  run.kind === "text"
    ? { w: Math.ceil(measure(run.face, run.text)), h: textBoxHeight(run.face) }
    : { w: TRIANGLE_BOX, h: TRIANGLE_BOX }

/** The plate's size and its runs in place; `at` puts it in the plane later. */
export const layoutPlate = (
  runs: readonly PlateRun[],
  style: PlateStyle,
  ink: PlateInk,
  measure: Measure,
): Plate => {
  const [top, right, bottom, left] = style.pad
  const edge = style.border
  const sizes = runs.map((run) => runSize(run, measure))
  const rowH = Math.max(0, ...sizes.map((s) => s.h))
  const placed: PlacedRun[] = []
  let x = edge + left
  runs.forEach((run, i) => {
    const size = sizes[i] ?? { w: 0, h: 0 }
    const boxTop = edge + top + (rowH - size.h) / 2
    placed.push({ ...run, x, y: run.kind === "text" ? boxTop + baselineBelowTop(run.face) : boxTop })
    x += size.w + style.gap
  })
  const w = x - (runs.length > 0 ? style.gap : 0) + right + edge
  const h = 2 * edge + top + bottom + rowH
  return {
    box: { x: 0, y: 0, w, h },
    radius: style.radius === "pill" ? h / 2 : style.radius,
    fill: ink.fill,
    border: ink.border === null || edge === 0 ? null : { ink: ink.border, width: edge },
    runs: placed,
  }
}

/** The same plate moved to `box`'s position. */
export const at = (plate: Plate, box: Pick<Rect, "x" | "y">): Plate => ({
  ...plate,
  box: { ...plate.box, x: box.x, y: box.y },
})
