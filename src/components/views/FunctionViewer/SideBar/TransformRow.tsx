import { useState } from "react"

import { useQueryParam, type QueryParamDef } from "#src/components/router/queryParamAtom.ts"

import style from "./TransformRow.module.css"

// One transform parameter: its name, and its value in a box you can type in.
export const TransformRow = ({ name, param }: { name: string; param: QueryParamDef<number> }) => {
  const [value, setValue] = useQueryParam(param)
  // The text in the box while you type. Partial numbers such as "-" or "1."
  // stay here, and Enter or leaving the box sets the value. Text the URL
  // wouldn't accept either, such as a scale of 0, puts the old value back.
  const [draft, setDraft] = useState<string | null>(null)

  const commit = () => {
    if (draft === null) {
      return
    }
    const next = param.parse(draft)
    if (next !== undefined) {
      setValue(next, { flush: true })
    }
    setDraft(null)
  }

  return (
    <label className={style.row}>
      <span className={style.name}>{name}</span>
      <input
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
    </label>
  )
}
