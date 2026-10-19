// The marks on the ruler a drag shows under its row, with the current value
// at the tape's centre. The tape draws at the drag's own rate, so its marks
// slide as far as the pointer moves, the other way. A shift's tape is even,
// 50 px per unit. A scale's is logarithmic, ×1.002 per px, so equal ratios
// lie equal distances apart, and it reads the scale's size. A fine drag
// moves the value a tenth as fast, so the marks then slide a tenth as far
// as the pointer.

import { SCALE_PER_PX, SHIFT_PER_PX } from "./scrub.ts"

// Positions are px from the tape's left edge.
export type RulerMarks = {
  // Ticks at every step and at every fifth step.
  minor: number[]
  mid: number[]
  // Ticks at the labelled values.
  major: number[]
  labels: { x: number; text: string }[]
}

// How close ticks and labels may come, in px, where the tape is densest.
const TICK_GAP = 3.5
const LABEL_GAP = 38

const MINUS = "−"

// Where the tape puts a value u, the lowest and highest values it reaches,
// and its px per unit at its densest.
type Tape = { at: (u: number) => number; lo: number; hi: number; pxPerUnit: number }

const shiftTape = (value: number, c: number): Tape => ({
  at: (u) => c + (u - value) / SHIFT_PER_PX,
  lo: value - c * SHIFT_PER_PX,
  hi: value + c * SHIFT_PER_PX,
  pxPerUnit: 1 / SHIFT_PER_PX,
})

// Values grow by a factor of e every pxPerE px, so a unit takes fewer px
// the larger the values, and the high end is densest.
const scaleTape = (value: number, c: number): Tape => {
  const size = Math.abs(value)
  const pxPerE = 1 / Math.log1p(SCALE_PER_PX)
  const hi = size * Math.exp(c / pxPerE)
  return {
    at: (u) => c + pxPerE * Math.log(u / size),
    lo: size * Math.exp(-c / pxPerE),
    hi,
    pxPerUnit: pxPerE / hi,
  }
}

// The smallest of 1, 2 or 5 times a power of 10 that is at least min.
const niceStep = (min: number) => {
  const decade = 10 ** Math.floor(Math.log10(min))
  return ([1, 2, 5].find((m) => m * decade >= min) ?? 10) * decade
}

const onLattice = (u: number, step: number) => Math.abs(u / step - Math.round(u / step)) < 1e-6

// Each multiple of step from lo to hi, as its count of steps. Past 2^53
// n++ stops counting, so a value that large gets no marks.
const multiples = (step: number, lo: number, hi: number) => {
  const ns: number[] = []
  for (let n = Math.ceil(lo / step); n * step <= hi && Number.isSafeInteger(n); n++) {
    ns.push(n)
  }
  return ns
}

// The marks for a tape `width` px wide with `value` at its centre.
export const rulerMarks = (value: number, width: number, isScale: boolean): RulerMarks => {
  const marks: RulerMarks = { minor: [], mid: [], major: [], labels: [] }
  const c = width / 2
  const tape = isScale ? scaleTape(value, c) : shiftTape(value, c)
  const step = niceStep(TICK_GAP / tape.pxPerUnit)
  const labelStep = niceStep(LABEL_GAP / tape.pxPerUnit)
  const decimals = Math.max(0, -Math.floor(Math.log10(labelStep)))
  const inside = (x: number) => x >= 0 && x <= width

  for (const n of multiples(step, tape.lo, tape.hi)) {
    const u = n * step
    const x = tape.at(u)
    if (inside(x) && !onLattice(u, labelStep)) {
      const ticks = n % 5 === 0 ? marks.mid : marks.minor
      ticks.push(x)
    }
  }
  for (const n of multiples(labelStep, tape.lo, tape.hi)) {
    const u = n * labelStep
    const x = tape.at(u)
    if (inside(x)) {
      marks.major.push(x)
      marks.labels.push({ x, text: String(Number(u.toFixed(decimals))).replace("-", MINUS) })
    }
  }
  return marks
}
