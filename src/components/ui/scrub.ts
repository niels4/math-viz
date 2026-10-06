// Pure maths for the jog ruler (ScrubStrip) and anything dragged like it:
// relative scrubbing with no min/max. Every gesture resolves to a horizontal
// pixel delta from an anchor, and the next value is derived from the anchor
// value (never accumulated), so float error cannot build up across a drag.

import { FINE_DP, quantize, roundTo } from "#src/util/format/number.ts"

/** Shifts add (linear ruler), scales multiply (log ruler). */
export type ScrubKind = "additive" | "multiplicative"

/** A plain drag, Shift for fine (a tenth of the speed), Ctrl or ⌘ to snap, which wins over fine. */
export type ScrubMode = "coarse" | "fine" | "snap"

/** Value change per px: 0.02 units (50 px per unit) for shifts, ×1.002 per px for scales. */
export const SCRUB_STEP: Readonly<Record<ScrubKind, number>> = { additive: 0.02, multiplicative: 0.002 }

/** Shift scales the rate and the lattice by this. */
export const FINE_SCALE = 0.1

/** Stored = shown (src/util/format/number.ts): a drag lands on 0.01, a fine drag on 0.001. */
export const SCRUB_QUANTUM = 0.01

/** Ctrl snap (decision D9): shifts to whole numbers, scales to quarters. */
export const SNAP_STEP: Readonly<Record<ScrubKind, number>> = { additive: 1, multiplicative: 0.25 }

/** Arrow keys on a ruler (FV 07): one display step, Shift ten. */
export const NUDGE_STEP = 0.01
export const NUDGE_STEP_SHIFT = 0.1

export const scrubMode = (keys: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }): ScrubMode =>
  keys.ctrlKey || keys.metaKey ? "snap" : keys.shiftKey ? "fine" : "coarse"

const latticeFor = (kind: ScrubKind, mode: ScrubMode): number =>
  mode === "snap" ? SNAP_STEP[kind] : mode === "fine" ? SCRUB_QUANTUM * FINE_SCALE : SCRUB_QUANTUM

export type ScrubDelta = {
  /** The anchor value the drag measures from. */
  value: number
  dxPx: number
  kind: ScrubKind
  mode: ScrubMode
}

export const scrubDelta = ({ value, dxPx, kind, mode }: ScrubDelta): number => {
  const rate = SCRUB_STEP[kind] * (mode === "fine" ? FINE_SCALE : 1)
  // Multiplicative scrubbing cannot leave 0 (0 times anything is 0), so a
  // scale at 0 is pushed additively until it is nonzero. Otherwise the
  // factor is positive, so a scale keeps its sign.
  const raw = kind === "multiplicative" && value !== 0 ? value * (1 + rate) ** dxPx : value + dxPx * rate
  const lattice = latticeFor(kind, mode)
  const next = quantize(raw, lattice)
  // A scale never lands on 0, which would flatten the curve (D9): it stops
  // one lattice step short, on its own side.
  return kind === "multiplicative" && next === 0 && raw !== 0 ? Math.sign(raw) * lattice : next
}

/**
 * An arrow key on a ruler: `delta` along the ruler's reading. A scale's
 * ruler reads its size, so the sign stays and the size stops at 0.01 (or
 * where it already is, if smaller) instead of reaching 0.
 */
export const nudge = (value: number, kind: ScrubKind, delta: number): number => {
  if (kind === "additive") {
    return roundTo(value + delta, FINE_DP) || 0
  }
  const size = Math.abs(value)
  const next = Math.max(Math.min(size, SCRUB_QUANTUM), roundTo(size + delta, FINE_DP))
  return value < 0 ? -next : next
}

// Wheel notch expressed as equivalent scrub px: scroll up increases.
// Lines mode matches the canvas wheel normalization (16px per line).
export const wheelDxPx = (deltaY: number, deltaMode: number, notchPx = 15): number => {
  const delta = deltaMode === 1 ? deltaY * 16 : deltaY
  return (-delta / 100) * notchPx
}
