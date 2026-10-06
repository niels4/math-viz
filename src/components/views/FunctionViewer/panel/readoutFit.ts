import type { NumberParts } from "#src/util/format/number.ts"

// How wide a compact point readout (the dock's cards, R9) is at its full
// size, so that it can shrink to fit a narrow card instead of spilling out
// (PointReadout.module.css): "f(", ")" and the relation in STIX 26, the
// numbers in the readout face at 24, each run's box rounded up to whole px
// as Figma sizes them. The readout face is monospaced, 0.6 em a character.

/** Full sizes in px: the maths, the numbers, a raised exponent; the relation's padding each side. */
export const COMPACT_READOUT = { math: 26, number: 24, exponent: 15, relPad: 7 } as const

const MONO_EM = 0.6

const box = (em: number, size: number): number => Math.ceil(em * size)

/** The readout's width in px at the compact sizes, for x as printed and y's parts (null: no point). */
export const compactReadoutWidth = (x: string, y: NumberParts | null): number => {
  const { math, number, exponent, relPad } = COMPACT_READOUT
  const digits = (text: string) => box(text.length * MONO_EM, number)
  const yWidth =
    y === null
      ? digits("–")
      : y.kind === "sci"
        ? (y.mantissa.length + 3) * MONO_EM * number + y.exponent.length * MONO_EM * exponent
        : digits(y.text)
  return box(0.634, math) + digits(x) + box(0.343, math) + box(0.72, math) + 2 * relPad + yWidth
}
