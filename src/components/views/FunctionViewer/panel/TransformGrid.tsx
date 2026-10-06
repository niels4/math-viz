import { useId, useRef } from "react"

import { ResetIcon } from "#src/components/ui/icons.tsx"
import { MathText } from "#src/components/ui/MathText.tsx"

import { GROUP_MATH, RESET_ALL, SECTIONS, TRANSFORM_GROUPS } from "../copy.ts"
import { isIdentity, isScale, type TransformParam, type TransformParams } from "../math/form.ts"
import { PanelSection } from "./PanelSection.tsx"
import { TransformControl, type TransformControlHandle } from "./TransformControl.tsx"
import style from "./TransformGrid.module.css"

// Section 2 (fvTransformGrid): the controls in two columns that mirror the
// equation, outside f( ) (vertical: a, k) beside inside f( ) (horizontal: b,
// h). Reset all sits in the header while anything differs from the default:
// hidden, not disabled (FV 07). Used from the keyboard, it hands the focus
// to a's ruler as it leaves.
export function TransformGrid({
  params,
  onChange,
  onReset,
  onResetAll,
  onFlip,
}: {
  params: TransformParams
  onChange: (param: TransformParam, value: number) => void
  onReset: (param: TransformParam) => void
  onResetAll: () => void
  onFlip: (param: "a" | "b") => void
}) {
  const id = useId()
  const controls = useRef(new Map<TransformParam, TransformControlHandle>())
  const resetAll = isIdentity(params) ? null : (
    <button
      type="button"
      className={style.reset_all}
      data-testid="fv-reset-all"
      onClick={(event) => {
        const focused = document.activeElement === event.currentTarget
        onResetAll()
        if (focused) {
          controls.current.get("a")?.focus()
        }
      }}
    >
      <ResetIcon />
      {RESET_ALL}
    </button>
  )
  return (
    <PanelSection {...SECTIONS.transform} action={resetAll}>
      <div className={style.columns}>
        <div className={style.grid}>
          {TRANSFORM_GROUPS.map((group) => (
            <div
              key={group.axis}
              role="group"
              aria-labelledby={`${id}-${group.axis}`}
              className={style.group}
            >
              <div id={`${id}-${group.axis}`} className={style.group_header}>
                <span className={style.axis}>{group.axis}</span>
                <span className={style.where}>{group.where}</span>
                <span className={style.math}>
                  <MathText text={GROUP_MATH} />
                </span>
              </div>
              {group.params.map((param) => (
                <TransformControl
                  key={param}
                  ref={(handle) => {
                    if (handle === null) {
                      controls.current.delete(param)
                    } else {
                      controls.current.set(param, handle)
                    }
                  }}
                  param={param}
                  value={params[param]}
                  onChange={(value) => onChange(param, value)}
                  onReset={() => onReset(param)}
                  {...(isScale(param) ? { onFlip: () => onFlip(param) } : {})}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </PanelSection>
  )
}
