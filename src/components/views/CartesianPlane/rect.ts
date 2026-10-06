/** A box in the plane's CSS pixels. */
export type Rect = {
  x: number
  y: number
  w: number
  h: number
}

export const intersects = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

export const insideBox = (r: Rect, width: number, height: number): boolean =>
  r.x >= 0 && r.y >= 0 && r.x + r.w <= width && r.y + r.h <= height
