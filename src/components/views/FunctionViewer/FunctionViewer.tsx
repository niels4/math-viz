import { useMemo, useReducer } from "react"

import workSansStyles from "#src/style/fonts/work_sans/work_sans.module.css"

import { HintBar } from "../../ui/HintBar.tsx"
import { MathText } from "../../ui/MathText.tsx"
import { SettingsMenu } from "../../ui/SettingsMenu.tsx"
import { ThemeChip } from "../../ui/ThemeChip.tsx"
import { TopBar } from "../../ui/TopBar.tsx"
import { CartesianPlane } from "../CartesianPlane/CartesianPlane"
import { PLANE_KEY_HELP, SECTIONS, VIEW_SUBTITLE, VIEW_TITLE } from "./copy.ts"
import style from "./FunctionViewer.module.css"
import { GhostToggle } from "./GhostToggle.tsx"
import { hintContext, hintFor } from "./model/hints.ts"
import { fvReducer } from "./model/reducer.ts"
import { curveAt, isTransformed, partUi, pLit, pOffView } from "./model/selectors.ts"
import { initialFvState, type FvPart, type PartEvents } from "./model/state.ts"
import { EquationCard } from "./panel/EquationCard.tsx"
import { FunctionPicker } from "./panel/FunctionPicker.tsx"
import { PanelSection } from "./panel/PanelSection.tsx"
import { PCard, QCard } from "./panel/PointCards.tsx"
import { TransformGrid } from "./panel/TransformGrid.tsx"
import { buildPlaneScene } from "./planeScene.ts"

/** FV 07: [ and ] move P along the curve by 0.1. */
const P_KEY_STEP = 0.1

export function FunctionViewer() {
  const [state, dispatch] = useReducer(fvReducer, initialFvState)
  const { fn, params, pX, qX, ghostOn } = state
  const lit = pLit(state)
  // Only what the scene shows: a reported view change must not rebuild it.
  const scene = useMemo(
    () => buildPlaneScene({ fn, params, pX, qX, ghostOn, pLit: lit }),
    [fn, params, pX, qX, ghostOn, lit],
  )
  // Each panel part reports its hover, focus, drag and edit as its own actions.
  const eventsOf = (part: FvPart): PartEvents => ({
    onHover: (on) => dispatch({ type: "hover", part, on }),
    onFocus: (on) => dispatch({ type: "focus", part, on }),
    onDrag: (mode) => dispatch({ type: "drag", part, mode }),
    onEdit: (edit) => dispatch({ type: "edit", part, edit }),
  })

  return (
    <div className={`${style.page} ${workSansStyles.font}`}>
      <TopBar
        className={style.topbar}
        title={VIEW_TITLE}
        subtitle={VIEW_SUBTITLE}
        actions={
          <>
            <ThemeChip />
            <SettingsMenu />
          </>
        }
      />
      <aside className={style.panel}>
        <PanelSection {...SECTIONS.function}>
          <FunctionPicker value={fn} onChange={(next) => dispatch({ type: "setFunction", fn: next })} />
          <EquationCard fn={fn} params={params} />
        </PanelSection>
        <TransformGrid
          params={params}
          uiOf={(param) => partUi(state, param)}
          eventsOf={eventsOf}
          onChange={(param, value) => dispatch({ type: "setParam", param, value })}
          onReset={(param) => dispatch({ type: "resetParam", param })}
          onResetAll={() => dispatch({ type: "resetAll" })}
          onFlip={(param) => dispatch({ type: "flip", param })}
        />
        <PanelSection {...SECTIONS.points}>
          <PCard
            x={pX}
            y={curveAt(state, pX)}
            extent={state.view?.extent ?? null}
            off={pOffView(state)}
            ui={partUi(state, "p")}
            events={eventsOf("p")}
            onChange={(x) => dispatch({ type: "setP", x })}
          />
          <QCard x={qX} y={qX === null ? null : curveAt(state, qX)} />
        </PanelSection>
        <div className={style.spacer} />
        <HintBar className={style.hint} hint={hintFor(hintContext(state))} testId="fv-hint" />
        <div className={style.tail} />
      </aside>
      <main className={style.plane}>
        <CartesianPlane
          scene={scene}
          caption={<MathText text="y = f(x)" />}
          tools={
            isTransformed(state) && (
              <GhostToggle fn={fn} on={ghostOn} onChange={(on) => dispatch({ type: "setGhost", on })} />
            )
          }
          keyHelp={PLANE_KEY_HELP}
          onViewChange={(view) => dispatch({ type: "setView", view })}
          onPointer={(pointer) =>
            dispatch(
              pointer === null
                ? { type: "planePointer", x: null }
                : {
                    type: "planePointer",
                    x: pointer.x,
                    ...(pointer.over === "p" && { over: "p" as const }),
                    panning: pointer.panning,
                  },
            )
          }
          onMarkDrag={(phase, id, to) => {
            if (id !== "p") {
              return
            }
            // P's x follows the pointer along the curve; the card and the
            // hint read the drag as P's.
            if (phase === "move") {
              dispatch({ type: "setP", x: to.x })
            } else {
              dispatch({ type: "drag", part: "p", mode: phase === "start" ? "coarse" : null })
            }
          }}
          onKeyDown={(e) => {
            const step = e.key === "[" ? -P_KEY_STEP : e.key === "]" ? P_KEY_STEP : 0
            if (step === 0 || e.ctrlKey || e.metaKey || e.altKey) {
              return false
            }
            dispatch({ type: "setP", x: pX + step })
            return true
          }}
        />
      </main>
    </div>
  )
}
