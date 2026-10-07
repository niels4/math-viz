import type { KeyboardEvent, PointerEvent } from "react"

import { useCallback, useEffect, useRef, useState } from "react"

import { useLiveValue } from "#src/components/hooks/useLiveValue.ts"

import type { HelpContent } from "./HelpTip.tsx"
import type { ScrubKind } from "./scrub.ts"

import { HelpTip } from "./HelpTip.tsx"
import { scrubDelta, wheelDxPx } from "./scrub.ts"
import stripStyles from "./ScrubStrip.module.css"

// A relative (jog-style) scrub strip: dragging emits value deltas from the
// grab point, so there is no min/max and unbounded params scrub forever.
// Blender polarity: plain drag is coarse, Shift is fine, Ctrl snaps to
// integers. Double-click resets, wheel scrubs in notches, arrows nudge.
export function ScrubStrip({
  value,
  onChange,
  kind,
  step,
  fineScale = 0.1,
  quantum,
  label,
  testId,
  defaultValue,
  help,
}: {
  value: number
  onChange: (next: number) => void
  kind: ScrubKind
  step: number
  fineScale?: number
  quantum?: number
  label: string
  testId: string
  defaultValue: number
  help?: HelpContent
}) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{ startX: number; startValue: number } | null>(null)
  const emittedRef = useRef(value)
  const [mode, setMode] = useState<"fine" | "snap" | null>(null)
  const q = quantum ?? step * fineScale

  const emit = useCallback(
    (next: number) => {
      if (next !== emittedRef.current) {
        emittedRef.current = next
        onChange(next)
      }
    },
    [onChange],
  )

  const scrubTo = (clientX: number, fine: boolean, snap: boolean) => {
    const drag = dragRef.current
    if (drag === null) {
      return
    }
    setMode(snap ? "snap" : fine ? "fine" : null)
    emit(
      scrubDelta({
        value: drag.startValue,
        dxPx: clientX - drag.startX,
        kind,
        step,
        fineScale,
        quantum: q,
        fine,
        snap,
      }),
    )
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragRef.current = { startX: event.clientX, startValue: value }
    emittedRef.current = value
    event.currentTarget.setPointerCapture(event.pointerId)
    setMode(event.ctrlKey || event.metaKey ? "snap" : event.shiftKey ? "fine" : null)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.buttons === 0) {
      // No button held: a missed release left the scrub stuck on, so drop
      // it instead of scrubbing from a hover.
      stopScrub()
      return
    }
    if (dragRef.current === null) {
      return
    }
    scrubTo(event.clientX, event.shiftKey, event.ctrlKey || event.metaKey)
  }

  const stopScrub = useCallback(() => {
    dragRef.current = null
    setMode(null)
  }, [])

  // Letting go stops the scrub unconditionally. The element handlers miss
  // the release when it lands outside the window or focus moves mid-drag,
  // which used to leave the scrub stuck on.
  useEffect(() => {
    window.addEventListener("pointerup", stopScrub)
    window.addEventListener("pointercancel", stopScrub)
    window.addEventListener("blur", stopScrub)
    return () => {
      window.removeEventListener("pointerup", stopScrub)
      window.removeEventListener("pointercancel", stopScrub)
      window.removeEventListener("blur", stopScrub)
    }
  }, [stopScrub])

  // Native non-passive listener so wheel scrubbing never scrolls the page.
  // Notches that land before React renders again (a trackpad's, within one
  // frame) each start where the last one left the value.
  const liveValueRef = useLiveValue(value)
  useEffect(() => {
    const track = trackRef.current
    if (track === null) {
      return
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const snap = e.ctrlKey || e.metaKey
      const next = scrubDelta({
        value: liveValueRef.current,
        dxPx: wheelDxPx(e.deltaY, e.deltaMode),
        kind,
        step,
        fineScale,
        quantum: q,
        fine: e.shiftKey,
        snap,
      })
      liveValueRef.current = next
      emit(next)
    }
    track.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      track.removeEventListener("wheel", onWheel)
    }
  }, [liveValueRef, kind, step, fineScale, q, emit])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const dir =
      event.key === "ArrowRight" || event.key === "ArrowUp"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowDown"
          ? -1
          : 0
    if (dir === 0) {
      return
    }
    event.preventDefault()
    emit(
      scrubDelta({
        value,
        dxPx: dir * (event.shiftKey ? 150 : 15),
        kind,
        step,
        fineScale,
        quantum: q,
        fine: false,
        snap: false,
      }),
    )
  }

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuenow={value}
      aria-valuetext={String(value)}
      data-testid={testId}
      title="Drag to scrub · Shift fine · Ctrl snap · double-click resets"
      className={
        mode === null
          ? stripStyles.strip
          : `${stripStyles.strip} ${mode === "fine" ? stripStyles.strip_fine : stripStyles.strip_snap}`
      }
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopScrub}
      onPointerCancel={stopScrub}
      onLostPointerCapture={stopScrub}
      onDoubleClick={() => onChange(defaultValue)}
      onKeyDown={handleKeyDown}
    >
      <div className={stripStyles.strip_detent} aria-hidden="true" />
      {help !== undefined && (
        <span className={stripStyles.strip_help}>
          <HelpTip help={help} label={`${label} help`} />
        </span>
      )}
      {mode !== null && (
        <span className={stripStyles.strip_badge} aria-hidden="true">
          {mode}
        </span>
      )}
    </div>
  )
}
