import { formatNumber, type NumberParts } from "#src/util/format/number.ts"

import type { Extent } from "../../CartesianPlane/viewport.ts"

// How wide a point readout's parts are. Each number keeps a slot, in
// characters of the readout face, as wide as the widest value the plane's
// visible range prints, minus sign included, and sits right-aligned in it:
// with fixed decimals (the user's ruling), the decimal point holds still
// while the point slides anywhere in view, across 0 and across a digit. A
// compact readout (the dock's cards, R9) shrinks to fit a narrow card
// instead of spilling out (PointReadout.module.css): "f(", ")" and the
// relation in STIX 26, the numbers in the readout face at 24, each run's box
// rounded up to whole px as Figma sizes them. The readout face is
// monospaced, 0.6 em a character.

/** Characters each readout number keeps. */
export type ReadoutSlots = { x: number; y: number }

const widest = (lo: number, hi: number): number => Math.max(formatNumber(lo).length, formatNumber(hi).length)

/** The slots for the plane's visible range; null before the plane's first layout. */
export const readoutSlots = (extent: Extent | null): ReadoutSlots | null =>
  extent === null ? null : { x: widest(extent.minX, extent.maxX), y: widest(extent.minY, extent.maxY) }

/** Full sizes in px: the maths, the numbers, a raised exponent; the relation's padding each side. */
export const COMPACT_READOUT = { math: 26, number: 24, exponent: 15, relPad: 7 } as const

const MONO_EM = 0.6

const box = (em: number, size: number): number => Math.ceil(em * size)

/**
 * The readout's width in px at the compact sizes: x and y in their slots
 * (characters), and y's parts for a scientific y (null: no point).
 */
export const compactReadoutWidth = (xChars: number, y: NumberParts | null, yChars: number): number => {
  const { math, number, exponent, relPad } = COMPACT_READOUT
  const digits = (chars: number) => box(chars * MONO_EM, number)
  const yWidth =
    y?.kind === "sci"
      ? (y.mantissa.length + 3) * MONO_EM * number + y.exponent.length * MONO_EM * exponent
      : digits(yChars)
  return box(0.634, math) + digits(xChars) + box(0.343, math) + box(0.72, math) + 2 * relPad + yWidth
}
