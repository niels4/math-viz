import {
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from "react"

import { useResizeObserver } from "#src/components/hooks/useResizeObserver.ts"
import { quantize } from "#src/util/format/number.ts"
import { selectNothingUntilRelease } from "#src/util/pointer/selectNothing.ts"

import style from "./ExtentSlider.module.css"
import { BASELINE_Y, extentMarks, TICK_LENGTH, TRACK_HEIGHT } from "./extentTicks.ts"
import { TriangleIcon } from "./icons.tsx"

export type ExtentSliderHandle = { focus: () => void }

/** Arrow keys (FV 07 › P scrubber): 0.1, Shift 1. */
const STEP = 0.1
const STEP_SHIFT = 1

const px = (v: number): number => Math.round(v * 100) / 100

const tickPath = (xs: readonly number[], length: number): string =>
  xs.map((x) => `M${px(x)} ${BASELINE_Y}V${BASELINE_Y + length}`).join("")

/** The lattice point nearest `v` on the range's side (ceil at the low end, floor at the high end). */
const inward = (v: number, q: number, side: "low" | "high"): number =>
  quantize((side === "low" ? Math.ceil(v / q - 1e-9) : Math.floor(v / q + 1e-9)) * q, q)

// An absolute slider over a live range (figma0 fvScrubber, FV 07's P
// scrubber): a track calibrated like an axis that follows its range (the
// plane's visible x-range), and a thumb the owner draws at the value. A
// press jumps to the pointer and drags; ← → step 0.1 (Shift 1) with no
// bounds, Home and End jump to the ends, Enter asks the owner to open its
// value field. Hover, focus and a drag show the value in a tip above the
// thumb. A value off the track parks the thumb on the end it lies past, and
// the tip points that way. Every value it sends sits on `quantum`. A drag
// selects no text, wherever the pointer goes.
export function ExtentSlider({
  value,
  min,
  max,
  quantum,
  onChange,
  label,
  symbol,
  format,
  renderThumb,
  onEditRequest,
  onDragChange,
  className,
  testId,
  ref,
}: {
  value: number
  min: number
  max: number
  /** The value's lattice: drags, keys and the ends land on it. */
  quantum: number
  onChange: (next: number) => void
  /** The slider's accessible name. */
  label: string
  /** The variable the tip names: "x" prints "x = 2". */
  symbol: string
  format: (v: number) => string
  /** The thumb's mark; `parked` when the value lies off the track. */
  renderThumb: (parked: boolean) => ReactNode
  /** Enter: the owner opens its value field. */
  onEditRequest?: () => void
  /** A pointer drag starts (true) or ends (false). */
  onDragChange?: (dragging: boolean) => void
  className?: string
  testId?: string
  ref?: Ref<ExtentSliderHandle>
}) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const { width } = useResizeObserver(trackRef)
  const draggingRef = useRef(false)
  const [dragging, setDragging] = useState(false)
  useImperativeHandle(ref, () => ({ focus: () => trackRef.current?.focus() }), [])

  const span = max - min
  const valid = Number.isFinite(value) && Number.isFinite(span) && span > 0
  const low = valid ? inward(min, quantum, "low") : min
  const high = valid ? inward(max, quantum, "high") : max
  const send = (next: number) => {
    const q = quantize(next, quantum) || 0
    if (q !== value) {
      onChange(q)
    }
  }

  const sendFromClientX = (clientX: number) => {
    const track = trackRef.current
    if (!valid || track === null) {
      return
    }
    const rect = track.getBoundingClientRect()
    if (rect.width === 0) {
      return
    }
    const t = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    send(Math.min(high, Math.max(low, min + t * span)))
  }

  const showDragging = (next: boolean) => {
    draggingRef.current = next
    setDragging(next)
    onDragChange?.(next)
  }

  const stop = () => {
    if (draggingRef.current) {
      showDragging(false)
    }
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !valid) {
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    selectNothingUntilRelease(event)
    showDragging(true)
    sendFromClientX(event.clientX)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) {
      return
    }
    if (event.buttons === 0) {
      // A missed release left the drag on: drop it instead of scrubbing from a hover.
      stop()
      return
    }
    sendFromClientX(event.clientX)
  }

  // Letting go anywhere, a lost capture or a lost window focus ends a drag
  // (AGENTS.md › pointer-capture drags).
  const onWindowRelease = useEffectEvent(() => stop())
  useEffect(() => {
    const release = () => onWindowRelease()
    window.addEventListener("pointerup", release)
    window.addEventListener("pointercancel", release)
    window.addEventListener("blur", release)
    return () => {
      window.removeEventListener("pointerup", release)
      window.removeEventListener("pointercancel", release)
      window.removeEventListener("blur", release)
    }
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
      case "ArrowLeft":
      case "ArrowDown": {
        if (!Number.isFinite(value)) {
          return
        }
        event.preventDefault()
        const direction = event.key === "ArrowRight" || event.key === "ArrowUp" ? 1 : -1
        send(value + direction * (event.shiftKey ? STEP_SHIFT : STEP))
        return
      }
      case "Home":
      case "End":
        if (valid) {
          event.preventDefault()
          send(event.key === "Home" ? low : high)
        }
        return
      case "Enter":
        if (onEditRequest !== undefined) {
          event.preventDefault()
          onEditRequest()
        }
        return
      default:
        return
    }
  }

  const marks = width > 0 ? extentMarks(min, max, width) : null
  const parked = !valid ? null : value < min ? "left" : value > max ? "right" : null
  const thumbX =
    !valid || width === 0
      ? null
      : parked === "left"
        ? 0
        : parked === "right"
          ? width
          : ((value - min) / span) * width
  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={format(value)}
      data-testid={testId}
      data-dragging={dragging || undefined}
      data-parked={parked ?? undefined}
      className={className === undefined ? style.track : `${style.track} ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onKeyDown={handleKeyDown}
    >
      {marks !== null && (
        <svg className={style.marks} width={width} height={TRACK_HEIGHT} aria-hidden="true">
          <path className={style.baseline} d={`M0 ${BASELINE_Y}H${px(width)}`} />
          <path className={style.tick} d={tickPath(marks.minor, TICK_LENGTH.minor)} strokeWidth={1} />
          <path className={style.tick} d={tickPath(marks.major, TICK_LENGTH.major)} strokeWidth={1.5} />
        </svg>
      )}
      {marks?.labels.map((mark) => (
        <span key={mark.value} className={style.label} style={{ left: mark.left }} aria-hidden="true">
          {mark.text}
        </span>
      ))}
      {thumbX !== null && (
        <>
          <span
            className={style.thumb}
            style={{ left: px(thumbX) }}
            data-testid={testId && `${testId}-thumb`}
          >
            {renderThumb(parked !== null)}
          </span>
          <span
            className={style.tip}
            style={{ "--x": `${px(thumbX)}px`, "--w": `${px(width)}px` } as CSSProperties}
            aria-hidden="true"
          >
            {parked === "left" && <TriangleIcon dir="left" width={7} height={10} />}
            <var>{symbol}</var>
            <span className={style.tip_value}>= {format(value)}</span>
            {parked === "right" && <TriangleIcon dir="right" width={7} height={10} />}
          </span>
        </>
      )}
    </div>
  )
}
