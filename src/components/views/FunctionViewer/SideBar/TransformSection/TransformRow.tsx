import { useAtomValue, useSetAtom } from "jotai"
import { useId } from "react"

import { focusAtom, highlightAtoms, hoverAtom, type TransformParam } from "../../state"
import { ScrubValue } from "./ScrubValue.tsx"
import style from "./TransformRow.module.css"

// One transform parameter: its name, and its value in a box you can type in.
// Pointing at the row or focusing its box highlights the parameter everywhere
// it shows, and the row lights up wherever the highlight comes from.
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
      {/* The parameter's letter in its colour, as in the equation. Hidden
          from screen readers, which hear the name. */}
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
