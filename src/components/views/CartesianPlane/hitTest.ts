import type { MarksLayout, PlaneHit } from "./marks.ts"

import { contains } from "./rect.ts"

/** What the pointer at (px, py) in plane pixels would take: an edge marker or a draggable point, topmost first. */
export const hitTest = (marks: MarksLayout, px: number, py: number): PlaneHit | null =>
  marks.hits.find((hit) => contains(hit.box, px, py)) ?? null
