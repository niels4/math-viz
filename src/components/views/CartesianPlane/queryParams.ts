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

export const scaleParam = queryParamAtom<number>("scale", {
  parse: (raw) => {
    if (raw == null) {
      return undefined
    }
    const n = Number(raw)
    return Number.isFinite(n) && n >= 0.1 && n <= 5 ? n : undefined
  },
  serialize: (v) => v.toFixed(2),
  defaultValue: 0.5,
  debounceMs: 200,
})
