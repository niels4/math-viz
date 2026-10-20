import type { VisibleRange } from "../../../CartesianPlane/state.ts"

const MINUS = "−"

export const formatNumber = (v: number): string => {
  const digits = Math.abs(v).toFixed(2)
  return v < 0 && digits !== "0.00" ? MINUS + digits : digits
}

export const relation = (v: number): "=" | "≈" => (Math.abs(Number(v.toFixed(2)) - v) < 1e-9 ? "=" : "≈")

export type ReadoutSlots = { x: number; y: number }

const widest = (lo: number, hi: number): number => Math.max(formatNumber(lo).length, formatNumber(hi).length)

export const readoutSlots = (range: VisibleRange | null): ReadoutSlots | null =>
  range === null ? null : { x: widest(range.minX, range.maxX), y: widest(range.minY, range.maxY) }
