import { Fragment } from "react"

import { ResetIcon } from "#src/components/ui/icons.tsx"

import type { PartUi } from "../model/selectors.ts"
import type { FvExplainBy, PartEvents } from "../model/state.ts"

import { groupName, RESET_ALL, TRANSFORM_GROUPS } from "../copy.ts"
import { isScale, type TransformParam, type TransformParams } from "../math/form.ts"
import { ParamRow, type ParamRowHandle } from "./ParamRow.tsx"
import style from "./TransformRows.module.css"

// The Transform card's rows (SB3 · C3): the vertical pair, outside f( )
// (a, k), then an inset rule, then the horizontal pair, inside f( ) (b, h).
// Each pair is a group named as said aloud ("Vertical, outside f").
export function TransformRows({
  params,
  uiOf,
  eventsOf,
  onChange,
  onReset,
  onFlip,
  onExplain,
  explaining,
  rowsRef,
}: {
  params: TransformParams
  uiOf: (param: TransformParam) => PartUi
  eventsOf: (param: TransformParam) => PartEvents
  /** A value from a row: typed into its box, or dragged, keyed or wheeled. */
  onChange: (param: TransformParam, value: number, typed: boolean) => void
  onReset: (param: TransformParam) => void
  onFlip: (param: "a" | "b") => void
  /** A row's letter chip or ? asks its explainer open or closed (D12). */
  onExplain: (param: TransformParam, by: FvExplainBy, open: boolean | "toggle") => void
  /** The open explainer, by parameter, and its id. */
  explaining: { param: TransformParam; id: string } | null
  /** The rows by parameter, for the focus Reset all hands on. */
  rowsRef: { current: Map<TransformParam, ParamRowHandle> }
}) {
  return (
    <div className={style.rows}>
      {TRANSFORM_GROUPS.map((group, i) => (
        <Fragment key={group.axis}>
          {i > 0 && <div className={style.rule} aria-hidden="true" />}
          <div role="group" aria-label={groupName(group)} className={style.group}>
            {group.params.map((param) => (
              <ParamRow
                key={param}
                ref={(handle) => {
                  if (handle === null) {
                    rowsRef.current.delete(param)
                  } else {
                    rowsRef.current.set(param, handle)
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
        </Fragment>
      ))}
    </div>
  )
}

// Reset all (SB3 · C3 › Transform head): shown while anything differs from
// the default, hidden, not disabled (FV 07). Used from the keyboard, it
// hands the focus to a's box as it leaves.
export function ResetAll({
  onResetAll,
  rowsRef,
}: {
  onResetAll: () => void
  rowsRef: { current: Map<TransformParam, ParamRowHandle> }
}) {
  return (
    <button
      type="button"
      className={style.reset_all}
      data-testid="fv-reset-all"
      onClick={(event) => {
        const focused = document.activeElement === event.currentTarget
        onResetAll()
        if (focused) {
          rowsRef.current.get("a")?.focus()
        }
      }}
    >
      <ResetIcon />
      {RESET_ALL}
    </button>
  )
}
