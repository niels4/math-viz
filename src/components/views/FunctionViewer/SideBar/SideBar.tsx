import type { ReactNode } from "react"

import { useQueryParam } from "#src/components/router/queryParamAtom.ts"

import { funcParam, type FunctionSlug } from "../queryParams"
import style from "./SideBar.module.css"

const functionLabels: Record<FunctionSlug, ReactNode> = {
  x1: <var>x</var>,
  x2: (
    <>
      <var>x</var>²
    </>
  ),
  x3: (
    <>
      <var>x</var>³
    </>
  ),
  sinx: (
    <>
      sin <var>x</var>
    </>
  ),
}

const FunctionSelector = () => {
  const [func, setFunc] = useQueryParam(funcParam)

  return (
    <div className={style.card}>
      <fieldset className={style.function_selector}>
        <legend className={style.function_title}>Function</legend>

        <div className={style.function_buttons}>
          {Object.entries(functionLabels).map(([slug, label]) => (
            <label key={slug} className={style.function_input}>
              <input
                type="radio"
                name="func"
                value={slug}
                checked={slug === func}
                onChange={() => setFunc(slug as FunctionSlug, { flush: true })}
              />
              {/* In a span, so the flex label keeps the space in "sin x". */}
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  )
}

export const SideBar = () => {
  return (
    <div className={style.sidebar}>
      <FunctionSelector />
    </div>
  )
}
