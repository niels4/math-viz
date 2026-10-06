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

/** The box grown by `by` px on every side. */
export const inflate = (r: Rect, by: number): Rect => ({
  x: r.x - by,
  y: r.y - by,
  w: r.w + 2 * by,
  h: r.h + 2 * by,
})

export const contains = (r: Rect, x: number, y: number): boolean =>
  x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h
