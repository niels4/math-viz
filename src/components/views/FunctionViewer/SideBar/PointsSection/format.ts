import type { VisibleRange } from "../../../CartesianPlane/state.ts"

const MINUS = "−"

export const QUANTUM = 0.01

export const quantize = (v: number) =>
  Number((Math.sign(v) * Math.round(Math.abs(v) / QUANTUM) * QUANTUM).toPrecision(12)) || 0

export const formatNumber = (v: number): string => {
  const digits = Math.abs(v).toFixed(2)
  return v < 0 && digits !== "0.00" ? MINUS + digits : digits
}

export const formatChange = (v: number): string => {
  const text = formatNumber(v)
  return v > 0 && text !== "0.00" ? `+${text}` : text
}

export const parseNumber = (text: string): number | null => {
  const s = text.trim().replaceAll(MINUS, "-")
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) {
    return null
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

const SCIENTIFIC_FROM = 1e5

const round2 = (v: number) => Number(v.toFixed(2))

export type NumberParts =
  | { kind: "fixed"; text: string; exact: boolean }
  | { kind: "sci"; mantissa: string; exponent: string; exact: boolean }

export const numberParts = (v: number): NumberParts => {
  if (!Number.isFinite(v) || Math.abs(round2(v)) < SCIENTIFIC_FROM) {
    return { kind: "fixed", text: formatNumber(v), exact: Math.abs(round2(v) - v) < 1e-9 }
  }
  let exponent = Math.floor(Math.log10(Math.abs(v)))
  if (Math.abs(round2(v / 10 ** exponent)) >= 10) {
    exponent += 1
  }
  const mantissa = round2(v / 10 ** exponent)
  return {
    kind: "sci",
    mantissa: formatNumber(mantissa),
    exponent: String(exponent),
    exact: Math.abs(mantissa * 10 ** exponent - v) <= 1e-9 * Math.abs(v),
  }
}

export type ReadoutSlots = { x: number; y: number }

const widest = (lo: number, hi: number): number => Math.max(formatNumber(lo).length, formatNumber(hi).length)

export const readoutSlots = (range: VisibleRange | null): ReadoutSlots | null =>
  range === null ? null : { x: widest(range.minX, range.maxX), y: widest(range.minY, range.maxY) }
