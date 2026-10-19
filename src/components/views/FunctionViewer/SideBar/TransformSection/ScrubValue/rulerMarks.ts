import { SCALE_PER_PX, SHIFT_PER_PX } from "./scrub.ts"

export type RulerMarks = {
  minor: number[]
  mid: number[]
  major: number[]
  labels: { x: number; text: string }[]
}

const TICK_GAP = 3.5
const LABEL_GAP = 38

const MINUS = "−"

type Tape = { at: (u: number) => number; lo: number; hi: number; pxPerUnit: number }

const shiftTape = (value: number, c: number): Tape => ({
  at: (u) => c + (u - value) / SHIFT_PER_PX,
  lo: value - c * SHIFT_PER_PX,
  hi: value + c * SHIFT_PER_PX,
  pxPerUnit: 1 / SHIFT_PER_PX,
})

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

const niceStep = (min: number) => {
  const decade = 10 ** Math.floor(Math.log10(min))
  return ([1, 2, 5].find((m) => m * decade >= min) ?? 10) * decade
}

const onLattice = (u: number, step: number) => Math.abs(u / step - Math.round(u / step)) < 1e-6

const multiples = (step: number, lo: number, hi: number) => {
  const ns: number[] = []
  for (let n = Math.ceil(lo / step); n * step <= hi && Number.isSafeInteger(n); n++) {
    ns.push(n)
  }
  return ns
}

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
