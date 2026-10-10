import { HintBar } from "#src/components/ui/HintBar.tsx"

import type { SidebarProps } from "../sidebar.ts"

import { SECTIONS } from "../copy.ts"
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
import { EquationCard } from "./EquationCard.tsx"
import { FunctionPicker } from "./FunctionPicker.tsx"
import { PanelSection } from "./PanelSection.tsx"
import { PCard, QCard } from "./PointCards.tsx"
import { readoutSlots } from "./readoutFit.ts"
import style from "./RulerSidebar.module.css"
import { TransformGrid } from "./TransformGrid.tsx"

// Today's sidebar (figma0 FV · Recommended, the user's rulings since):
// three numbered sections (the function and its equation, the transforms
// as rulers in two columns, P's card and Q's), then the hint bar at the
// panel's foot.
export function RulerSidebar({ state, dispatch, eventsOf, bindTerm, explaining }: SidebarProps) {
  const { fn, params, pX, qX } = state
  const slots = readoutSlots(state.view?.extent ?? null)
  return (
    <>
      <PanelSection {...SECTIONS.function}>
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
        />
      </PanelSection>
      <TransformGrid
        params={params}
        uiOf={(param) => partUi(state, param)}
        eventsOf={eventsOf}
        onChange={(param, value, typed) => dispatch({ type: "setParam", param, value, jump: typed })}
        onReset={(param) => dispatch({ type: "resetParam", param })}
        onResetAll={() => dispatch({ type: "resetAll" })}
        onFlip={(param) => dispatch({ type: "flip", param })}
        onExplain={(param, by, open) => dispatch({ type: "explain", param, by, open })}
        explaining={explaining}
      />
      <PanelSection {...SECTIONS.points}>
        <PCard
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
        <QCard x={qX} y={qX === null ? null : curveAt(state, qX)} slots={slots} />
      </PanelSection>
      <div className={style.spacer} />
      <HintBar className={style.hint} hint={hintFor(hintContext(state))} testId="fv-hint" />
      <div className={style.tail} />
    </>
  )
}
