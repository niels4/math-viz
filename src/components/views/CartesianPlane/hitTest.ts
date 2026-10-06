import type { MarksLayout, PlaneHit } from "./marks.ts"

import { contains } from "./rect.ts"

/** What the pointer at (px, py) in plane pixels would take: an edge marker, a draggable point or a handle, topmost first. */
export const hitTest = (marks: MarksLayout, px: number, py: number): PlaneHit | null =>
  marks.hits.find((hit) => contains(hit.box, px, py)) ?? null
