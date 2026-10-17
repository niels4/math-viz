import { queryParamAtom } from "#src/components/router/queryParamAtom.ts"

export const centerParam = queryParamAtom<[number, number]>("center", {
  parse: (raw) => {
    if (raw == null) {
      return undefined
    }
    const parts = raw.split(",")
    if (parts.length !== 2) {
      return undefined
    }
    const x = Number(parts[0])
    const y = Number(parts[1])
    return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : undefined
  },
  serialize: ([x, y]) => `${x.toFixed(4)},${y.toFixed(4)}`,
  defaultValue: [0, 0],
  debounceMs: 200,
})

// The zoom's range. A plane unit is unscaledUnitSize / scale px wide: 2500 px
// at 0.01, 0.25 px at 100.
export const minScale = 0.01
export const maxScale = 100

export const scaleParam = queryParamAtom<number>("scale", {
  parse: (raw) => {
    if (raw == null) {
      return undefined
    }
    const n = Number(raw)
    return Number.isFinite(n) && n >= minScale && n <= maxScale ? n : undefined
  },
  // Three significant digits at every scale (0.0137, 1.65, 57.3), so a
  // reload puts the zoom back within 0.5%.
  serialize: (v) => String(Number(v.toPrecision(3))),
  defaultValue: 0.5,
  debounceMs: 200,
})
