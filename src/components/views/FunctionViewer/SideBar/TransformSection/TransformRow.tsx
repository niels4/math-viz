import { useAtomValue, useSetAtom } from "jotai"
import { useId } from "react"

import { useQueryParam } from "#src/components/router/queryParamAtom.ts"

import { transformParams } from "../../queryParams"
import { focusAtom, highlightAtoms, hoverAtom, jumpsAtom, type TransformParam } from "../../state"
import { FlipIcon } from "./FlipIcon.tsx"
import { ResetIcon } from "./ResetIcon.tsx"
import { ScrubValue } from "./ScrubValue/ScrubValue.tsx"
import style from "./TransformRow.module.css"
import { useReset } from "./useReset.ts"

export const TransformRow = ({ name, param }: { name: string; param: TransformParam }) => {
  const lit = useAtomValue(highlightAtoms[param])
  const setHover = useSetAtom(hoverAtom)
  const setFocus = useSetAtom(focusAtom)
  const setJumps = useSetAtom(jumpsAtom)
  const id = useId()
  const { changed, defaultValue, jump, reset } = useReset(param)
  const [value, setValue] = useQueryParam(transformParams[param])
  const isScale = param === "a" || param === "b"

  return (
    <div
      className={style.row}
      data-param={param}
      data-lit={lit ? "" : undefined}
      onPointerEnter={() => setHover([param], true)}
      onPointerLeave={() => setHover([param], false)}
      onFocus={() => setFocus([param], true)}
      onBlur={() => setFocus([param], false)}
    >
      <span className={style.chip} aria-hidden="true">
        <var>{param}</var>
      </span>
      <label htmlFor={id} className={style.name}>
        {name}
      </label>
      {isScale && (
        <button
          type="button"
          className={style.flip}
          aria-label={param === "a" ? "Flip upside down" : "Mirror left to right"}
          aria-pressed={value < 0}
          onClick={(e) => {
            if (e.detail > 0) {
              e.currentTarget.blur()
            }
            setJumps([{ param, from: value, to: -value }])
            setValue(-value, { flush: true })
          }}
        >
          <FlipIcon axis={param === "a" ? "vertical" : "horizontal"} />
        </button>
      )}
      <span className={style.reset_slot}>
        {changed && (
          <button
            type="button"
            tabIndex={-1}
            className={style.reset}
            aria-label={`Reset ${name} to ${defaultValue}`}
            onClick={(e) => {
              e.currentTarget.blur()
              setJumps([jump])
              reset()
            }}
          >
            <ResetIcon />
          </button>
        )}
      </span>
      <ScrubValue id={id} param={param} />
    </div>
  )
}
