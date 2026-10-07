// The calibration of an absolute track over a live range (ExtentSlider; the
// P scrubber, figma0 fvScrubber): a little copy of the x-axis. Ticks sit on
// a 0.5 / 1 lattice at the default zoom, majors longer and heavier, and
// labels on their own coarser lattice (every 2 units), so they always land
// on whole numbers. Each step comes from pixel spacing: ticks at least 4 px
// apart, labels at least 32, and steps grow 1-2-5 as the range widens.

import { formatTick } from "#src/util/format/number.ts"

/** Minimum spacing in px: ticks, labels. */
export const TICK_MIN_PX = 4
export const LABEL_MIN_PX = 32

/** The smallest step of each kind, in units. */
const TICK_FLOOR = 0.5
const MAJOR_FLOOR = 1
const LABEL_FLOOR = 2

/** Roboto Mono's advance at 12 px (0.6 em); Figma rounds a label's box up to whole px. */
export const LABEL_CHAR_PX = 7.2

/** Baseline at y 9 (2 px), ticks down from it: minor 4 px of 1 px, major 7 px of 1.5 px; labels' tops at 19. */
export const TRACK_HEIGHT = 36
export const BASELINE_Y = 9
export const TICK_LENGTH = { minor: 4, major: 7 } as const
export const LABEL_TOP = 19

export type ExtentMarks = {
  /** x in px from the track's left end. */
  minor: number[]
  major: number[]
  labels: { value: number; text: string; left: number }[]
}

/** The smallest 1-2-5 number of at least `min`, never below `floor`. */
export const niceStep = (min: number, floor: number): number => {
  if (min <= floor) {
    return floor
  }
  const decade = 10 ** Math.floor(Math.log10(min))
  const m = [1, 2, 5].find((f) => f * decade >= min) ?? 10
  return m * decade
}

const onLattice = (u: number, step: number): boolean => Math.abs(u / step - Math.round(u / step)) < 1e-6

export const extentMarks = (min: number, max: number, width: number): ExtentMarks | null => {
  const span = max - min
  if (!(span > 0) || !(width > 0) || !Number.isFinite(span)) {
    return null
  }
  const ppu = width / span
  const at = (u: number): number => (u - min) * ppu
  const tickStep = niceStep(TICK_MIN_PX / ppu, TICK_FLOOR)
  const majorStep = niceStep(tickStep * 1.99, MAJOR_FLOOR)
  const labelStep = niceStep(LABEL_MIN_PX / ppu, LABEL_FLOOR)

  // Past 2^53 a step can't be told from the next and n++ stops moving: a
  // range that far from 0 gets no marks.
  const minor: number[] = []
  const major: number[] = []
  for (let n = Math.ceil(min / tickStep); Number.isSafeInteger(n) && n * tickStep <= max; n++) {
    const u = n * tickStep
    const x = at(u)
    // Not on the track's ends, where the baseline's caps sit.
    if (x < 1 || x > width - 1) {
      continue
    }
    ;(onLattice(u, majorStep) ? major : minor).push(x)
  }

  const labels: ExtentMarks["labels"] = []
  for (let n = Math.ceil(min / labelStep); Number.isSafeInteger(n) && n * labelStep <= max; n++) {
    const value = n * labelStep
    const text = formatTick(value)
    const box = Math.ceil(text.length * LABEL_CHAR_PX)
    const left = Math.round(at(value) - box / 2)
    // Whole or not at all: a label never hangs past the track.
    if (left >= 0 && left + box <= width) {
      labels.push({ value, text, left })
    }
  }
  return { minor, major, labels }
}
