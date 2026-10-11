import { useRef } from "react"

import { Phrases } from "#src/components/ui/Phrases.tsx"

import type { SidebarProps } from "../sidebar.ts"
import type { ParamRowHandle } from "./ParamRow.tsx"

import { HINTS, SECTIONS } from "../copy.ts"
import { isIdentity, type TransformParam } from "../math/form.ts"
import { hintContext, hintFor } from "../model/hints.ts"
import {
  activeParams,
  curveAt,
  draggedParams,
  fineParams,
  partUi,
  pMoved,
  pOffView,
} from "../model/selectors.ts"
import { EquationCard } from "../panel/EquationCard.tsx"
import { FunctionPicker } from "../panel/FunctionPicker.tsx"
import { readoutSlots } from "../panel/readoutFit.ts"
import { C3_IDLE } from "./c3Copy.ts"
import equationStyle from "./C3Equation.module.css"
import style from "./C3Sidebar.module.css"
import pointStyle from "./PointRows.module.css"
import { PRow, QRow } from "./PointRows.tsx"
import { SubCard } from "./SubCard.tsx"
import { Tip } from "./Tip.tsx"
import { ResetAll, TransformRows } from "./TransformRows.tsx"

// figma0's SB3 · C3 · Ordinal correlations (the user's "ordinal color
// coordination"): B's number rows on B2's sub cards, each of a, k, b and h
// in one colour wherever it appears. Three sections, each on its own card:
// the function and its equation, the transforms, the points. No hint bar
// (B): tips show where they help (a row's, P's), the plane's keys at the
// panel's foot while the plane has the keyboard's focus, and screen readers
// hear the hint as they do on today's sidebar.
export function C3Sidebar({ state, dispatch, eventsOf, bindTerm, explaining }: SidebarProps) {
  const { fn, params, pX, qX } = state
  const slots = readoutSlots(state.view?.extent ?? null)
  const rowsRef = useRef(new Map<TransformParam, ParamRowHandle>())
  const context = hintContext(state)
  return (
    <>
      <SubCard title={SECTIONS.function.title} testId="fv-section-function">
        <FunctionPicker value={fn} onChange={(next) => dispatch({ type: "setFunction", fn: next })} />
        <EquationCard
          fn={fn}
          params={params}
          lit={activeParams(state)}
          keep={draggedParams(state)}
          fine={fineParams(state)}
          tip={state.hover === "eq" ? state.eqOver : null}
          onPointer={(over) => dispatch({ type: "eqPointer", over })}
          onLeave={() => dispatch({ type: "hover", part: "eq", on: false })}
          bindTerm={bindTerm}
          styles={equationStyle}
          formLabel={null}
          wholePxRuns
        />
      </SubCard>
      <SubCard
        title={SECTIONS.transform.title}
        testId="fv-section-transform"
        action={
          isIdentity(params) ? null : (
            <ResetAll onResetAll={() => dispatch({ type: "resetAll" })} rowsRef={rowsRef} />
          )
        }
      >
        <TransformRows
          params={params}
          uiOf={(param) => partUi(state, param)}
          eventsOf={eventsOf}
          onChange={(param, value, typed) => dispatch({ type: "setParam", param, value, jump: typed })}
          onReset={(param) => dispatch({ type: "resetParam", param })}
          onFlip={(param) => dispatch({ type: "flip", param })}
          onExplain={(param, by, open) => dispatch({ type: "explain", param, by, open })}
          explaining={explaining}
          rowsRef={rowsRef}
        />
      </SubCard>
      <SubCard title={SECTIONS.points.title} testId="fv-section-points">
        <div className={pointStyle.points}>
          <PRow
            x={pX}
            y={curveAt(state, pX)}
            extent={state.view?.extent ?? null}
            off={pOffView(state)}
            moved={pMoved(state)}
            slots={slots}
            ui={partUi(state, "p")}
            events={eventsOf("p")}
            onChange={(x) => dispatch({ type: "setP", x })}
          />
          <QRow x={qX} y={qX === null ? null : curveAt(state, qX)} slots={slots} />
        </div>
      </SubCard>
      {context.kind === "planeKeys" && (
        <Tip phrases={HINTS.planeKeys} className={style.foot_tip} testId="fv-plane-keys-tip" />
      )}
      <p role="status" className={style.spoken} data-testid="fv-hint-spoken">
        <Phrases phrases={context.kind === "idle" ? C3_IDLE : hintFor(context).phrases} />
      </p>
    </>
  )
}
