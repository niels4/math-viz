import { useMemo, useReducer } from "react"

import workSansStyles from "#src/style/fonts/work_sans/work_sans.module.css"

import { MathText } from "../../ui/MathText.tsx"
import { SettingsMenu } from "../../ui/SettingsMenu.tsx"
import { ThemeChip } from "../../ui/ThemeChip.tsx"
import { TopBar } from "../../ui/TopBar.tsx"
import { CartesianPlane } from "../CartesianPlane/CartesianPlane"
import { SECTIONS, VIEW_SUBTITLE, VIEW_TITLE } from "./copy.ts"
import style from "./FunctionViewer.module.css"
import { FunctionViewerSidebar } from "./FunctionViewerSidebar.tsx"
import { fvReducer } from "./model/reducer.ts"
import { initialFvState } from "./model/state.ts"
import { EquationCard } from "./panel/EquationCard.tsx"
import { FunctionPicker } from "./panel/FunctionPicker.tsx"
import { PanelSection } from "./panel/PanelSection.tsx"
import { TransformGrid } from "./panel/TransformGrid.tsx"
import { buildPlaneScene } from "./planeScene.ts"

export function FunctionViewer() {
  const [state, dispatch] = useReducer(fvReducer, initialFvState)
  const { fn, params, pX, qX } = state
  // Only what the scene shows: a reported view change must not rebuild it.
  const scene = useMemo(() => buildPlaneScene({ fn, params, pX, qX }), [fn, params, pX, qX])

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
          onChange={(param, value) => dispatch({ type: "setParam", param, value })}
          onReset={(param) => dispatch({ type: "resetParam", param })}
          onResetAll={() => dispatch({ type: "resetAll" })}
          onFlip={(param) => dispatch({ type: "flip", param })}
        />
        {/* The pre-v2 points controls as section 3 until M6. */}
        <FunctionViewerSidebar
          point1X={state.pX}
          setPoint1X={(x) => dispatch({ type: "setP", x })}
          point2X={state.qX}
          xExtent={state.view?.extent ?? null}
        />
      </aside>
      <main className={style.plane}>
        <CartesianPlane
          scene={scene}
          caption={<MathText text="y = f(x)" />}
          onViewChange={(view) => dispatch({ type: "setView", view })}
          onPointer={(point) => dispatch({ type: "setQ", x: point === null ? null : point.x })}
        />
      </main>
    </div>
  )
}
