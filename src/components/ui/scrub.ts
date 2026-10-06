// Pure math for ScrubStrip: relative (jog-style) scrubbing with no min/max.
// All gestures resolve to a horizontal pixel delta from the grab point, and
// the next value is always derived from the grab value (never accumulated),
// so float error cannot build up across a drag.

export type ScrubKind = "additive" | "multiplicative"

export type ScrubDelta = {
  value: number
  dxPx: number
  kind: ScrubKind
  // Value change per px at normal rate (units/px additive, fraction/px
  // multiplicative). Shift scales it by fineScale.
  step: number
  fineScale: number
  // Display quantum for additive mode; snapped to integers under Ctrl.
  quantum: number
  fine: boolean
  snap: boolean
}

// Blender polarity: Shift is fine, Ctrl snaps to integers (and wins over fine).
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
  if (kind === "multiplicative" && value !== 0) {
    const scaled = value * (1 + rate) ** dxPx
    // Preserve sign so scrubbing a negative scale never crosses zero.
    const next = Math.sign(value) * Math.abs(scaled)
    return snap ? Math.round(next) : Number(next.toPrecision(6))
  }
  // Additive path, including the zero fallback: multiplicative scrubbing
  // cannot leave 0 (0 times anything is 0), so it pushes additively until
  // the value is nonzero.
  const next = value + dxPx * rate
  const q = snap ? 1 : quantum
  return Math.round(next / q) * q
}

// Wheel notch expressed as equivalent scrub px: scroll up increases.
// Lines mode matches the canvas wheel normalization (16px per line).
export const wheelDxPx = (deltaY: number, deltaMode: number, notchPx = 15): number => {
  const delta = deltaMode === 1 ? deltaY * 16 : deltaY
  return (-delta / 100) * notchPx
}
