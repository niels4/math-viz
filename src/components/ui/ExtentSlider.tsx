import type { KeyboardEvent, PointerEvent } from "react"

import { useCallback, useEffect, useRef } from "react"

import sliderStyles from "./Slider.module.css"

// Slider emissions are quantized to thousandths, the finest lattice the
// number rule stores (src/util/format/number.ts), so drags never leave float
// tails like 2.5000000001 in the paired NumberField.
const round3 = (n: number): number => Math.round(n * 1000) / 1000

// Bounds readout under the track: display-trimmed only, the slider keeps
// the exact min/max for positioning and aria.
const formatBound = (n: number): string => String(round3(n))

// A traditional (absolute-position) slider bound to a live [min, max]
// range. The track follows min/max (the Points p1 slider binds them to the
// grid's visible X extent), the knob sits at the value's fractional
// position, and an out-of-range value hides the knob instead of clamping
// it. Pointer handling mirrors ScrubStrip: window-level stoppers plus a
// buttons guard so a missed release can never leave a drag stuck on.
export function ExtentSlider({
  value,
  min,
  max,
  onChange,
  label,
  testId,
}: {
  value: number
  min: number
  max: number
  onChange: (next: number) => void
  label: string
  testId: string
}) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const draggingRef = useRef(false)
  const span = max - min
  const valid =
    Number.isFinite(value) &&
    Number.isFinite(min) &&
    Number.isFinite(max) &&
    Number.isFinite(span) &&
    span > 0
  const inRange = valid && value >= min && value <= max
  const ratio = valid ? (value - min) / span : 0
  const clamped = Math.min(1, Math.max(0, ratio))

  const setFromClientX = (clientX: number) => {
    if (!valid) {
      return
    }
    const track = trackRef.current
    if (track === null) {
      return
    }
    const rect = track.getBoundingClientRect()
    if (rect.width === 0) {
      return
    }
    const next = (clientX - rect.left) / rect.width
    onChange(round3(min + Math.min(1, Math.max(0, next)) * span))
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    setFromClientX(event.clientX)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.buttons === 0) {
      // No button held: a missed release left the drag stuck on, so drop
      // it instead of scrubbing from a hover.
      stopDragging()
      return
    }
    if (!draggingRef.current) {
      return
    }
    setFromClientX(event.clientX)
  }

  const stopDragging = useCallback(() => {
    draggingRef.current = false
  }, [])

  // Letting go stops the drag unconditionally. The element handlers miss
  // the release when it lands outside the window or focus moves mid-drag,
  // which used to leave the drag stuck on.
  useEffect(() => {
    window.addEventListener("pointerup", stopDragging)
    window.addEventListener("pointercancel", stopDragging)
    window.addEventListener("blur", stopDragging)
    return () => {
      window.removeEventListener("pointerup", stopDragging)
      window.removeEventListener("pointercancel", stopDragging)
      window.removeEventListener("blur", stopDragging)
    }
  }, [stopDragging])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!valid) {
      return
    }
    const small = span / 100
    const big = span / 10
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault()
      onChange(Math.min(max, Math.max(min, round3(value + (event.shiftKey ? big : small)))))
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault()
      onChange(Math.min(max, Math.max(min, round3(value - (event.shiftKey ? big : small)))))
    } else if (event.key === "Home") {
      event.preventDefault()
      onChange(min)
    } else if (event.key === "End") {
      event.preventDefault()
      onChange(max)
    }
  }

  return (
    // Grouping div: keeps the track and its scale row in one control-row
    // grid cell so the bounds sit under the slider, not across the row.
    <div>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={String(value)}
        data-testid={testId}
        className={sliderStyles.slider_track}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onLostPointerCapture={stopDragging}
        onKeyDown={handleKeyDown}
      >
        <div className={sliderStyles.slider_fill} style={{ width: `${clamped * 100}%` }} />
        {inRange && (
          <div
            className={sliderStyles.slider_knob}
            style={{ left: `${clamped * 100}%` }}
            data-testid={`${testId}-knob`}
            aria-hidden="true"
          />
        )}
      </div>
      <div className={sliderStyles.slider_scale} aria-hidden="true">
        <span data-testid={`${testId}-min`}>{formatBound(min)}</span>
        <span data-testid={`${testId}-max`}>{formatBound(max)}</span>
      </div>
    </div>
  )
}
