import { useRef } from "react"

import { ResetIcon } from "#src/components/ui/icons.tsx"
import { MathText } from "#src/components/ui/MathText.tsx"

import type { PartUi } from "../model/selectors.ts"
import type { FvExplainBy, PartEvents } from "../model/state.ts"

import { GROUP_MATH, groupName, RESET_ALL, SECTIONS, TRANSFORM_GROUPS } from "../copy.ts"
import { isIdentity, isScale, type TransformParam, type TransformParams } from "../math/form.ts"
import { PanelSection } from "./PanelSection.tsx"
import { TransformControl, type TransformControlHandle } from "./TransformControl.tsx"
import style from "./TransformGrid.module.css"

// Section 2 (fvTransformGrid): the controls in two columns that mirror the
// equation, outside f( ) (vertical: a, k) beside inside f( ) (horizontal: b,
// h). Reset all sits in the header while anything differs from the default:
// hidden, not disabled (FV 07). Used from the keyboard, it hands the focus
// to a's ruler as it leaves. Each group is named as said aloud ("Vertical,
// outside f"); its header is for the eye.
export function TransformGrid({
  params,
  uiOf,
  eventsOf,
  onChange,
  onReset,
  onResetAll,
  onFlip,
  onExplain,
  explaining,
}: {
  params: TransformParams
  uiOf: (param: TransformParam) => PartUi
  eventsOf: (param: TransformParam) => PartEvents
  /** A value from a control: typed into its field, or from its ruler. */
  onChange: (param: TransformParam, value: number, typed: boolean) => void
  onReset: (param: TransformParam) => void
  onResetAll: () => void
  onFlip: (param: "a" | "b") => void
  /** A control's letter chip or ? asks its explainer open or closed (D12). */
  onExplain: (param: TransformParam, by: FvExplainBy, open: boolean | "toggle") => void
  /** The open explainer, by parameter, and its id. */
  explaining: { param: TransformParam; id: string } | null
}) {
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
            <div key={group.axis} role="group" aria-label={groupName(group)} className={style.group}>
              <div className={style.group_header} aria-hidden="true">
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
                  ui={uiOf(param)}
                  events={eventsOf(param)}
                  onChange={(value, typed) => onChange(param, value, typed)}
                  onReset={() => onReset(param)}
                  onExplain={(by, open) => onExplain(param, by, open)}
                  explainerId={explaining?.param === param ? explaining.id : undefined}
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
