import { useRef, useState, type CSSProperties, type KeyboardEvent, type Ref } from "react"

import { useQueryParam } from "#src/components/router/queryParamAtom.ts"

import { pParam } from "../../queryParams.ts"
import { formatNumber, parseNumber } from "./format.ts"
import style from "./XField.module.css"

const NUDGE = 0.01

export type FieldEdit = { invalid: boolean; base: number }

export type FieldEnd = "commit" | "cancel" | "blur"

type Edit = FieldEdit & { text: string }

const rounded = (n: number) => Number(n.toFixed(3)) || 0

const read = (text: string): number | null => {
  const n = parseNumber(text)
  return n === null ? null : rounded(n)
}

export const XField = ({
  ref,
  onEditChange,
  onEditEnd,
}: {
  ref: Ref<HTMLInputElement>
  onEditChange: (edit: FieldEdit | null) => void
  onEditEnd: (how: FieldEnd) => void
}) => {
  const [value, setValue] = useQueryParam(pParam)
  // Handlers read the edit here: a commit's focus move blurs the field before React re-renders.
  const editRef = useRef<Edit | null>(null)
  const [edit, setEdit] = useState<Edit | null>(null)

  const update = (next: Edit | null) => {
    const before = editRef.current
    editRef.current = next
    setEdit(next)
    if ((before === null) !== (next === null) || before?.invalid !== next?.invalid) {
      onEditChange(next === null ? null : { invalid: next.invalid, base: next.base })
    }
  }

  const open = (input: HTMLInputElement) => {
    input.focus()
    if (editRef.current === null) {
      update({ text: formatNumber(value), base: value, invalid: false })
      input.select()
    }
  }

  const end = (how: FieldEnd) => {
    update(null)
    onEditEnd(how)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const current = editRef.current
    if (current === null) {
      if (e.key === "Enter") {
        e.preventDefault()
        open(e.currentTarget)
      }
      return
    }
    if (e.key === "Enter") {
      e.preventDefault()
      const next = read(current.text)
      if (next === null) {
        update({ ...current, invalid: true })
        return
      }
      setValue(next, { flush: true })
      end("commit")
    } else if (e.key === "Escape") {
      e.preventDefault()
      setValue(current.base, { flush: true })
      end("cancel")
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault()
      const next = rounded((read(current.text) ?? value) + (e.key === "ArrowUp" ? NUDGE : -NUDGE))
      update({ ...current, text: formatNumber(next), invalid: false })
      setValue(next)
    }
  }

  const text = edit?.text ?? formatNumber(value)

  return (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      enterKeyHint="done"
      autoComplete="off"
      spellCheck={false}
      tabIndex={-1}
      aria-label="x of P, value"
      aria-invalid={edit?.invalid === true ? true : undefined}
      data-editing={edit === null ? undefined : ""}
      readOnly={edit === null}
      value={text}
      className={style.field}
      style={{ "--chars": Math.max(1, text.length) } as CSSProperties}
      onMouseDown={(e) => {
        if (editRef.current === null) {
          e.preventDefault()
          open(e.currentTarget)
        }
      }}
      onFocus={(e) => open(e.currentTarget)}
      onChange={(e) => {
        const current = editRef.current
        if (current !== null) {
          update({ ...current, text: e.currentTarget.value, invalid: false })
        }
      }}
      onKeyDown={onKeyDown}
      onBlur={() => {
        const current = editRef.current
        if (current === null) {
          return
        }
        setValue(read(current.text) ?? current.base, { flush: true })
        end("blur")
      }}
    />
  )
}
