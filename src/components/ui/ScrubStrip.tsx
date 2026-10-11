import { useEffect, useEffectEvent, useImperativeHandle, useRef, type KeyboardEvent, type Ref } from "react"

import { useLiveValue } from "#src/components/hooks/useLiveValue.ts"
import { useResizeObserver } from "#src/components/hooks/useResizeObserver.ts"
import { formatStored } from "#src/util/format/number.ts"

import { RulerMarks } from "./RulerTape.tsx"
import {
  NUDGE_STEP,
  NUDGE_STEP_SHIFT,
  nudge,
  scrubDelta,
  scrubMode,
  wheelDxPx,
  type ScrubKind,
  type ScrubMode,
} from "./scrub.ts"
import stripStyles from "./ScrubStrip.module.css"
import { useScrubDrag } from "./useScrubDrag.ts"

export type ScrubStripHandle = { focus: () => void }

// The jog ruler (figma0 transform-control-fv, fvTape; decision D24): a tape
// of ticks and labels sliding under a fixed index, so the value under the
// index is the current one. Drag anywhere: right for more, Shift fine, Ctrl
// or ⌘ snaps (shifts to whole numbers, scales to quarters, D9). The wheel
// scrubs; ← → nudge 0.01 (Shift 0.1); Enter asks the owner to open its value
// field; Backspace, Delete or a double-click reset. A scale's ruler is
// logarithmic and reads its size: the sign is the owner's (a flip toggle).
// The ticks, labels and home notch carry data-nudge, so a view can slide
// them under the index (FV 05: the first paint nudges each ruler once).
// Screen readers meet a spin button: the value has no range, so a slider's
// would be wrong; its labels are scale marks, read as its value instead.
export function ScrubStrip({
  value,
  onChange,
  onReset,
  kind,
  label,
  describedBy,
  onEditRequest,
  onModeChange,
  held = null,
  hot = false,
  dimmed = false,
  format = formatStored,
  testId,
  ref,
}: {
  value: number
  onChange: (next: number) => void
  /** Double-click, Backspace or Delete: back to the default. */
  onReset: () => void
  kind: ScrubKind
  /** The slider's accessible name. */
  label: string
  /** The id of what describes it now, e.g. its owner's open explainer. */
  describedBy?: string | undefined
  /** Enter: the owner opens its value field. */
  onEditRequest?: () => void
  /** The drag's mode as it starts and changes, null when it ends. */
  onModeChange?: (mode: ScrubMode | null) => void
  /** Held from elsewhere (the owner's other grips on the same value): drawn as dragged in that mode. */
  held?: ScrubMode | null
  /** Lit as on hover, when the owner's whole control is hovered. */
  hot?: boolean
  /** Stepped back while the owner's value is typed. */
  dimmed?: boolean
  /** The value as its field prints it, for screen readers. */
  format?: (v: number) => string
  testId?: string
  ref?: Ref<ScrubStripHandle>
}) {
  const stripRef = useRef<HTMLDivElement | null>(null)
  const { width } = useResizeObserver(stripRef)
  const { mode, handlers } = useScrubDrag({
    value,
    kind,
    onChange,
    ...(onModeChange === undefined ? {} : { onModeChange }),
  })
  useImperativeHandle(ref, () => ({ focus: () => stripRef.current?.focus() }), [])

  // Notches that land before React renders again (a trackpad's, within one
  // frame) each start where the last one left the value.
  const liveValueRef = useLiveValue(value)
  const onWheel = useEffectEvent((event: WheelEvent) => {
    event.preventDefault()
    const from = liveValueRef.current
    const next = scrubDelta({
      value: from,
      dxPx: wheelDxPx(event.deltaY, event.deltaMode),
      kind,
      mode: scrubMode(event),
    })
    if (next !== from) {
      liveValueRef.current = next
      onChange(next)
    }
  })

  // Native non-passive listener so wheel scrubbing never scrolls the page.
  useEffect(() => {
    const strip = stripRef.current
    if (strip === null) {
      return
    }
    const wheel = (event: WheelEvent) => onWheel(event)
    strip.addEventListener("wheel", wheel, { passive: false })
    return () => {
      strip.removeEventListener("wheel", wheel)
    }
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
      case "ArrowLeft":
      case "ArrowDown": {
        event.preventDefault()
        const direction = event.key === "ArrowRight" || event.key === "ArrowUp" ? 1 : -1
        const next = nudge(value, kind, direction * (event.shiftKey ? NUDGE_STEP_SHIFT : NUDGE_STEP))
        if (next !== value) {
          onChange(next)
        }
        return
      }
      case "Enter":
        if (onEditRequest !== undefined) {
          event.preventDefault()
          onEditRequest()
        }
        return
      case "Backspace":
      case "Delete":
        event.preventDefault()
        onReset()
        return
      default:
        return
    }
  }

  const shownMode = mode ?? held
  return (
    <div
      ref={stripRef}
      role="spinbutton"
      tabIndex={0}
      aria-label={label}
      aria-describedby={describedBy}
      aria-valuenow={kind === "multiplicative" ? Math.abs(value) : value}
      aria-valuetext={format(value)}
      data-testid={testId}
      data-mode={shownMode ?? undefined}
      data-hot={hot || undefined}
      data-dimmed={dimmed || undefined}
      className={stripStyles.strip}
      {...handlers}
      onDoubleClick={onReset}
      onKeyDown={handleKeyDown}
    >
      <RulerMarks kind={kind} value={value} width={width} held={shownMode !== null} />
    </div>
  )
}
