import { useEffect, useEffectEvent, useImperativeHandle, useRef, type KeyboardEvent, type Ref } from "react"

import { useResizeObserver } from "#src/components/hooks/useResizeObserver.ts"
import { formatStored } from "#src/util/format/number.ts"

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
import { RULER_HEIGHT, TICK_LENGTH, rulerMarks } from "./scrubRuler.ts"
import stripStyles from "./ScrubStrip.module.css"
import { useScrubDrag } from "./useScrubDrag.ts"

export type ScrubStripHandle = { focus: () => void }

const px = (v: number): number => Math.round(v * 100) / 100

const tickPath = (xs: readonly number[], length: number): string =>
  xs.map((x) => `M${px(x)} 0V${length}`).join("")

// The jog ruler (figma0 transform-control-fv, fvTape; decision D24): a tape
// of ticks and labels sliding under a fixed index, so the value under the
// index is the current one. Drag anywhere: right for more, Shift fine, Ctrl
// or ⌘ snaps (shifts to whole numbers, scales to quarters, D9). The wheel
// scrubs; ← → nudge 0.01 (Shift 0.1); Enter asks the owner to open its value
// field; Backspace, Delete or a double-click reset. A scale's ruler is
// logarithmic and reads its size: the sign is the owner's (a flip toggle).
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

  const onWheel = useEffectEvent((event: WheelEvent) => {
    event.preventDefault()
    const next = scrubDelta({
      value,
      dxPx: wheelDxPx(event.deltaY, event.deltaMode),
      kind,
      mode: scrubMode(event),
    })
    if (next !== value) {
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

  const marks = width > 0 ? rulerMarks(kind, value, width) : null
  const c = width / 2
  const shownMode = mode ?? held
  // The index line thickens while the tape is held.
  const indexWidth = shownMode === null ? 2 : 3
  return (
    <div
      ref={stripRef}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-describedby={describedBy}
      aria-valuenow={kind === "multiplicative" ? Math.abs(value) : value}
      aria-valuetext={formatStored(value)}
      data-testid={testId}
      data-mode={shownMode ?? undefined}
      data-hot={hot || undefined}
      data-dimmed={dimmed || undefined}
      className={stripStyles.strip}
      {...handlers}
      onDoubleClick={onReset}
      onKeyDown={handleKeyDown}
    >
      {marks !== null && (
        <>
          <svg className={stripStyles.marks} width={width} height={RULER_HEIGHT} aria-hidden="true">
            <path className={stripStyles.tick} d={tickPath(marks.minor, TICK_LENGTH.minor)} strokeWidth={1} />
            <path className={stripStyles.tick} d={tickPath(marks.mid, TICK_LENGTH.mid)} strokeWidth={1} />
            <path
              className={stripStyles.tick}
              d={tickPath(marks.major, TICK_LENGTH.major)}
              strokeWidth={1.5}
            />
            {marks.home !== null && (
              <path
                className={stripStyles.home}
                d={`M${px(marks.home - 4)} 0H${px(marks.home + 4)}L${px(marks.home)} 6Z`}
              />
            )}
            <rect
              className={stripStyles.index}
              x={c - indexWidth / 2}
              y={0}
              width={indexWidth}
              height={RULER_HEIGHT}
            />
            <path
              className={stripStyles.index}
              d={`M${c - 6} ${RULER_HEIGHT}H${c + 6}L${c} ${RULER_HEIGHT - 7}Z`}
            />
            <path
              className={stripStyles.chevrons}
              d={`M13 11L8 16L13 21M${width - 13} 11L${width - 8} 16L${width - 13} 21`}
            />
          </svg>
          {marks.labels.map((mark) => (
            <span key={mark.text} className={stripStyles.label} style={{ left: mark.left }}>
              {mark.text}
            </span>
          ))}
        </>
      )}
    </div>
  )
}
