import type { GlyphDirection } from "#src/components/ui/glyphPaths.ts"

import type { CanvasFace } from "./faces.ts"
import type { Rect } from "./rect.ts"
import type { Ink } from "./scene.ts"

import { baselineBelowTop, textBoxHeight } from "./faces.ts"

// The plane's plates: a card-filled box with a 2 px border in the point's ink
// and a row of runs (figma0 FV · Recommended › Components: point-label-fv,
// axis-tag-fv, edge-marker-fv). Sizes follow Figma's auto layout: the border
// counts in the layout, every text box is its advance rounded up to whole
// px, and runs centre their boxes on the row.

export type PlateRun =
  | { kind: "text"; text: string; face: CanvasFace; ink: Ink }
  /** A drawn ▲ ▼ ◀ ▶ (the fonts lack them): a 10 px triangle in a 12 px box. */
  | { kind: "triangle"; dir: GlyphDirection; ink: Ink }

/** A run in place, from the plate's top-left: text at its baseline, a triangle's box at its top. */
export type PlacedRun = PlateRun & { x: number; y: number }

export type Plate = {
  box: Rect
  radius: number
  border: Ink
  runs: readonly PlacedRun[]
}

export type PlateStyle = {
  /** Top, right, bottom, left, inside the border. */
  pad: readonly [number, number, number, number]
  gap: number
  /** Corner radius, or a stadium's (half the height). */
  radius: number | "pill"
}

export const PLATE_BORDER = 2
const TRIANGLE_BOX = 12
export const TRIANGLE_INSET = 1

/** point-label-fv: "P (2, 4)" beside the point. */
export const LABEL_STYLE: PlateStyle = { pad: [6, 12, 6, 12], gap: 6, radius: "pill" }
/** axis-tag-fv: a value on an axis. */
export const TAG_STYLE: PlateStyle = { pad: [2, 8, 2, 8], gap: 0, radius: 6 }
/** edge-marker-fv: "▲ P (−3, 10.56)" on the edge an off-view point lies past. */
export const EDGE_STYLE: PlateStyle = { pad: [6, 12, 6, 8], gap: 8, radius: "pill" }

export type Measure = (face: CanvasFace, text: string) => number

const runSize = (run: PlateRun, measure: Measure): { w: number; h: number } =>
  run.kind === "text"
    ? { w: Math.ceil(measure(run.face, run.text)), h: textBoxHeight(run.face) }
    : { w: TRIANGLE_BOX, h: TRIANGLE_BOX }

/** The plate's size and its runs in place; `at` puts it in the plane later. */
export const layoutPlate = (
  runs: readonly PlateRun[],
  style: PlateStyle,
  border: Ink,
  measure: Measure,
): Plate => {
  const [top, right, bottom, left] = style.pad
  const sizes = runs.map((run) => runSize(run, measure))
  const rowH = Math.max(0, ...sizes.map((s) => s.h))
  const placed: PlacedRun[] = []
  let x = PLATE_BORDER + left
  runs.forEach((run, i) => {
    const size = sizes[i] ?? { w: 0, h: 0 }
    const boxTop = PLATE_BORDER + top + (rowH - size.h) / 2
    placed.push({ ...run, x, y: run.kind === "text" ? boxTop + baselineBelowTop(run.face) : boxTop })
    x += size.w + style.gap
  })
  const w = x - (runs.length > 0 ? style.gap : 0) + right + PLATE_BORDER
  const h = 2 * PLATE_BORDER + top + bottom + rowH
  return {
    box: { x: 0, y: 0, w, h },
    radius: style.radius === "pill" ? h / 2 : style.radius,
    border,
    runs: placed,
  }
}

/** The same plate moved to `box`'s position. */
export const at = (plate: Plate, box: Pick<Rect, "x" | "y">): Plate => ({
  ...plate,
  box: { ...plate.box, x: box.x, y: box.y },
})
