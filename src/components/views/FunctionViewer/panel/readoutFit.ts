import { formatNumber } from "#src/util/format/number.ts"

import type { Extent } from "../../CartesianPlane/viewport.ts"

// How wide a point readout's numbers are. Each keeps a slot, in characters
// of the readout face, as wide as the widest value the plane's visible
// range prints, minus sign included, and sits right-aligned in it: with
// fixed decimals (the user's ruling), the decimal point holds still while
// the point slides anywhere in view, across 0 and across a digit.

/** Characters each readout number keeps. */
export type ReadoutSlots = { x: number; y: number }

const widest = (lo: number, hi: number): number => Math.max(formatNumber(lo).length, formatNumber(hi).length)

/** The slots for the plane's visible range; null before the plane's first layout. */
export const readoutSlots = (extent: Extent | null): ReadoutSlots | null =>
  extent === null ? null : { x: widest(extent.minX, extent.maxX), y: widest(extent.minY, extent.maxY) }
