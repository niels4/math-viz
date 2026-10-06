// Glyphs the shipped fonts lack (src/style/fonts/README.md › Symbols subsets),
// drawn instead. One path per glyph serves SVG icons (`d`) and canvas
// (`new Path2D(d)`), so the panel and the plane draw the same shape.

export type GlyphDirection = "up" | "down" | "left" | "right"

/** ▲ ▼ in a 10 × 10 box: equilateral, filled. */
export const TRIANGLE_BOX = 10
export const TRIANGLE_PATHS: Record<"up" | "down", string> = {
  up: "M5 0.67L10 9.33H0Z",
  down: "M0 0.67H10L5 9.33Z",
}

/** ← → ↑ ↓ in a 12 × 12 box: a shaft and an open head, stroked 1.5 px with round caps. */
export const ARROW_BOX = 12
export const ARROW_PATHS: Record<GlyphDirection, string> = {
  left: "M11 6H1M5.5 1.5L1 6L5.5 10.5",
  right: "M1 6H11M6.5 1.5L11 6L6.5 10.5",
  up: "M6 11V1M1.5 5.5L6 1L10.5 5.5",
  down: "M6 1V11M1.5 6.5L6 11L10.5 6.5",
}
