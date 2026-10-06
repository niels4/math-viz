import { useReducer } from "react"

import stixStyles from "#src/style/fonts/stix_two_text/stix_two_text.module.css"
import workSansStyles from "#src/style/fonts/work_sans/work_sans.module.css"

import type { TransformParam } from "./math/form.ts"

import { Field } from "../../ui/Field"
import { SnowflakeIcon } from "../../ui/icons.tsx"
import { Select } from "../../ui/Select"
import { SettingsMenu } from "../../ui/SettingsMenu.tsx"
import { CartesianPlane } from "../CartesianPlane/CartesianPlane"
import style from "./FunctionViewer.module.css"
import { FunctionViewerSidebar } from "./FunctionViewerSidebar.tsx"
import { BASE_FUNCTION_SLUGS, BASE_FUNCTIONS, isBaseFunctionSlug } from "./math/baseFunctions.ts"
import { describeEquation, equationTokens } from "./math/equation.ts"
import { fvReducer } from "./model/reducer.ts"
import { curveAt } from "./model/selectors.ts"
import { initialFvState } from "./model/state.ts"
import { EquationTokens } from "./panel/EquationTokens.tsx"

const functionOptions = BASE_FUNCTION_SLUGS.map((slug) => ({
  value: slug,
  label: BASE_FUNCTIONS[slug].label,
}))

export function FunctionViewer() {
  const [state, dispatch] = useReducer(fvReducer, initialFvState)
  const { params } = state
  const equation = equationTokens(state.fn, params, "live")

  const setParam = (param: TransformParam) => (value: number) => dispatch({ type: "setParam", param, value })
  const onSelectFunction = (next: string) => {
    if (isBaseFunctionSlug(next)) {
      dispatch({ type: "setFunction", fn: next })
    }
  }

  return (
    <div className={`${style.page} ${workSansStyles.font}`}>
      <header className={style.topbar}>
        <a className={style.brand} href="#">
          <span className={style.brand_icon}>
            <SnowflakeIcon />
          </span>
          <span className={style.brand_text}>MathViz</span>
        </a>
        <div className={style.actions}>
          <SettingsMenu />
        </div>
        <div className={style.func_selector}>
          <Field className={style.func_label_hidden} label="Function" layout="inline">
            <div className={style.func_row}>
              <Select
                testId="func-select"
                value={state.fn}
                onChange={onSelectFunction}
                options={functionOptions}
              />
              <output
                className={`${style.func_readout} ${stixStyles.font}`}
                data-testid="func-readout"
                aria-label={describeEquation(equation)}
              >
                <span aria-hidden="true">
                  <EquationTokens tokens={equation} />
                </span>
              </output>
            </div>
          </Field>
        </div>
      </header>
      {/* The pre-v2 sidebar: X/Y Scale and Offset map to b, h, a, k; X Offset is the real shift h (D1). */}
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
        xExtent={state.extent}
      />
      <main className={style.main}>
        <CartesianPlane
          plotFunc={(x) => curveAt(state, x)}
          point1X={state.pX}
          point2X={state.qX ?? undefined}
          onExtentChange={(extent) => dispatch({ type: "setExtent", extent })}
          onPoint2Change={(x) => dispatch({ type: "setQ", x })}
        />
      </main>
    </div>
  )
}
