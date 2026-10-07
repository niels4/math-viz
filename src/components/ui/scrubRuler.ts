// The jog ruler's marks (port of figma0's fvRulerMarks and fvTape,
// prelude-fv.js): the tape slides under a fixed index at the centre, so the
// value under the index is the current one. Shifts get a linear ruler at
// 50 px per unit; scales a log ruler at 1.002 per px, so equal ratios are
// equal distances and the ruler reads a scale's size. Both rates are the
// drag's own (scrub.ts), so the tape tracks the pointer exactly.

import { formatMark } from "#src/util/format/number.ts"

import { niceStep } from "./extentTicks.ts"
import { SCRUB_STEP, type ScrubKind } from "./scrub.ts"

/** The tape's height (FV_TAPE_H). */
export const RULER_HEIGHT = 32

/** Tick lengths from the top edge: tenths, halves, labelled. */
export const TICK_LENGTH = { minor: 5, mid: 8, major: 11 } as const

/** Labels: Roboto Mono 12, monospaced, so a label's width is its length × 0.6 em. */
export const LABEL_CHAR_PX = 12 * 0.6
/** The labels' top, from the tape's top edge. */
export const LABEL_TOP = 14
/** No label within this of the index… */
const LABEL_CLEAR_INDEX = 16
/** …or of either end, where the chevrons sit. */
const LABEL_CLEAR_END = 20
/** A label keeps this far from the one before: long ones at huge sizes would touch. */
const LABEL_GAP = 6

export type RulerLabel = {
  /** Where the label's value sits on the tape. */
  x: number
  /** The label's left edge, whole px, centred on x as Figma places it. */
  left: number
  text: string
}

export type RulerMarks = {
  minor: number[]
  mid: number[]
  /** Ticks on the label lattice, labelled or not. */
  major: number[]
  labels: RulerLabel[]
  /** The default's notch (0 or 1), where double-click returns; null when it is off the tape or under the index. */
  home: number | null
}

// The smallest step in the list that is at least `min`, and past its end
// the 1-2-5 steps beyond it: a step that stopped growing would put a typed
// 10⁶ hundreds of thousands of ticks on the tape.
const nice = (min: number, list: readonly number[]): number =>
  list.find((v) => v >= min) ?? niceStep(min, list.at(-1) ?? min)

const onLattice = (u: number, q: number): boolean => Math.abs(u / q - Math.round(u / q)) < 1e-6

/** Figma rounds an auto-width text box up to whole px. */
const labelWidth = (text: string): number => Math.ceil(text.length * LABEL_CHAR_PX)

/**
 * Ticks, labels and the home notch for a tape `width` px wide showing
 * `value` under its centre. Positions are px from the tape's left edge.
 */
export const rulerMarks = (kind: ScrubKind, value: number, width: number): RulerMarks => {
  const c = width / 2
  const marks: RulerMarks = { minor: [], mid: [], major: [], labels: [], home: null }
  const inside = (x: number) => x >= 1 && x <= width - 1
  // Labels come left to right.
  const label = (x: number, u: number) => {
    const text = formatMark(u)
    const w = labelWidth(text)
    const left = Math.round(x - w / 2)
    const before = marks.labels.at(-1)
    if (
      left >= LABEL_CLEAR_END &&
      left + w <= width - LABEL_CLEAR_END &&
      Math.abs(x - c) >= LABEL_CLEAR_INDEX &&
      (before === undefined || left >= before.left + labelWidth(before.text) + LABEL_GAP)
    ) {
      marks.labels.push({ x, left, text })
    }
  }

  if (kind === "additive") {
    const ppu = 1 / SCRUB_STEP.additive
    // Past 2^53 a tenth can't be told from the next, and n++ stops moving:
    // a shift that large has no tenths to mark.
    for (
      let n = Math.ceil((value - c / ppu) * 10);
      Number.isSafeInteger(n) && n <= Math.floor((value + c / ppu) * 10);
      n++
    ) {
      const u = n / 10
      const x = c + (u - value) * ppu
      if (!inside(x)) {
        continue
      }
      if (n % 10 === 0) {
        marks.major.push(x)
        label(x, u)
      } else if (n % 5 === 0) {
        marks.mid.push(x)
      } else {
        marks.minor.push(x)
      }
      if (n === 0 && Math.abs(x - c) > 2) {
        marks.home = x
      }
    }
    return marks
  }

  // Log ruler: ticks no closer than ~3.5 px at the dense end, labels ≥ 38 px apart.
  const size = Math.abs(value)
  if (!(size > 0) || !Number.isFinite(size)) {
    return marks
  }
  const k = 1 / Math.log(1 + SCRUB_STEP.multiplicative)
  const lo = size * Math.exp(-c / k)
  const hi = size * Math.exp(c / k)
  if (!Number.isFinite(hi)) {
    return marks
  }
  const step = nice((3.5 * hi) / k, [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1])
  const mid = nice(step * 4.9, [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 5])
  const lab = nice((38 * hi) / k, [0.01, 0.02, 0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 5, 10])
  const at = (u: number) => c + k * Math.log(u / size)
  for (let n = Math.ceil(lo / step); n * step <= hi + 1e-9; n++) {
    const u = Math.round(n * step * 1e6) / 1e6
    const x = at(u)
    // Ticks on the label lattice are drawn as labelled ones below.
    if (u <= 0 || onLattice(u, lab) || !inside(x)) {
      continue
    }
    const ticks = onLattice(u, mid) ? marks.mid : marks.minor
    ticks.push(x)
  }
  // Labels on their own lattice: 0.25 never lands on a 0.02 tick grid.
  for (let n = Math.ceil(lo / lab); n * lab <= hi + 1e-9; n++) {
    const u = Math.round(n * lab * 1e6) / 1e6
    const x = at(u)
    if (u <= 0 || !inside(x)) {
      continue
    }
    marks.major.push(x)
    label(x, u)
  }
  if (lo <= 1 && hi >= 1 && Math.abs(at(1) - c) > 2) {
    marks.home = at(1)
  }
  return marks
}
