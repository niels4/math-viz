import type { GlyphDirection } from "#src/components/ui/glyphPaths.ts"

import { DURATION_MS, easeEnter, REDUCED_FADE_MS } from "#src/util/motion/motion.ts"

import type { MarksLayout } from "./marks.ts"
import type { Plate, PlateMotion } from "./plates.ts"

// The plane's own motion (FV 05 › P leaves the view): an edge marker slides
// in 8 px from its edge on the enter spring, 160 ms, as its point leaves the
// view, however it left (a pan, a zoom, the owner moving it). Only the plane
// knows when that happens. Under reduced motion it fades in, 120 ms, and
// doesn't slide. Paint-time: the marker's box, and its hit box, rest.

/** How far an edge marker slides in from. */
export const EDGE_SLIDE_PX = 8

/** When an edge marker appeared, and whether it arrives under reduced motion. */
export type EdgeArrival = { since: number; reduced: boolean }

const OUTWARD: Readonly<Record<GlyphDirection, { x: number; y: number }>> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

/** An edge marker `elapsed` ms into its arrival, or null once it rests. */
export const edgeArrival = (dir: GlyphDirection, elapsed: number, reduced: boolean): PlateMotion | null => {
  const duration = reduced ? REDUCED_FADE_MS : DURATION_MS.fast
  if (elapsed >= duration) {
    return null
  }
  const t = Math.max(0, elapsed / duration)
  if (reduced) {
    return { alpha: t, dx: 0, dy: 0 }
  }
  const e = easeEnter.ease(t)
  const off = EDGE_SLIDE_PX * (1 - e)
  return { alpha: Math.min(1, e), dx: OUTWARD[dir].x * off, dy: OUTWARD[dir].y * off }
}

/** One motion on top of another: opacities multiply, offsets add. */
const compose = (plate: Plate, motion: PlateMotion): Plate => {
  const under = plate.motion ?? { alpha: 1, dx: 0, dy: 0 }
  return {
    ...plate,
    motion: { alpha: under.alpha * motion.alpha, dx: under.dx + motion.dx, dy: under.dy + motion.dy },
  }
}

/**
 * The marks with each edge marker's arrival applied, and whether one is
 * still arriving (the plane paints again next frame). `arrivals` learns the
 * markers that just appeared, timed from `now`, and forgets the ones gone.
 */
export const arriveEdges = (
  marks: MarksLayout,
  arrivals: Map<string, EdgeArrival>,
  now: number,
  reduced: boolean,
): { marks: MarksLayout; arriving: boolean } => {
  const shown = new Set<string>()
  let arriving = false
  const points = marks.points.map((layer) => {
    if (layer.edge === null || layer.edgeDir === null) {
      return layer
    }
    shown.add(layer.id)
    let arrival = arrivals.get(layer.id)
    if (arrival === undefined) {
      arrival = { since: now, reduced }
      arrivals.set(layer.id, arrival)
    }
    const motion = edgeArrival(layer.edgeDir, now - arrival.since, arrival.reduced)
    if (motion === null) {
      return layer
    }
    arriving = true
    return { ...layer, edge: compose(layer.edge, motion) }
  })
  for (const id of arrivals.keys()) {
    if (!shown.has(id)) {
      arrivals.delete(id)
    }
  }
  return { marks: arriving ? { ...marks, points } : marks, arriving }
}
