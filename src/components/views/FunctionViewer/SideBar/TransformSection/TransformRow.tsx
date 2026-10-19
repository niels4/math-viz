import { useAtomValue, useSetAtom } from "jotai"
import { useId, useState } from "react"

import { useQueryParam } from "#src/components/router/queryParamAtom.ts"

import { transformParams } from "../../queryParams"
import { focusAtom, highlightAtoms, hoverAtom, type TransformParam } from "../../state"
import style from "./TransformRow.module.css"

// One transform parameter: its name, and its value in a box you can type in.
// Pointing at the row or focusing its box highlights the parameter everywhere
// it shows, and the row lights up wherever the highlight comes from.
export const TransformRow = ({ name, param }: { name: string; param: TransformParam }) => {
  const urlParam = transformParams[param]
  const [value, setValue] = useQueryParam(urlParam)
  const lit = useAtomValue(highlightAtoms[param])
  const setHover = useSetAtom(hoverAtom)
  const setFocus = useSetAtom(focusAtom)
  // The text in the box while you type. Partial numbers such as "-" or "1."
  // stay here, and Enter or leaving the box sets the value. Text the URL
  // wouldn't accept either, such as a scale of 0, puts the old value back.
  const [draft, setDraft] = useState<string | null>(null)
  const id = useId()

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

  return (
    <div
      className={style.row}
      data-param={param}
      data-lit={lit ? "" : undefined}
      onPointerEnter={() => setHover(param, true)}
      onPointerLeave={() => setHover(param, false)}
      onFocus={() => setFocus(param, true)}
      onBlur={() => setFocus(param, false)}
    >
      {/* The parameter's letter in its colour, as in the equation. Hidden
          from screen readers, which hear the name. */}
      <span className={style.chip} aria-hidden="true">
        <var>{param}</var>
      </span>
      <label htmlFor={id} className={style.name}>
        {name}
      </label>
      <div className={style.box}>
        <Chevron dir="left" />
        <input
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
