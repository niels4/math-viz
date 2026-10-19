import { useAtomValue } from "jotai"
import { useState } from "react"

import { useQueryParam } from "#src/components/router/queryParamAtom.ts"

import { transformParams } from "../../queryParams"
import { highlightAtoms, type TransformParam } from "../../state"
import style from "./ScrubValue.module.css"

// A transform parameter's value in a box you can type in, between ‹ and ›.
// `id` lets the row's label name the box.
export const ScrubValue = ({ id, param }: { id: string; param: TransformParam }) => {
  const urlParam = transformParams[param]
  const [value, setValue] = useQueryParam(urlParam)
  const lit = useAtomValue(highlightAtoms[param])
  // The text in the box while you type. Partial numbers such as "-" or "1."
  // stay here, and Enter or leaving the box sets the value. Text the URL
  // wouldn't accept either, such as a scale of 0, puts the old value back.
  const [draft, setDraft] = useState<string | null>(null)

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
    <div className={style.box} data-lit={lit ? "" : undefined}>
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
  )
}

// ‹ or › beside the value, in the parameter's colour. Hidden from screen
// readers, for whom they say nothing.
const Chevron = ({ dir }: { dir: "left" | "right" }) => (
  <svg className={style.chevron} width="6" height="12" viewBox="0 0 6 12" aria-hidden="true">
    <path d={dir === "left" ? "M5 2L1 6L5 10" : "M1 2L5 6L1 10"} />
  </svg>
)
