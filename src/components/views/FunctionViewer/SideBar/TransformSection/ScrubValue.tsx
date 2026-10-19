import { useAtomValue } from "jotai"
import { useRef, useState, type PointerEvent } from "react"

import { useQueryParam } from "#src/components/router/queryParamAtom.ts"
import { selectNothingUntilRelease } from "#src/util/pointer/selectNothing.ts"

import { transformParams } from "../../queryParams"
import { highlightAtoms, type TransformParam } from "../../state"
import style from "./ScrubValue.module.css"

// How far in px a press moves before it drags. A press that moves less is a
// click, which opens the box for typing, so a shaky click doesn't nudge the
// value.
const DRAG_THRESHOLD = 3

// The value a drag reaches dx px to the right of where it started. Shifts
// move 0.02 per px. Scales grow 0.2 % per px, so a scale drags as evenly
// near 0.1 as near 10 and never changes sign. Values land on 0.01, and a
// scale stops at ±0.01 instead of 0, which would squash the curve flat.
const scrubbed = (from: number, dx: number, isScale: boolean) => {
  const raw = isScale ? from * 1.002 ** dx : from + 0.02 * dx
  const next = Math.round(raw * 100) / 100
  return isScale && next === 0 ? Math.sign(raw) * 0.01 : next
}

// A transform parameter's value in a box between ‹ and ›. Drag the box
// sideways to change the value, right for more; click it to type one.
// `id` lets the row's label name the box.
export const ScrubValue = ({ id, param }: { id: string; param: TransformParam }) => {
  const urlParam = transformParams[param]
  const [value, setValue, flushValue] = useQueryParam(urlParam)
  const lit = useAtomValue(highlightAtoms[param])
  // The text in the box while you type. Partial numbers such as "-" or "1."
  // stay here, and Enter or leaving the box sets the value. Text the URL
  // wouldn't accept either, such as a scale of 0, puts the old value back.
  const [draft, setDraft] = useState<string | null>(null)
  const fieldRef = useRef<HTMLInputElement>(null)
  // The press on the box: its pointer, where it went down and the value
  // then, and whether it has moved far enough to drag.
  const press = useRef<{ id: number; x: number; from: number; dragging: boolean } | null>(null)

  const commit = () => {
    if (draft === null) {
      return
    }
    const next = urlParam.parse(draft)
    if (next !== undefined) {
      setValue(next, { flush: true })
    }
    setDraft(null)
  }

  const drag = (e: PointerEvent) => {
    const p = press.current
    if (p === null || e.pointerId !== p.id) {
      return
    }
    const dx = e.clientX - p.x
    if (!p.dragging && Math.abs(dx) < DRAG_THRESHOLD) {
      return
    }
    p.dragging = true
    setValue(scrubbed(p.from, dx, param === "a" || param === "b"))
  }

  return (
    <div
      className={style.box}
      data-lit={lit ? "" : undefined}
      onPointerDown={(e) => {
        // While you type, a press belongs to the text.
        if (e.button !== 0 || document.activeElement === fieldRef.current) {
          return
        }
        press.current = { id: e.pointerId, x: e.clientX, from: value, dragging: false }
        selectNothingUntilRelease(e)
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          // Synthetic events in tests use arbitrary pointerIds that were
          // never captured, and some browsers throw for those. The drag
          // still works without capture in that case.
        }
      }}
      onPointerMove={drag}
      onPointerUp={(e) => {
        // A pointer can let go somewhere it never sent a move from.
        drag(e)
        const p = press.current
        if (p === null || e.pointerId !== p.id) {
          return
        }
        press.current = null
        // The URL takes a drag's value as it ends, and a click opens the
        // box with its value selected, ready to type over.
        if (p.dragging) {
          flushValue()
        } else {
          fieldRef.current?.focus()
          fieldRef.current?.select()
        }
      }}
      onPointerCancel={() => {
        if (press.current?.dragging === true) {
          flushValue()
        }
        press.current = null
      }}
    >
      <Chevron dir="left" />
      <input
        ref={fieldRef}
        id={id}
        type="text"
        className={style.field}
        value={draft ?? value.toFixed(2)}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit()
          }
        }}
        onBlur={commit}
      />
      <Chevron dir="right" />
    </div>
  )
}

// ‹ or › beside the value, in the parameter's colour. Hidden from screen
// readers, for whom they say nothing.
const Chevron = ({ dir }: { dir: "left" | "right" }) => (
  <svg className={style.chevron} width="6" height="12" viewBox="0 0 6 12" aria-hidden="true">
    <path d={dir === "left" ? "M5 2L1 6L5 10" : "M1 2L5 6L1 10"} />
  </svg>
)
