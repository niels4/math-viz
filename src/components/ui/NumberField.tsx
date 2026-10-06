import { useId, useImperativeHandle, useRef, useState, type KeyboardEvent, type Ref } from "react"

import { FINE_DP, formatStored, parseNumber, roundTo } from "#src/util/format/number.ts"

import fieldStyles from "./NumberField.module.css"
import { useFieldId } from "./useFieldId.ts"

export type NumberFieldHandle = { edit: () => void }

/** How an edit ended: Enter, Esc, or focus leaving the field. */
export type NumberFieldEnd = "commit" | "cancel" | "blur"

/** Text the field refused: "invalid" when it isn't a number, or the owner's reason from `validate`. */
export type NumberFieldEdit = { error: string | null }

/** ↑ ↓ while typing (FV 07's edit hint: "nudge 0.01"). */
const NUDGE = 0.01

type Edit = { text: string; base: number; error: string | null }

type Read = { value: number } | { error: string }

// A value field (figma0 transform-control-fv › Value field, FV 07). It shows
// the stored value through the number rule; a click, focus or the owner's
// edit() opens it for typing. Enter commits a number, rounded to 3 dp, or
// keeps the field open with the text marked as refused. Esc puts back the
// value from before the edit; leaving commits a number or puts the value
// back. ↑ ↓ nudge by 0.01 and apply at once. The owner hears each edit state
// (onEditChange) and how an edit ended (onEditEnd), so it can light its
// control and take the focus back.
export function NumberField({
  id,
  value,
  onCommit,
  validate,
  format = formatStored,
  label,
  testId,
  tabIndex = 0,
  hot = false,
  muted = false,
  onEditChange,
  onEditEnd,
  ref,
}: {
  id?: string
  value: number
  onCommit: (next: number) => void
  /** The owner's refusal of a number, as an error code; null accepts it. */
  validate?: (next: number) => string | null
  format?: (v: number) => string
  /** The field's accessible name. */
  label: string
  testId?: string
  /** -1 when the owner opens the field itself (a ruler's Enter), so a control keeps one tab stop. */
  tabIndex?: number
  /** Boxed, as on its control's hover. */
  hot?: boolean
  /** The value is at its default. */
  muted?: boolean
  onEditChange?: (edit: NumberFieldEdit | null) => void
  onEditEnd?: (how: NumberFieldEnd) => void
  ref?: Ref<NumberFieldHandle>
}) {
  const fieldId = useFieldId()
  const autoId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  // The edit as handlers see it right away; state re-renders. A commit's
  // focus move blurs the field before React re-renders.
  const editRef = useRef<Edit | null>(null)
  const [edit, setEdit] = useState<Edit | null>(null)

  const update = (next: Edit | null) => {
    const before = editRef.current
    editRef.current = next
    setEdit(next)
    if ((before === null) !== (next === null) || before?.error !== next?.error) {
      onEditChange?.(next === null ? null : { error: next.error })
    }
  }

  // Opens the field with its text selected. It may already have the focus:
  // after Enter, a field nobody takes the focus from stays focused, closed.
  const open = (input: HTMLInputElement) => {
    input.focus()
    if (editRef.current === null) {
      update({ text: format(value), base: value, error: null })
      input.select()
    }
  }

  useImperativeHandle(ref, () => ({
    edit: () => {
      if (inputRef.current !== null) {
        open(inputRef.current)
      }
    },
  }))

  const read = (text: string): Read => {
    const n = parseNumber(text)
    if (n === null) {
      return { error: "invalid" }
    }
    const rounded = roundTo(n, FINE_DP) || 0
    const error = validate?.(rounded) ?? null
    return error === null ? { value: rounded } : { error }
  }

  const apply = (next: number) => {
    if (next !== value) {
      onCommit(next)
    }
  }

  const end = (how: NumberFieldEnd) => {
    update(null)
    onEditEnd?.(how)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const current = editRef.current
    if (current === null) {
      if (event.key === "Enter") {
        event.preventDefault()
        open(event.currentTarget)
      }
      return
    }
    switch (event.key) {
      case "Enter": {
        event.preventDefault()
        const result = read(current.text)
        if ("error" in result) {
          update({ ...current, error: result.error })
          return
        }
        apply(result.value)
        end("commit")
        return
      }
      case "Escape":
        event.preventDefault()
        apply(current.base)
        end("cancel")
        return
      case "ArrowUp":
      case "ArrowDown": {
        event.preventDefault()
        const result = read(current.text)
        const from = "value" in result ? result.value : value
        const next = roundTo(from + (event.key === "ArrowUp" ? NUDGE : -NUDGE), FINE_DP) || 0
        // A nudge onto a refused value (a scale onto 0) does nothing.
        if ((validate?.(next) ?? null) !== null) {
          return
        }
        update({ ...current, text: format(next), error: null })
        apply(next)
        return
      }
      default:
        return
    }
  }

  return (
    <span className={fieldStyles.font}>
      <input
        ref={inputRef}
        id={id ?? fieldId ?? autoId}
        inputMode="decimal"
        enterKeyHint="done"
        autoComplete="off"
        spellCheck={false}
        tabIndex={tabIndex}
        aria-label={label}
        aria-invalid={edit !== null && edit.error !== null ? true : undefined}
        data-testid={testId}
        data-hot={hot || undefined}
        data-muted={muted || undefined}
        data-editing={edit === null ? undefined : true}
        readOnly={edit === null}
        value={edit === null ? format(value) : edit.text}
        className={fieldStyles.field}
        // A click opens the field with its text selected: left to itself, the
        // click would put the caret where it landed.
        onMouseDown={(event) => {
          if (editRef.current === null) {
            event.preventDefault()
            open(event.currentTarget)
          }
        }}
        onFocus={(event) => open(event.currentTarget)}
        onChange={(event) => {
          const current = editRef.current
          if (current !== null) {
            update({ ...current, text: event.currentTarget.value, error: null })
          }
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          const current = editRef.current
          if (current === null) {
            return
          }
          const result = read(current.text)
          apply("value" in result ? result.value : current.base)
          end("blur")
        }}
      />
    </span>
  )
}
