import { useAtomValue, useSetAtom } from "jotai"
import { useId } from "react"

import { useQueryParam } from "#src/components/router/queryParamAtom.ts"

import { transformParams } from "../../queryParams.ts"
import { focusAtom, highlightAtoms, hoverAtom, type TransformParam } from "../../state"
import { ScrubValue } from "./ScrubValue/ScrubValue.tsx"
import style from "./TransformRow.module.css"

export const TransformRow = ({ name, param }: { name: string; param: TransformParam }) => {
  const lit = useAtomValue(highlightAtoms[param])
  const setHover = useSetAtom(hoverAtom)
  const setFocus = useSetAtom(focusAtom)
  const id = useId()
  const urlParam = transformParams[param]
  const [value, setValue] = useQueryParam(urlParam)

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
      {value !== urlParam.defaultValue && (
        // Not a tab stop, like the box's double-click: a pointer's shortcut
        // for typing the default.
        <button
          type="button"
          tabIndex={-1}
          className={style.reset}
          aria-label={`Reset ${name} to ${urlParam.defaultValue}`}
          onClick={(e) => {
            // The button goes away once used, and the row never hears that
            // a removed element lost the focus, so it lets go of it first.
            e.currentTarget.blur()
            setValue(urlParam.defaultValue, { flush: true })
          }}
        >
          <ResetIcon />
        </button>
      )}
      <ScrubValue id={id} param={param} />
    </div>
  )
}

// ↺, an arrow curling back.
const ResetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="M12.213 4.465A5.5 5.5 0 1 1 4.465 3.787"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
    <path d="M9.013 0.865L14.813 2.065L11.813 6.865Z" fill="currentColor" />
  </svg>
)
