// Glyphs the shipped fonts lack (src/style/fonts/README.md › Symbols subsets),
// drawn instead. One path per glyph serves SVG icons (`d`) and canvas
// (`new Path2D(d)`), so the panel and the plane draw the same shape.

export type GlyphDirection = "up" | "down" | "left" | "right"

/** ▲ ▼ ◀ ▶ fill their box, as figma0 draws them: 10 × 10 on edge markers, 10 × 9 beside a caps label, 7 × 10 in a value tip. */
export const TRIANGLE_BOX = 10

/** A filled triangle across a `w` × `h` box, its point at the `dir` edge's middle. */
export const trianglePath = (
  dir: GlyphDirection,
  w: number = TRIANGLE_BOX,
  h: number = TRIANGLE_BOX,
): string => {
  switch (dir) {
    case "up":
      return `M${w / 2} 0L${w} ${h}H0Z`
    case "down":
      return `M0 0H${w}L${w / 2} ${h}Z`
    case "left":
      return `M${w} 0V${h}L0 ${h / 2}Z`
    case "right":
      return `M0 0L${w} ${h / 2}L0 ${h}Z`
  }
}

/** ← → ↑ ↓ as on the key caps (kbd-fv): in an 18 × 14 box, stroked 1.6 px with round caps and joins. */
export const ARROW_BOX = { width: 18, height: 14 } as const
export const ARROW_STROKE = 1.6
export const ARROW_PATHS: Record<GlyphDirection, string> = {
  left: "M9 2L3 7L9 12M3 7H15",
  right: "M9 2L15 7L9 12M15 7H3",
  up: "M4 8L9 2L14 8M9 2V14",
  down: "M4 8L9 14L14 8M9 14V2",
}
