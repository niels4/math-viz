import { useAtomValue, useSetAtom } from "jotai"
import { useId } from "react"

import { focusAtom, highlightAtoms, hoverAtom, type TransformParam } from "../../state"
import { ScrubValue } from "./ScrubValue/ScrubValue.tsx"
import style from "./TransformRow.module.css"

export const TransformRow = ({ name, param }: { name: string; param: TransformParam }) => {
  const lit = useAtomValue(highlightAtoms[param])
  const setHover = useSetAtom(hoverAtom)
  const setFocus = useSetAtom(focusAtom)
  const id = useId()

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
      <span className={style.chip} aria-hidden="true">
        <var>{param}</var>
      </span>
      <label htmlFor={id} className={style.name}>
        {name}
      </label>
      <ScrubValue id={id} param={param} />
    </div>
  )
}
