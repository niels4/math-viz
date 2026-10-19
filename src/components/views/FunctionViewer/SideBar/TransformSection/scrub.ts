// How a drag, the wheel or an arrow key changes a transform parameter.

// A plain drag; Shift for fine, a tenth as fast and on 0.001; or Ctrl or ⌘
// to snap, shifts to whole numbers and scales to quarters. Snap wins over
// fine.
export type ScrubMode = "coarse" | "fine" | "snap"

export const scrubMode = (keys: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }): ScrubMode =>
  keys.ctrlKey || keys.metaKey ? "snap" : keys.shiftKey ? "fine" : "coarse"

// Rounds to a multiple of step, halves away from 0, so a value and its
// negative round alike. toPrecision drops float noise such as
// 0.30000000000000004.
const quantize = (v: number, step: number) =>
  Number((Math.sign(v) * Math.round(Math.abs(v) / step) * step).toPrecision(12))

// How far a plain drag moves a value per px: a shift by 0.02, a scale by
// 0.2 % of itself. The ruler under the row draws at the same rates, so its
// marks move as far as the pointer.
export const SHIFT_PER_PX = 0.02
export const SCALE_PER_PX = 0.002

// The value a drag reaches dx px to the right of where it started at
// `from`. Each value comes from the start, not from the last move, so
// rounding can't build up over a long drag. Shifts move 0.02 per px. Scales
// grow 0.2 % per px, so a scale drags as evenly near 0.1 as near 10 and
// keeps its sign; a scale at 0, which no factor moves, moves 0.002 per px
// instead. A scale stops one step short of 0, which would squash the curve
// flat.
export const scrubbed = (from: number, dx: number, isScale: boolean, mode: ScrubMode) => {
  const rate = (isScale ? SCALE_PER_PX : SHIFT_PER_PX) * (mode === "fine" ? 0.1 : 1)
  const raw = isScale && from !== 0 ? from * (1 + rate) ** dx : from + rate * dx
  const step = mode === "snap" ? (isScale ? 0.25 : 1) : mode === "fine" ? 0.001 : 0.01
  const next = quantize(raw, step)
  return isScale && next === 0 && raw !== 0 ? Math.sign(raw) * step : next
}

// An arrow key's step of `delta`. A shift adds it. A scale adds it to its
// size and keeps its sign, stopping at 0.01, or where it is if smaller,
// instead of reaching 0.
export const nudged = (value: number, isScale: boolean, delta: number) => {
  if (!isScale) {
    return quantize(value + delta, 0.001) || 0
  }
  const size = Math.max(Math.min(Math.abs(value), 0.01), quantize(Math.abs(value) + delta, 0.001))
  return value < 0 ? -size : size
}

// A wheel notch as the px of drag it stands for: 15 px per 100 px of
// scroll, up for more. A wheel that scrolls by lines moves 16 px a line.
export const wheelDx = (e: WheelEvent) => (-(e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY) / 100) * 15

// The value as the box shows it: 2 decimals, or 3 when it has a third, from
// a fine drag or typing, or while a fine drag holds it, so the digits keep
// their width mid-drag.
export const shown = (v: number, fine: boolean) =>
  v.toFixed(fine || quantize(v, 0.01) !== quantize(v, 0.001) ? 3 : 2)
