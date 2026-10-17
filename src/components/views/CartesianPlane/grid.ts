import { unscaledUnitSize } from "./constants"

// The Cartesian plane's grid in screen px, laid out from the camera: minor
// lines on the 1-2-5 step that keeps them at least minGridPx apart, major
// lines on the next step up. No Canvas here, so it tests without a context.

/** Minor grid lines stay at least this many px apart. */
const minGridPx = 20

/** Neighbouring x labels closer than this read as crowded. */
const minLabelGap = 12

export type GridSteps = {
  minor: number
  major: number
}

/** A grid line at plane value `unit`, drawn at screen x or y `px`. */
export type GridLine = {
  unit: number
  px: number
}

export type GridLayout = {
  steps: GridSteps
  pxPerUnit: number
  /** Vertical lines by screen x, horizontal lines by screen y. The axes are drawn apart, so 0 is left out. */
  minorX: GridLine[]
  majorX: GridLine[]
  minorY: GridLine[]
  majorY: GridLine[]
  /** Screen x of the y-axis (x = 0) and screen y of the x-axis (y = 0), null while off screen and past the margin. */
  xOrigin: number | null
  yOrigin: number | null
}

const eps = 1e-9

/** Rounds away float noise, so 3 × 0.2 reads as 0.6, not 0.6000000000000001. */
const clean = (v: number): number => Number(v.toPrecision(12))

/** Smallest 1, 2 or 5 × 10ⁿ at or above min. */
const step125 = (min: number): number => {
  const magnitude = 10 ** Math.floor(Math.log10(min))
  const m = min / magnitude
  const factor = m <= 1 + eps ? 1 : m <= 2 + eps ? 2 : m <= 5 + eps ? 5 : 10
  return clean(factor * magnitude)
}

/** Minor 0.5 and major 1 at the default 50 px per unit. */
const gridSteps = (pxPerUnit: number): GridSteps => {
  const minor = step125(minGridPx / pxPerUnit)
  // 1.5 minors rounds up to the next rung: 1 to 2, 2 to 5, 5 to 10.
  return { minor, major: step125(minor * 1.5) }
}

/**
 * Multiples of step from min to max. Past 2^53 n++ stops moving, so a URL
 * that pans that far gets no lines instead of a loop that never ends.
 */
const multiples = (min: number, max: number, step: number): number[] => {
  const out: number[] = []
  for (let n = Math.ceil(min / step - eps); Number.isSafeInteger(n) && n * step <= max + step * eps; n++) {
    out.push(clean(n * step))
  }
  return out
}

const onStep = (u: number, step: number): boolean => Math.abs(u / step - Math.round(u / step)) < 1e-6

const inRange = (v: number, lo: number, hi: number): number | null => (v >= lo && v <= hi ? v : null)

/**
 * The grid of a width by height canvas. Lines and axes up to margin px past
 * each edge are listed too, so a label beside a line just off screen still
 * shows.
 */
export const layoutGrid = (
  width: number,
  height: number,
  center: [number, number],
  scale: number,
  margin = 0,
): GridLayout => {
  const pxPerUnit = unscaledUnitSize / scale
  const steps = gridSteps(pxPerUnit)

  // center is the plane point at this canvas pixel, as in useCamera.
  const centerX = Math.floor(width / 2)
  const centerY = Math.floor(height / 2)
  const screenX = (u: number) => centerX + (u - center[0]) * pxPerUnit
  // Screen y grows downward, plane y upward.
  const screenY = (u: number) => centerY - (u - center[1]) * pxPerUnit

  const split = (units: number[], toPx: (u: number) => number) => {
    const minor: GridLine[] = []
    const major: GridLine[] = []
    for (const unit of units) {
      if (unit === 0) {
        continue
      }
      const line = { unit, px: toPx(unit) }
      if (onStep(unit, steps.major)) {
        major.push(line)
      } else {
        minor.push(line)
      }
    }
    return { minor, major }
  }

  const left = center[0] - (centerX + margin) / pxPerUnit
  const right = center[0] + (width - centerX + margin) / pxPerUnit
  const bottom = center[1] - (height - centerY + margin) / pxPerUnit
  const top = center[1] + (centerY + margin) / pxPerUnit
  const xs = split(multiples(left, right, steps.minor), screenX)
  const ys = split(multiples(bottom, top, steps.minor), screenY)

  return {
    steps,
    pxPerUnit,
    minorX: xs.minor,
    majorX: xs.major,
    minorY: ys.minor,
    majorY: ys.major,
    xOrigin: inRange(screenX(0), -margin, width + margin),
    yOrigin: inRange(screenY(0), -margin, height + margin),
  }
}

/**
 * The major lines that get an x label: all of them, or every other one once
 * the widest label of a line on the canvas leaves less than minLabelGap
 * before the next. Every other one means the multiples of twice the major
 * step, so the same labels stay as the plane pans. A label is String(unit),
 * and labelWidth measures it.
 */
export const xLabelLines = (
  grid: GridLayout,
  width: number,
  labelWidth: (text: string) => number,
): GridLine[] => {
  const spacing = grid.steps.major * grid.pxPerUnit
  // Lines past the edge are listed so their labels slide in, but a wide
  // label there isn't seen yet and mustn't thin the ones that are.
  const onCanvas = grid.majorX.filter((line) => line.px >= 0 && line.px <= width)
  const widest = Math.max(0, ...onCanvas.map((line) => labelWidth(String(line.unit))))
  if (widest + minLabelGap <= spacing) {
    return grid.majorX
  }
  return grid.majorX.filter((line) => onStep(line.unit, 2 * grid.steps.major))
}
