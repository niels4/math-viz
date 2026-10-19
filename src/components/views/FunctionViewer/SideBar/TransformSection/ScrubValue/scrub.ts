export type ScrubMode = "coarse" | "fine" | "snap"

export const scrubMode = (keys: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }): ScrubMode =>
  keys.ctrlKey || keys.metaKey ? "snap" : keys.shiftKey ? "fine" : "coarse"

const quantize = (v: number, step: number) =>
  Number((Math.sign(v) * Math.round(Math.abs(v) / step) * step).toPrecision(12))

export const SHIFT_PER_PX = 0.02
export const SCALE_PER_PX = 0.002

export const scrubbed = (from: number, dx: number, isScale: boolean, mode: ScrubMode) => {
  const rate = (isScale ? SCALE_PER_PX : SHIFT_PER_PX) * (mode === "fine" ? 0.1 : 1)
  const raw = isScale && from !== 0 ? from * (1 + rate) ** dx : from + rate * dx
  const step = mode === "snap" ? (isScale ? 0.25 : 1) : mode === "fine" ? 0.001 : 0.01
  const next = quantize(raw, step)
  return isScale && next === 0 && raw !== 0 ? Math.sign(raw) * step : next
}

export const nudged = (value: number, isScale: boolean, delta: number) => {
  if (!isScale) {
    return quantize(value + delta, 0.001) || 0
  }
  const size = Math.max(Math.min(Math.abs(value), 0.01), quantize(Math.abs(value) + delta, 0.001))
  return value < 0 ? -size : size
}

export const wheelDx = (e: WheelEvent) => (-(e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY) / 100) * 15

export const shown = (v: number, fine: boolean) =>
  v.toFixed(fine || quantize(v, 0.01) !== quantize(v, 0.001) ? 3 : 2)
