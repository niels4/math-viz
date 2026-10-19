import { useAtomValue, useSetAtom } from "jotai"
import { useId, useState } from "react"

import { useQueryParam } from "#src/components/router/queryParamAtom.ts"

import { transformParams } from "../queryParams"
import { focusAtom, highlightAtoms, hoverAtoms, type TransformParam } from "../state"
import style from "./TransformRow.module.css"

// One transform parameter: its name, and its value in a box you can type in.
// Pointing at the row or focusing its box highlights the parameter everywhere
// it shows, and the row lights up wherever the highlight comes from.
export const TransformRow = ({ name, param }: { name: string; param: TransformParam }) => {
  const urlParam = transformParams[param]
  const [value, setValue] = useQueryParam(urlParam)
  const lit = useAtomValue(highlightAtoms[param])
  const setHover = useSetAtom(hoverAtoms[param])
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
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setFocus(param)}
      onBlur={() => setFocus(null)}
    >
      {/* The parameter's letter in its colour, as in the equation. Hidden
          from screen readers, which hear the name. */}
      <span className={style.chip} aria-hidden="true">
        <var>{param}</var>
      </span>
      <label htmlFor={id} className={style.name}>
        {name}
      </label>
      <input
        id={id}
        type="text"
        className={style.box}
        value={draft ?? value.toFixed(2)}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit()
          }
        }}
        onBlur={commit}
      />
    </div>
  )
}
