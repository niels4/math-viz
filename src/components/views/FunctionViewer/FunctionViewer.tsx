import { useMemo, useReducer } from "react"

import workSansStyles from "#src/style/fonts/work_sans/work_sans.module.css"

import type { TransformParam } from "./math/form.ts"

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
import { buildPlaneScene } from "./planeScene.ts"

export function FunctionViewer() {
  const [state, dispatch] = useReducer(fvReducer, initialFvState)
  const { fn, params, pX, qX } = state
  // Only what the scene shows: a reported view change must not rebuild it.
  const scene = useMemo(() => buildPlaneScene({ fn, params, pX, qX }), [fn, params, pX, qX])

  const setParam = (param: TransformParam) => (value: number) => dispatch({ type: "setParam", param, value })

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
        {/* The pre-v2 controls as sections 2 and 3 until M5 and M6: X/Y Scale and
        Offset map to b, h, a, k; X Offset is the real shift h (D1). */}
        <FunctionViewerSidebar
          xScale={params.b}
          setXScale={setParam("b")}
          xOffset={params.h}
          setXOffset={setParam("h")}
          yScale={params.a}
          setYScale={setParam("a")}
          yOffset={params.k}
          setYOffset={setParam("k")}
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
