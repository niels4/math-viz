import { unscaledUnitSize } from "../constants"

const minGridPx = 20

const minLabelGap = 12

const labelGapX = 6
const labelGapY = 6
const labelEdgePad = 8

export type GridSteps = {
  minor: number
  major: number
}

export type GridLine = {
  unit: number
  px: number
}

export type GridLayout = {
  width: number
  height: number
  scale: number
  steps: GridSteps
  pxPerUnit: number
  minorX: GridLine[]
  majorX: GridLine[]
  minorY: GridLine[]
  majorY: GridLine[]
  xOrigin: number | null
  yOrigin: number | null
  origin: [number, number]
}

export type GridLabel = {
  axis: "x" | "y"
  text: string
  right: number
  top: number
}

const eps = 1e-9

const clean = (v: number): number => Number(v.toPrecision(12))

const step125 = (min: number): number => {
  const magnitude = 10 ** Math.floor(Math.log10(min))
  const m = min / magnitude
  const factor = m <= 1 + eps ? 1 : m <= 2 + eps ? 2 : m <= 5 + eps ? 5 : 10
  return clean(factor * magnitude)
}

const gridSteps = (pxPerUnit: number): GridSteps => {
  const minor = step125(minGridPx / pxPerUnit)
  return { minor, major: step125(minor * 1.5) }
}

const multiples = (min: number, max: number, step: number): number[] => {
  const out: number[] = []
  for (let n = Math.ceil(min / step - eps); Number.isSafeInteger(n) && n * step <= max + step * eps; n++) {
    out.push(clean(n * step))
  }
  return out
}

const onStep = (u: number, step: number): boolean => Math.abs(u / step - Math.round(u / step)) < 1e-6

const inRange = (v: number, lo: number, hi: number): number | null => (v >= lo && v <= hi ? v : null)

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))

export const layoutGrid = (
  width: number,
  height: number,
  center: [number, number],
  scale: number,
  margin = 0,
): GridLayout => {
  const pxPerUnit = unscaledUnitSize / scale
  const steps = gridSteps(pxPerUnit)

  const centerX = Math.floor(width / 2)
  const centerY = Math.floor(height / 2)
  const screenX = (u: number) => centerX + (u - center[0]) * pxPerUnit
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
    width,
    height,
    scale,
    steps,
    pxPerUnit,
    minorX: xs.minor,
    majorX: xs.major,
    minorY: ys.minor,
    majorY: ys.major,
    xOrigin: inRange(screenX(0), -margin, width + margin),
    yOrigin: inRange(screenY(0), -margin, height + margin),
    origin: [screenX(0), screenY(0)],
  }
}

export const xLabelLines = (grid: GridLayout, labelWidth: (text: string) => number): GridLine[] => {
  const spacing = grid.steps.major * grid.pxPerUnit
  const onCanvas = grid.majorX.filter((line) => line.px >= 0 && line.px <= grid.width)
  const widest = Math.max(0, ...onCanvas.map((line) => labelWidth(String(line.unit))))
  if (widest + minLabelGap <= spacing) {
    return grid.majorX
  }
  return grid.majorX.filter((line) => onStep(line.unit, 2 * grid.steps.major))
}

export const layoutLabels = (
  grid: GridLayout,
  labelHeight: number,
  labelWidth: (text: string) => number,
): GridLabel[] => {
  const { width, height } = grid
  const [originX, originY] = grid.origin

  const below = originY + labelGapY
  const above = originY - labelGapY - labelHeight
  const xTop = clamp(
    below + labelHeight <= height - labelEdgePad ? below : above,
    labelEdgePad,
    height - labelEdgePad - labelHeight,
  )
  const labels: GridLabel[] = xLabelLines(grid, labelWidth).map(({ unit, px }) => ({
    axis: "x",
    text: String(unit),
    right: px - labelGapX,
    top: xTop,
  }))
  if (grid.xOrigin !== null) {
    labels.push({ axis: "x", text: "0", right: grid.xOrigin - labelGapX, top: xTop })
  }

  const onCanvas = grid.majorY.filter((line) => line.px >= 0 && line.px <= height)
  const widest = Math.max(0, ...onCanvas.map((line) => labelWidth(String(line.unit))))
  const roomLeft = originX - labelGapX - widest >= labelEdgePad
  for (const { unit, px } of grid.majorY) {
    const text = String(unit)
    const top = px + labelGapY
    if (Math.abs(top - xTop) < labelHeight) {
      continue
    }
    const w = labelWidth(text)
    const right = roomLeft
      ? Math.min(originX - labelGapX, width - labelEdgePad)
      : clamp(originX + labelGapX, labelEdgePad, width - labelEdgePad - w) + w
    labels.push({ axis: "y", text, right, top })
  }
  return labels
}
