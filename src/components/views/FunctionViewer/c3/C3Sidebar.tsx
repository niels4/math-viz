import type { SidebarProps } from "../sidebar.ts"

import { SECTIONS } from "../copy.ts"
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
import equationStyle from "./C3Equation.module.css"
import pointStyle from "./PointRows.module.css"
import { PRow, QRow } from "./PointRows.tsx"
import { SubCard } from "./SubCard.tsx"

// figma0's SB3 · C3 · Ordinal correlations (the user's "ordinal color
// coordination"): B's number rows on B2's sub cards, each of a, k, b and h
// in one colour wherever it appears. Three sections, each on its own card:
// the function and its equation, the transforms, the points.
export function C3Sidebar({ state, dispatch, eventsOf, bindTerm }: SidebarProps) {
  const { fn, params, pX, qX } = state
  const slots = readoutSlots(state.view?.extent ?? null)
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
        />
      </SubCard>
      <SubCard title={SECTIONS.transform.title} testId="fv-section-transform">
        {null}
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
    </>
  )
}
