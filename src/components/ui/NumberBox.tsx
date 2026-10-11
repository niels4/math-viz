import {
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
  type Ref,
} from "react"

import { useLiveValue } from "#src/components/hooks/useLiveValue.ts"
import { formatStored } from "#src/util/format/number.ts"

import style from "./NumberBox.module.css"
import {
  NumberField,
  type NumberFieldEdit,
  type NumberFieldEnd,
  type NumberFieldHandle,
} from "./NumberField.tsx"
import {
  DRAG_THRESHOLD,
  NUDGE_STEP,
  NUDGE_STEP_SHIFT,
  nudge,
  scrubDelta,
  scrubMode,
  wheelDxPx,
  type ScrubKind,
  type ScrubMode,
} from "./scrub.ts"
import { useScrubDrag } from "./useScrubDrag.ts"

export type NumberBoxHandle = { focus: () => void }

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg className={style.chevron} width="6" height="12" viewBox="0 0 6 12" aria-hidden="true">
      <path d={dir === "left" ? "M5 2L1 6L5 10" : "M1 2L5 6L1 10"} />
    </svg>
  )
}

// A number you drag (figma0 SB · B › Number rows, SB3 · C3 › Number box):
// the value between ‹ and ›, right-aligned in a slot as wide as −10.00, the
// box growing to the left for anything wider. Drag it sideways at the
// ruler's rates (right for more, Shift fine, Ctrl or ⌘ snaps); a click
// types into it (NumberField: Enter applies, Esc puts back); a double-click,
// Backspace or Delete resets; ← → ↑ ↓ nudge 0.01 (Shift 0.1); Enter types;
// the wheel scrubs. Screen readers meet a spin button, as on the ruler. Its
// ink (outline, arrows, value) is the owner's (--box-ink), and its owner
// hears the drag's mode and the edit, as a ruler's owner does.
export function NumberBox({
  value,
  kind,
  onChange,
  onCommit,
  onReset,
  validate,
  format = formatStored,
  label,
  describedBy,
  onModeChange,
  onEditChange,
  onEditEnd,
  held = null,
  hot = false,
  className,
  testId,
  ref,
}: {
  value: number
  kind: ScrubKind
  /** A value from a drag, a key or the wheel: the curve follows it 1 : 1. */
  onChange: (next: number) => void
  /** A value typed into the box (a jump). */
  onCommit: (next: number) => void
  /** A double-click, Backspace or Delete: back to the default. */
  onReset: () => void
  /** The owner's refusal of a typed number, as an error code; null accepts it. */
  validate?: (next: number) => string | null
  format?: (v: number) => string
  /** The spin button's accessible name. */
  label: string
  /** The id of what describes it now, e.g. its owner's open explainer. */
  describedBy?: string | undefined
  /** The drag's mode as it starts and changes, null when it ends. */
  onModeChange?: (mode: ScrubMode | null) => void
  onEditChange?: (edit: NumberFieldEdit | null) => void
  onEditEnd?: (how: NumberFieldEnd) => void
  /** Held from elsewhere (a term or a handle on the same value): drawn as dragged in that mode. */
  held?: ScrubMode | null
  /** Lit as on hover, when the owner's row is hovered. */
  hot?: boolean
  className?: string
  /** The box gets `${testId}-box`, its value field `${testId}-field`. */
  testId?: string
  ref?: Ref<NumberBoxHandle>
}) {
  const boxRef = useRef<HTMLDivElement | null>(null)
  const fieldRef = useRef<NumberFieldHandle | null>(null)
  const [edit, setEdit] = useState<NumberFieldEdit | null>(null)
  const editing = edit !== null
  const { mode, handlers } = useScrubDrag({
    value,
    kind,
    onChange,
    ...(onModeChange === undefined ? {} : { onModeChange }),
    threshold: DRAG_THRESHOLD,
    onTap: () => fieldRef.current?.edit(),
  })
  useImperativeHandle(ref, () => ({ focus: () => boxRef.current?.focus() }), [])

  // Notches that land before React renders again each start where the last
  // one left the value (AGENTS.md › a burst of events).
  const liveValueRef = useLiveValue(value)
  const onWheel = useEffectEvent((event: WheelEvent) => {
    if (editing) {
      return
    }
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
    const box = boxRef.current
    if (box === null) {
      return
    }
    const wheel = (event: WheelEvent) => onWheel(event)
    box.addEventListener("wheel", wheel, { passive: false })
    return () => box.removeEventListener("wheel", wheel)
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return
    }
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
        event.preventDefault()
        fieldRef.current?.edit()
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
    // The box is the spin button; its field is reached by a click or Enter.
    <div
      ref={boxRef}
      role="spinbutton"
      tabIndex={0}
      aria-label={label}
      aria-describedby={describedBy}
      aria-valuenow={value}
      aria-valuetext={format(value)}
      data-testid={testId === undefined ? undefined : `${testId}-box`}
      data-mode={shownMode ?? undefined}
      data-hot={hot || undefined}
      data-editing={(editing && edit.error === null) || undefined}
      data-error={(editing && edit.error !== null) || undefined}
      className={className === undefined ? style.box : `${style.box} ${className}`}
      onPointerDown={(event) => {
        // While typing, a press belongs to the text.
        if (!editing) {
          handlers.onPointerDown(event)
        }
      }}
      onPointerMove={handlers.onPointerMove}
      onPointerUp={handlers.onPointerUp}
      onPointerCancel={handlers.onPointerCancel}
      onLostPointerCapture={handlers.onLostPointerCapture}
      onMouseDown={(event) => {
        // A double-click resets, whatever the first click opened.
        if (event.detail >= 2) {
          event.preventDefault()
          fieldRef.current?.cancel()
          onReset()
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <Chevron dir="left" />
      <NumberField
        ref={fieldRef}
        value={value}
        onCommit={onCommit}
        {...(validate === undefined ? {} : { validate })}
        format={format}
        label={`${label}, value`}
        {...(testId === undefined ? {} : { testId: `${testId}-field` })}
        className={style.field}
        tabIndex={-1}
        onEditChange={(next) => {
          setEdit(next)
          onEditChange?.(next)
        }}
        onEditEnd={(how) => {
          if (how !== "blur") {
            boxRef.current?.focus()
          }
          onEditEnd?.(how)
        }}
      />
      <Chevron dir="right" />
    </div>
  )
}
