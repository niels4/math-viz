// Pure math for ScrubStrip: relative (jog-style) scrubbing with no min/max.
// All gestures resolve to a horizontal pixel delta from the grab point, and
// the next value is always derived from the grab value (never accumulated),
// so float error cannot build up across a drag.

import { quantize } from "#src/util/format/number.ts"

export type ScrubKind = "additive" | "multiplicative"

/** Stored = shown (src/util/format/number.ts): a drag lands on 0.01, a fine drag on 0.001. */
export const SCRUB_QUANTUM = 0.01

/** Ctrl snap (decision D9): shifts to whole numbers, scales to quarters. */
export const SNAP_STEP: Readonly<Record<ScrubKind, number>> = { additive: 1, multiplicative: 0.25 }

export type ScrubDelta = {
  value: number
  dxPx: number
  kind: ScrubKind
  // Value change per px at normal rate (units/px additive, fraction/px
  // multiplicative). Shift scales it by fineScale.
  step: number
  fineScale: number
  // Lattice a normal drag lands on; a fine drag lands on quantum × fineScale.
  quantum: number
  fine: boolean
  snap: boolean
}

// Blender polarity: Shift is fine, Ctrl snaps and wins over fine.
export const scrubDelta = ({
  value,
  dxPx,
  kind,
  step,
  fineScale,
  quantum,
  fine,
  snap,
}: ScrubDelta): number => {
  const rate = fine && !snap ? step * fineScale : step
  // Multiplicative scrubbing cannot leave 0 (0 times anything is 0), so a
  // scale at 0 is pushed additively until it is nonzero. Otherwise the
  // factor is positive, so a scale keeps its sign.
  const raw = kind === "multiplicative" && value !== 0 ? value * (1 + rate) ** dxPx : value + dxPx * rate
  const lattice = snap ? SNAP_STEP[kind] : fine ? quantum * fineScale : quantum
  const next = quantize(raw, lattice)
  // A scale never lands on 0, which would flatten the curve (D9): it stops
  // one lattice step short, on its own side.
  return kind === "multiplicative" && next === 0 && raw !== 0 ? Math.sign(raw) * lattice : next
}

// Wheel notch expressed as equivalent scrub px: scroll up increases.
// Lines mode matches the canvas wheel normalization (16px per line).
export const wheelDxPx = (deltaY: number, deltaMode: number, notchPx = 15): number => {
  const delta = deltaMode === 1 ? deltaY * 16 : deltaY
  return (-delta / 100) * notchPx
}
